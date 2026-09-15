import type { Book, BookGroup, TrackerState } from './types'

const V1_KEY = 'book-tracker:v1'
const V2_KEY = 'book-tracker:v2'

function isBook(value: unknown): value is Book {
  if (!value || typeof value !== 'object') return false
  const book = value as Book
  return (
    typeof book.id === 'string' &&
    typeof book.title === 'string' &&
    typeof book.pageCount === 'number' &&
    typeof book.pagesRead === 'number'
  )
}

function isGroup(value: unknown): value is BookGroup {
  if (!value || typeof value !== 'object') return false
  const group = value as BookGroup
  return (
    typeof group.id === 'string' &&
    typeof group.name === 'string' &&
    (group.deadline === null || typeof group.deadline === 'string') &&
    Array.isArray(group.books) &&
    group.books.every(isBook)
  )
}

export function createGroup(name: string, deadline: string | null = null, books: Book[] = []): BookGroup {
  return {
    id: crypto.randomUUID(),
    name,
    deadline,
    books,
  }
}

export function emptyState(): TrackerState {
  return {
    version: 2,
    groups: [createGroup('Stack 1')],
  }
}

function migrateV1(raw: string): TrackerState | null {
  try {
    const parsed = JSON.parse(raw) as { books?: unknown; deadline?: unknown }
    if (!parsed || !Array.isArray(parsed.books)) return null
    return {
      version: 2,
      groups: [
        createGroup(
          'Stack 1',
          typeof parsed.deadline === 'string' && parsed.deadline.length > 0
            ? parsed.deadline
            : null,
          parsed.books.filter(isBook),
        ),
      ],
    }
  } catch {
    return null
  }
}

export function loadState(): TrackerState {
  try {
    const v2 = localStorage.getItem(V2_KEY)
    if (v2) {
      const parsed = JSON.parse(v2) as Partial<TrackerState>
      if (parsed?.version === 2 && Array.isArray(parsed.groups)) {
        const groups = parsed.groups.filter(isGroup)
        return groups.length > 0 ? { version: 2, groups } : emptyState()
      }
    }

    const v1 = localStorage.getItem(V1_KEY)
    if (v1) {
      const migrated = migrateV1(v1)
      if (migrated) return migrated
    }

    return emptyState()
  } catch {
    return emptyState()
  }
}

export function saveState(state: TrackerState): void {
  localStorage.setItem(V2_KEY, JSON.stringify(state))
}
