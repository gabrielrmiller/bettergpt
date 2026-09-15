import { useCallback, useEffect, useMemo, useState } from 'react'
import { computeStats } from '../pace'
import { createGroup, loadState, saveState } from '../storage'
import type { Book, BookGroup, TrackerState } from '../types'

function clampBook(book: Book): Book {
  const pageCount = Math.max(1, Math.floor(Number(book.pageCount)) || 1)
  const pagesRead = Math.min(
    pageCount,
    Math.max(0, Math.floor(Number(book.pagesRead)) || 0),
  )
  return { ...book, title: book.title, pageCount, pagesRead }
}

function nextStackName(groups: BookGroup[]): string {
  return `Stack ${groups.length + 1}`
}

function mapGroup(
  state: TrackerState,
  groupId: string,
  update: (group: BookGroup) => BookGroup,
): TrackerState {
  return {
    ...state,
    groups: state.groups.map((group) => (group.id === groupId ? update(group) : group)),
  }
}

export function useTracker() {
  const [state, setState] = useState<TrackerState>(loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  const addGroup = useCallback(() => {
    setState((current) => ({
      ...current,
      groups: [...current.groups, createGroup(nextStackName(current.groups))],
    }))
  }, [])

  const removeGroup = useCallback((groupId: string) => {
    setState((current) => {
      const groups = current.groups.filter((group) => group.id !== groupId)
      return {
        ...current,
        groups: groups.length > 0 ? groups : [createGroup('Stack 1')],
      }
    })
  }, [])

  const renameGroup = useCallback((groupId: string, name: string) => {
    setState((current) => mapGroup(current, groupId, (group) => ({ ...group, name })))
  }, [])

  const toggleGroup = useCallback((groupId: string) => {
    setState((current) =>
      mapGroup(current, groupId, (group) => ({ ...group, collapsed: !group.collapsed })),
    )
  }, [])

  const setDeadline = useCallback((groupId: string, deadline: string | null) => {
    setState((current) =>
      mapGroup(current, groupId, (group) => ({
        ...group,
        deadline: deadline && deadline.length > 0 ? deadline : null,
      })),
    )
  }, [])

  const addBook = useCallback((groupId: string, title: string, pageCount: number, pagesRead = 0) => {
    const book = clampBook({
      id: crypto.randomUUID(),
      title,
      pageCount,
      pagesRead,
    })
    setState((current) =>
      mapGroup(current, groupId, (group) => ({
        ...group,
        books: [...group.books, book],
      })),
    )
  }, [])

  const updateBook = useCallback((groupId: string, bookId: string, patch: Partial<Omit<Book, 'id'>>) => {
    setState((current) =>
      mapGroup(current, groupId, (group) => ({
        ...group,
        books: group.books.map((book) =>
          book.id === bookId ? clampBook({ ...book, ...patch }) : book,
        ),
      })),
    )
  }, [])

  const removeBook = useCallback((groupId: string, bookId: string) => {
    setState((current) =>
      mapGroup(current, groupId, (group) => ({
        ...group,
        books: group.books.filter((book) => book.id !== bookId),
      })),
    )
  }, [])

  const replaceState = useCallback((next: TrackerState) => {
    setState({
      version: 2,
      groups: next.groups.length > 0 ? next.groups : [createGroup('Stack 1')],
    })
  }, [])

  const groupStats = useMemo(
    () =>
      Object.fromEntries(
        state.groups.map((group) => [group.id, computeStats(group)]),
      ),
    [state.groups],
  )

  return {
    groups: state.groups,
    state,
    groupStats,
    replaceState,
    addGroup,
    removeGroup,
    renameGroup,
    toggleGroup,
    setDeadline,
    addBook,
    updateBook,
    removeBook,
  }
}
