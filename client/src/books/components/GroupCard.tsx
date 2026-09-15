import type { Book, BookGroup, TrackerStats } from '../types'
import { AddBookForm } from './AddBookForm'
import { BookList } from './BookList'
import { CumulativeProgress } from './CumulativeProgress'
import { PacePanel } from './PacePanel'

type GroupCardProps = {
  group: BookGroup
  stats: TrackerStats
  canRemove: boolean
  onRename: (name: string) => void
  onRemove: () => void
  onDeadlineChange: (deadline: string | null) => void
  onAddBook: (title: string, pageCount: number, pagesRead: number) => void
  onUpdateBook: (id: string, patch: Partial<Omit<Book, 'id'>>) => void
  onRemoveBook: (id: string) => void
}

export function GroupCard({
  group,
  stats,
  canRemove,
  onRename,
  onRemove,
  onDeadlineChange,
  onAddBook,
  onUpdateBook,
  onRemoveBook,
}: GroupCardProps) {
  return (
    <article className="group">
      <header className="group__header">
        <label className="group__title">
          <span className="visually-hidden">Stack name</span>
          <input
            type="text"
            value={group.name}
            onChange={(event) => onRename(event.target.value)}
            placeholder="Stack name"
          />
        </label>
        {canRemove ? (
          <button type="button" className="text-button" onClick={onRemove}>
            Remove stack
          </button>
        ) : null}
      </header>

      <PacePanel
        groupId={group.id}
        deadline={group.deadline}
        stats={stats}
        books={group.books}
        onDeadlineChange={onDeadlineChange}
      />

      <CumulativeProgress groupId={group.id} stats={stats} />

      <AddBookForm groupId={group.id} onAdd={onAddBook} />

      <BookList
        groupId={group.id}
        books={group.books}
        daysLeft={stats.daysLeft}
        onUpdate={onUpdateBook}
        onRemove={onRemoveBook}
      />
    </article>
  )
}
