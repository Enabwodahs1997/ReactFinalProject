export function getTimestampMs(value, fallback = 0) {
  if (typeof value?.createdAtMs === 'number') {
    return value.createdAtMs
  }

  if (typeof value?.createdAt === 'string') {
    const parsed = Date.parse(value.createdAt)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  if (typeof value?.date === 'string') {
    const parsed = Date.parse(value.date)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  return fallback
}

export function formatLocalDateTime(timestampMs) {
  if (typeof timestampMs !== 'number' || Number.isNaN(timestampMs)) {
    return 'Unknown time'
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(timestampMs))
}

export function parseTaskDueDate(value) {
  if (!value || typeof value !== 'string') {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    return Number.isNaN(localDate.getTime()) ? null : localDate
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate())
}
