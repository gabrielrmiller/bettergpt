import { formatDate, parseLocalDate } from './dates'
import type { Book, PaceInput, PaceStatus, TrackerStats } from './types'

const MS_PER_DAY = 86_400_000

export { formatDate, parseLocalDate }

export function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function daysUntilDeadline(deadline: string): number {
  const end = parseLocalDate(deadline)
  const today = startOfToday()
  return Math.round((end.getTime() - today.getTime()) / MS_PER_DAY)
}

/** Days still available to read, including today. */
export function readingDaysLeft(deadline: string): number {
  return daysUntilDeadline(deadline) + 1
}

export function remainingPagesFor(book: Book): number {
  return Math.max(0, book.pageCount - book.pagesRead)
}

export function bookPercent(book: Book): number {
  if (book.pageCount <= 0) return 0
  return Math.min(100, (book.pagesRead / book.pageCount) * 100)
}

export function dailyPagesFor(remaining: number, daysLeft: number | null): number | null {
  if (daysLeft === null) return null
  if (remaining <= 0) return 0
  if (daysLeft <= 0) return remaining
  return Math.ceil(remaining / daysLeft)
}

export function computeStats(input: PaceInput): TrackerStats {
  const totalPages = input.books.reduce((sum, book) => sum + book.pageCount, 0)
  const pagesRead = input.books.reduce(
    (sum, book) => sum + Math.min(book.pagesRead, book.pageCount),
    0,
  )
  const remainingPages = Math.max(0, totalPages - pagesRead)
  const percent = totalPages <= 0 ? 0 : (pagesRead / totalPages) * 100
  const booksDone = input.books.filter((book) => book.pagesRead >= book.pageCount).length
  const bookCount = input.books.length

  const daysLeft = input.deadline ? readingDaysLeft(input.deadline) : null
  const pagesPerDay =
    bookCount === 0 || totalPages === 0
      ? null
      : dailyPagesFor(remainingPages, daysLeft)

  let status: PaceStatus
  if (bookCount === 0 || totalPages === 0) status = 'empty'
  else if (!input.deadline) status = 'no-deadline'
  else if (remainingPages === 0) status = 'done'
  else if (daysLeft !== null && daysLeft <= 0) status = 'overdue'
  else status = 'on-pace'

  return {
    totalPages,
    pagesRead,
    remainingPages,
    percent,
    booksDone,
    bookCount,
    daysLeft,
    pagesPerDay,
    status,
  }
}

export function formatPages(value: number): string {
  return value.toLocaleString()
}
