import { useState, type FormEvent } from 'react'

type AddBookFormProps = {
  groupId: string
  onAdd: (title: string, pageCount: number, pagesRead: number) => void
}

function digitsOnly(raw: string): string {
  return raw.replace(/[^\d]/g, '')
}

export function AddBookForm({ groupId, onAdd }: AddBookFormProps) {
  const [title, setTitle] = useState('')
  const [pageCount, setPageCount] = useState('')
  const [pagesRead, setPagesRead] = useState('0')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = title.trim()
    const total = Number(pageCount)
    const current = Number(pagesRead || 0)
    if (!trimmed || !Number.isFinite(total) || total < 1) return

    onAdd(trimmed, total, Number.isFinite(current) ? current : 0)
    setTitle('')
    setPageCount('')
    setPagesRead('0')
  }

  return (
    <section className="add-book" aria-labelledby={`add-book-heading-${groupId}`}>
      <div>
        <p className="eyebrow">New volume</p>
        <h2 id={`add-book-heading-${groupId}`}>Add a book</h2>
      </div>
      <form className="add-book__form" onSubmit={handleSubmit}>
        <label>
          Title
          <input
            type="text"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="The book’s title"
            required
            autoComplete="off"
          />
        </label>
        <label>
          Page count
          <input
            type="text"
            name="pageCount"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={pageCount}
            onChange={(event) => setPageCount(digitsOnly(event.target.value))}
            placeholder="320"
            required
          />
        </label>
        <label>
          Pages already read
          <input
            type="text"
            name="pagesRead"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={pagesRead}
            onChange={(event) => setPagesRead(digitsOnly(event.target.value))}
          />
        </label>
        <button type="submit">Add to stack</button>
      </form>
    </section>
  )
}
