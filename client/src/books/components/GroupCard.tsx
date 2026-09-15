import { formatDate, formatPages } from '../pace'
import type { Book, BookGroup, StackChoice, TrackerStats } from '../types'
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
  onToggle: () => void
  onDeadlineChange: (deadline: string | null) => void
  onAddBook: (title: string, pageCount: number, pagesRead: number) => void
  onUpdateBook: (id: string, patch: Partial<Omit<Book, 'id'>>) => void
  onRemoveBook: (id: string) => void
  onMoveBook: (id: string, toGroupId: string) => void
  stacks: StackChoice[]
}

function summary(group: BookGroup, stats: TrackerStats): string {
  const books =
    stats.bookCount === 0
      ? 'No books yet'
      : `${stats.bookCount} ${stats.bookCount === 1 ? 'book' : 'books'}`
  const pace =
    stats.pagesPerDay === null ? null : `${formatPages(stats.pagesPerDay)} pages/day`
  const due = group.deadline ? `due ${formatDate(group.deadline)}` : 'no finish date'
  return [books, pace, due].filter(Boolean).join(' · ')
}

export function GroupCard({
  group,
  stats,
  canRemove,
  onRename,
  onRemove,
  onToggle,
  onDeadlineChange,
  onAddBook,
  onUpdateBook,
  onRemoveBook,
  onMoveBook,
  stacks,
}: GroupCardProps) {
  const collapsed = group.collapsed
  const bodyId = `stack-body-${group.id}`

  return (
    <article className={`group${collapsed ? ' group--collapsed' : ''}`}>
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
        <div className="group__actions">
          {canRemove ? (
            <button type="button" className="text-button" onClick={onRemove}>
              Remove
            </button>
          ) : null}
          <button
            type="button"
            className="group__toggle"
            aria-expanded={!collapsed}
            aria-controls={bodyId}
            onClick={onToggle}
          >
            <span className="visually-hidden">
              {collapsed ? `Expand ${group.name || 'stack'}` : `Minimize ${group.name || 'stack'}`}
            </span>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M5.2 7.4 10 12.2l4.8-4.8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {collapsed ? <p className="group__summary">{summary(group, stats)}</p> : null}

      <div id={bodyId} className="group__body" hidden={collapsed}>
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
          stacks={stacks}
          onUpdate={onUpdateBook}
          onRemove={onRemoveBook}
          onMove={onMoveBook}
        />
      </div>
    </article>
  )
}
