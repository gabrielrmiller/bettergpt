import type { Book, StackChoice } from '../types'
import { BookCard } from './BookCard'

type BookListProps = {
  groupId: string
  books: Book[]
  daysLeft: number | null
  stacks: StackChoice[]
  onUpdate: (id: string, patch: Partial<Omit<Book, 'id'>>) => void
  onRemove: (id: string) => void
  onMove: (id: string, toGroupId: string) => void
}

export function BookList({
  groupId,
  books,
  daysLeft,
  stacks,
  onUpdate,
  onRemove,
  onMove,
}: BookListProps) {
  if (books.length === 0) {
    return (
      <section className="empty" aria-live="polite">
        <p className="eyebrow">Books</p>
        <h2>Nothing in this stack yet</h2>
        <p>
          {stacks.length > 1
            ? 'Add a title above, or move one here from another stack.'
            : 'Add a title above.'}
        </p>
      </section>
    )
  }

  return (
    <section className="stack" aria-labelledby={`books-heading-${groupId}`}>
      <div className="stack__heading">
        <p className="eyebrow">Books</p>
        <h2 id={`books-heading-${groupId}`}>
          {books.length} {books.length === 1 ? 'book' : 'books'}
        </h2>
      </div>
      <div className="stack__grid">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            daysLeft={daysLeft}
            stackId={groupId}
            stacks={stacks}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onMove={onMove}
          />
        ))}
      </div>
    </section>
  )
}
