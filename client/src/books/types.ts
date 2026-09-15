export type Book = {
  id: string
  title: string
  pageCount: number
  pagesRead: number
}

export type BookGroup = {
  id: string
  name: string
  deadline: string | null
  collapsed: boolean
  books: Book[]
}

export type TrackerState = {
  version: 2
  groups: BookGroup[]
}

export type PaceInput = {
  books: Book[]
  deadline: string | null
}

export type PaceStatus = 'empty' | 'no-deadline' | 'done' | 'overdue' | 'on-pace'

export type TrackerStats = {
  totalPages: number
  pagesRead: number
  remainingPages: number
  percent: number
  booksDone: number
  bookCount: number
  daysLeft: number | null
  pagesPerDay: number | null
  status: PaceStatus
}
