import * as XLSX from 'xlsx'

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

  const parsed = XLSX.SSF.parse_date_code(value, { date1904 })
  if (!parsed || !parsed.y || !parsed.m || !parsed.d) {
    return null
  }

  const candidate = new Date(parsed.y, parsed.m - 1, parsed.d)
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

function extractTasksFromSheet(sheet, customAliases, options = {}) {
  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: true,
  })

  if (rows.length === 0) {
    return []
  }

  const headers = Object.keys(rows[0])
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

function extractSheetRows(sheet) {
  return XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: true,
  })
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
  if (!file) {
    throw new Error('Please choose an Excel file first.')
  }

  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
  })

  const usesDate1904 = Boolean(workbook?.Workbook?.WBProps?.date1904)
  const targetSheetNames = options.sheetName
    ? workbook.SheetNames.filter((name) => name === options.sheetName)
    : workbook.SheetNames

  const importedTasks = targetSheetNames.flatMap((sheetName) => {
    const sheet = workbook.Sheets[sheetName]
    return extractTasksFromSheet(sheet, options.columnAliases, {
      date1904: usesDate1904,
      columnMap: options.columnMap,
    })
  })

  return importedTasks
}

export async function readWorkbookPreviewFromFile(file, options = {}) {
  if (!file) {
    throw new Error('Please choose an Excel file first.')
  }

  const sampleSize = typeof options.sampleSize === 'number' ? options.sampleSize : 8
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
  })

  const sheets = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName]
    const rows = extractSheetRows(sheet)
    return buildSheetPreview(sheetName, rows, options.columnAliases, sampleSize)
  })

  return {
    sheetNames: workbook.SheetNames,
    sheets,
  }
}

export { DEFAULT_COLUMN_ALIASES }
