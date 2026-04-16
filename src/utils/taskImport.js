const MAX_IMPORT_FILE_BYTES = 2 * 1024 * 1024
const MAX_ROWS_PER_SHEET = 5000
const MAX_TOTAL_ROWS = 10000
let excelJsModulePromise

const DEFAULT_COLUMN_ALIASES = {
  name: [
    'name',
    'task',
    'task name',
    'title',
    'assignment',
    'project',
    'project title',
    'lesson',
    'lesson title',
    'lesson name',
    'activity',
    'course topics',
    'course topic',
  ],
  description: ['description', 'details', 'notes', 'summary'],
  dueDate: ['due date', 'due', 'deadline', 'date due'],
}

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function ensureImportFileIsSafe(file) {
  if (!file) {
    throw new Error('Please choose an Excel file first.')
  }

  const lowerCaseName = String(file.name ?? '').toLowerCase()
  if (!lowerCaseName.endsWith('.xlsx')) {
    throw new Error('Only .xlsx files are supported.')
  }

  if (typeof file.size === 'number' && file.size > MAX_IMPORT_FILE_BYTES) {
    throw new Error('File is too large. Please upload an .xlsx file smaller than 2MB.')
  }
}

function toTextFromCellValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  if (value instanceof Date) {
    return toDateInputValue(value)
  }

  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) {
      return value.richText.map((item) => item?.text ?? '').join('')
    }

    if (typeof value.text === 'string') {
      return value.text
    }

    if (value.hyperlink) {
      return String(value.text ?? value.hyperlink)
    }

    if (value.result !== undefined && value.result !== null) {
      return toTextFromCellValue(value.result)
    }

    if (value.formula) {
      return ''
    }
  }

  return String(value)
}

function toRawCellValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'object') {
    if (value.result !== undefined && value.result !== null) {
      return value.result
    }

    if (Array.isArray(value.richText)) {
      return value.richText.map((item) => item?.text ?? '').join('')
    }

    if (typeof value.text === 'string') {
      return value.text
    }

    if (value.hyperlink) {
      return String(value.text ?? value.hyperlink)
    }

    if (value.formula) {
      return ''
    }
  }

  return value
}

function buildUniqueHeaders(rawHeaders) {
  const seenHeaders = new Map()

  return rawHeaders.map((header, index) => {
    const baseHeader = toTrimmedText(header) || `Column ${index + 1}`
    const seenCount = seenHeaders.get(baseHeader) ?? 0
    seenHeaders.set(baseHeader, seenCount + 1)

    if (seenCount === 0) {
      return baseHeader
    }

    return `${baseHeader} (${seenCount + 1})`
  })
}

function parseWorksheetRows(worksheet) {
  const headerRow = worksheet.getRow(1)
  const columnCount = Math.max(worksheet.columnCount || 0, headerRow.cellCount || 0, 1)

  const rawHeaders = Array.from({ length: columnCount }, (_, index) => {
    const cellValue = headerRow.getCell(index + 1).value
    return toTextFromCellValue(cellValue)
  })

  const headers = buildUniqueHeaders(rawHeaders)
  const rows = []

  for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex)
    const rowRecord = {}
    let hasAnyValue = false

    for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
      const header = headers[columnIndex]
      const cellValue = toRawCellValue(row.getCell(columnIndex + 1).value)
      rowRecord[header] = cellValue

      if (!hasAnyValue && hasNonEmptyValue(cellValue)) {
        hasAnyValue = true
      }
    }

    if (hasAnyValue) {
      rows.push(rowRecord)
    }
  }

  return {
    headers,
    rows,
  }
}

function ensureRowLimits(rows, sheetName) {
  if (rows.length > MAX_ROWS_PER_SHEET) {
    throw new Error(`Sheet "${sheetName}" has too many rows. Limit is ${MAX_ROWS_PER_SHEET}.`)
  }
}

function ensureTotalRowLimit(totalRows) {
  if (totalRows > MAX_TOTAL_ROWS) {
    throw new Error(`Workbook has too many rows. Limit is ${MAX_TOTAL_ROWS}.`)
  }
}

async function readWorkbookFromFile(file) {
  ensureImportFileIsSafe(file)

  const arrayBuffer = await file.arrayBuffer()
  if (!excelJsModulePromise) {
    excelJsModulePromise = import('exceljs')
  }

  const excelJsModule = await excelJsModulePromise
  const ExcelWorkbook = excelJsModule.Workbook ?? excelJsModule.default?.Workbook

  if (!ExcelWorkbook) {
    throw new Error('Excel parser failed to load. Please refresh and try again.')
  }

  const workbook = new ExcelWorkbook()
  await workbook.xlsx.load(arrayBuffer)
  return workbook
}

function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseExcelNumericDate(value, options = {}) {
  const { date1904 = false } = options

  if (!Number.isFinite(value)) {
    return null
  }

  // Support compact numeric dates like 20260416 from exports that do not keep true date cells.
  if (Number.isInteger(value)) {
    const compactValue = String(value)
    if (/^\d{8}$/.test(compactValue)) {
      const year = Number(compactValue.slice(0, 4))
      const month = Number(compactValue.slice(4, 6))
      const day = Number(compactValue.slice(6, 8))
      const compactDate = new Date(year, month - 1, day)

      if (
        year >= 1900 &&
        year <= 2200 &&
        compactDate.getFullYear() === year &&
        compactDate.getMonth() === month - 1 &&
        compactDate.getDate() === day
      ) {
        return compactDate
      }
    }
  }

  // Guard against plain integers (e.g., 12 or 2026) being interpreted as Excel serial dates in 1900.
  if (value < 20000 || value > 80000) {
    return null
  }

  const excelEpoch = date1904
    ? Date.UTC(1904, 0, 1)
    : Date.UTC(1899, 11, 30)
  const dayInMilliseconds = 24 * 60 * 60 * 1000
  const wholeDays = Math.floor(value)
  const fractionalDays = value - wholeDays

  const candidateTimestamp = excelEpoch + wholeDays * dayInMilliseconds + Math.round(fractionalDays * dayInMilliseconds)
  const candidate = new Date(candidateTimestamp)

  if (!date1904 && wholeDays >= 60) {
    candidate.setDate(candidate.getDate() - 1)
  }

  return Number.isNaN(candidate.getTime()) ? null : candidate
}

function normalizeDueDate(value, options = {}) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : toDateInputValue(value)
  }

  if (typeof value === 'number') {
    const numericDate = parseExcelNumericDate(value, options)
    return numericDate ? toDateInputValue(numericDate) : null
  }

  const asText = String(value).trim()
  if (!asText) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(asText)) {
    return asText
  }

  const parsedDate = new Date(asText)
  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return toDateInputValue(parsedDate)
}

function toTrimmedText(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

function hasNonEmptyValue(value) {
  return toTrimmedText(value) !== ''
}

function looksLikeDateValue(value, options = {}) {
  return normalizeDueDate(value, options) !== null
}

function looksLikeNameText(value, options = {}) {
  const text = toTrimmedText(value)
  if (!text) {
    return false
  }

  // Prefer text-like cells for task names instead of plain IDs or date-like values.
  return /[a-z]/i.test(text) && !looksLikeDateValue(value, options)
}

function inferTaskFieldsFromRowValues(row, options = {}) {
  const values = Object.values(row)
  const nonEmptyValues = values.filter((value) => toTrimmedText(value) !== '')

  const inferredNameValue =
    nonEmptyValues.find((value) => looksLikeNameText(value, options)) ??
    nonEmptyValues.find((value) => !looksLikeDateValue(value, options)) ??
    ''

  const inferredDescriptionValue =
    nonEmptyValues.find((value) => value !== inferredNameValue && !looksLikeDateValue(value, options)) ?? ''

  const inferredDueDateValue = nonEmptyValues.find((value) => looksLikeDateValue(value, options)) ?? null

  return {
    nameValue: inferredNameValue,
    descriptionValue: inferredDescriptionValue,
    dueDateValue: inferredDueDateValue,
  }
}

function findColumnKey(headers, aliases) {
  const normalizedHeaderPairs = headers.map((header) => [header, normalizeHeader(header)])
  const normalizedAliases = aliases.map(normalizeHeader)

  for (const [rawHeader, normalizedHeader] of normalizedHeaderPairs) {
    if (normalizedAliases.includes(normalizedHeader)) {
      return rawHeader
    }
  }

  return null
}

function resolveColumnMap(headers, customAliases = {}) {
  const mergedAliases = {
    name: customAliases.name ?? DEFAULT_COLUMN_ALIASES.name,
    description: customAliases.description ?? DEFAULT_COLUMN_ALIASES.description,
    dueDate: customAliases.dueDate ?? DEFAULT_COLUMN_ALIASES.dueDate,
  }

  return {
    nameKey: findColumnKey(headers, mergedAliases.name),
    descriptionKey: findColumnKey(headers, mergedAliases.description),
    dueDateKey: findColumnKey(headers, mergedAliases.dueDate),
  }
}

function normalizeTaskFromRow(row, columnMap, options = {}) {
  const fallbackName =
    row.Task ??
    row.task ??
    row.Name ??
    row.name ??
    row.Title ??
    row.title ??
    row.Project ??
    row.project ??
    row['Project Title'] ??
    row['project title'] ??
    row.Lesson ??
    row.lesson ??
    row['Lesson Title'] ??
    row['lesson title'] ??
    row['Course Topics'] ??
    row['course topics']
  const inferredFields = inferTaskFieldsFromRowValues(row, options)

  const nameValue =
    (columnMap.nameKey ? row[columnMap.nameKey] : null) ??
    fallbackName ??
    inferredFields.nameValue ??
    ''
  const descriptionValue =
    (columnMap.descriptionKey ? row[columnMap.descriptionKey] : null) ??
    inferredFields.descriptionValue ??
    ''
  const dueDateValue =
    (columnMap.dueDateKey ? row[columnMap.dueDateKey] : null) ??
    inferredFields.dueDateValue ??
    null

  const name = String(nameValue).trim()
  if (!name) {
    return null
  }

  const description = String(descriptionValue ?? '').trim()
  const normalizedDueDate = normalizeDueDate(dueDateValue, options)
  const hasDueDateParseWarning = hasNonEmptyValue(dueDateValue) && normalizedDueDate === null

  return {
    name,
    description,
    dueDate: normalizedDueDate,
    hasDueDateParseWarning,
    dueDateRaw: hasDueDateParseWarning ? toTrimmedText(dueDateValue) : '',
  }
}

function extractTasksFromRows(rows, headers, customAliases, options = {}) {

  if (rows.length === 0) {
    return []
  }

  const detectedColumnMap = resolveColumnMap(headers, customAliases)
  const explicitColumnMap = options.columnMap ?? {}
  const columnMap = {
    nameKey: explicitColumnMap.nameKey ?? detectedColumnMap.nameKey,
    descriptionKey: explicitColumnMap.descriptionKey ?? detectedColumnMap.descriptionKey,
    dueDateKey: explicitColumnMap.dueDateKey ?? detectedColumnMap.dueDateKey,
  }

  return rows
    .map((row) => normalizeTaskFromRow(row, columnMap, options))
    .filter(Boolean)
}

function buildSheetPreview(sheetName, rows, customAliases, sampleSize = 8) {
  const allHeaders = Array.from(
    rows.reduce((accumulator, row) => {
      Object.keys(row).forEach((key) => accumulator.add(key))
      return accumulator
    }, new Set())
  )

  const detectedColumnMap = resolveColumnMap(allHeaders, customAliases)
  const sampleRows = rows.slice(0, sampleSize)

  return {
    sheetName,
    headers: allHeaders,
    rowCount: rows.length,
    sampleRows,
    detectedColumnMap,
  }
}

export async function extractTasksFromWorkbookFile(file, options = {}) {
  const workbook = await readWorkbookFromFile(file)
  const usesDate1904 = Boolean(workbook.properties?.date1904)
  const targetSheetNames = options.sheetName
    ? workbook.worksheets.map((sheet) => sheet.name).filter((name) => name === options.sheetName)
    : workbook.worksheets.map((sheet) => sheet.name)

  let totalRows = 0

  const importedTasks = targetSheetNames.flatMap((sheetName) => {
    const sheet = workbook.getWorksheet(sheetName)
    if (!sheet) {
      return []
    }

    const { headers, rows } = parseWorksheetRows(sheet)
    ensureRowLimits(rows, sheetName)
    totalRows += rows.length
    ensureTotalRowLimit(totalRows)

    return extractTasksFromRows(rows, headers, options.columnAliases, {
      date1904: usesDate1904,
      columnMap: options.columnMap,
    })
  })

  return importedTasks
}

export async function readWorkbookPreviewFromFile(file, options = {}) {
  const workbook = await readWorkbookFromFile(file)
  const sampleSize = typeof options.sampleSize === 'number' ? options.sampleSize : 8

  let totalRows = 0

  const sheets = workbook.worksheets.map((sheet) => {
    const sheetName = sheet.name
    const { headers, rows } = parseWorksheetRows(sheet)
    ensureRowLimits(rows, sheetName)
    totalRows += rows.length
    ensureTotalRowLimit(totalRows)

    const previewRows = rows.map((row) =>
      headers.reduce((accumulator, header) => {
        accumulator[header] = toTextFromCellValue(row[header])
        return accumulator
      }, {})
    )

    return buildSheetPreview(sheetName, previewRows, options.columnAliases, sampleSize)
  })

  return {
    sheetNames: workbook.worksheets.map((sheet) => sheet.name),
    sheets,
  }
}

export { DEFAULT_COLUMN_ALIASES }
