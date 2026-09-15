import { bookPercent, dailyPagesFor, formatPages, remainingPagesFor } from '../pace'
import type { Book } from '../types'
import { NumberField } from './NumberField'
import { ProgressBar } from './ProgressBar'

const SPINE_COLORS = ['#8c3a3a', '#3f6b58', '#3a4a8c', '#8c5a2a', '#5a3a6b', '#2a6b6b']

type BookCardProps = {
  book: Book
  daysLeft: number | null
  onUpdate: (id: string, patch: Partial<Omit<Book, 'id'>>) => void
  onRemove: (id: string) => void
}

function spineColor(id: string): string {
  let hash = 0
  for (const char of id) hash = (hash + char.charCodeAt(0)) % SPINE_COLORS.length
  return SPINE_COLORS[hash]
}

export function BookCard({ book, daysLeft, onUpdate, onRemove }: BookCardProps) {
  const remaining = remainingPagesFor(book)
  const done = remaining === 0
  const daily = dailyPagesFor(remaining, daysLeft)
  const percent = bookPercent(book)
  const color = spineColor(book.id)

  return (
    <article className={`book-card${done ? ' book-card--done' : ''}`}>
      <div className="book-card__spine" style={{ background: color }} aria-hidden="true" />
      <div className="book-card__body">
        <header className="book-card__header">
          <label className="book-card__title">
            <span className="visually-hidden">Title</span>
            <input
              type="text"
              value={book.title}
              onChange={(event) => onUpdate(book.id, { title: event.target.value })}
            />
          </label>
          <button
            type="button"
            className="text-button"
            onClick={() => onRemove(book.id)}
          >
            Remove
          </button>
        </header>

        <ProgressBar
          value={book.pagesRead}
          max={book.pageCount}
          label={`Progress for ${book.title}`}
          color={color}
        />

        <p className="book-card__status">
          {done
            ? 'Finished'
            : `${formatPages(book.pagesRead)} of ${formatPages(book.pageCount)} · ${Math.round(percent)}%`}
          {!done && daily !== null ? ` · ${formatPages(daily)} pages/day` : ''}
        </p>

        <div className="book-card__controls">
          <NumberField
            label="Page count"
            value={book.pageCount}
            min={1}
            onCommit={(pageCount) => onUpdate(book.id, { pageCount })}
          />
          <NumberField
            id={`pages-${book.id}`}
            label="Current page"
            value={book.pagesRead}
            min={0}
            onCommit={(pagesRead) => onUpdate(book.id, { pagesRead })}
          />
        </div>
      </div>
    </article>
  )
}
