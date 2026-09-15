import type { Book } from '../types'
import { BookCard } from './BookCard'

type BookListProps = {
  groupId: string
  books: Book[]
  daysLeft: number | null
  onUpdate: (id: string, patch: Partial<Omit<Book, 'id'>>) => void
  onRemove: (id: string) => void
}

export function BookList({ groupId, books, daysLeft, onUpdate, onRemove }: BookListProps) {
  if (books.length === 0) {
    return (
      <section className="empty" aria-live="polite">
        <p className="eyebrow">Books</p>
        <h2>Nothing in this stack yet</h2>
        <p>Add the first title above. Progress stays with this deadline only.</p>
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
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  )
}
