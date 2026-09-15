export function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function isoToParts(isoDate: string | null): { day: string; month: string; year: string } {
  if (!isoDate) return { day: '', month: '', year: '' }
  const [year, month, day] = isoDate.split('-')
  return { day: day ?? '', month: month ?? '', year: year ?? '' }
}

export function partsToIso(day: string, month: string, year: string): string | null | undefined {
  const dayText = day.trim()
  const monthText = month.trim()
  const yearText = year.trim()
  if (!dayText && !monthText && !yearText) return null
  if (!dayText || !monthText || !yearText) return undefined

  const d = Number(dayText)
  const m = Number(monthText)
  const y = Number(yearText)
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return undefined
  if (y < 1000 || y > 9999 || m < 1 || m > 12 || d < 1 || d > 31) return undefined

  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return undefined
  }

  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function formatDate(isoDate: string): string {
  return parseLocalDate(isoDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateShort(isoDate: string): string {
  const { day, month, year } = isoToParts(isoDate)
  return `${day}/${month}/${year}`
}
