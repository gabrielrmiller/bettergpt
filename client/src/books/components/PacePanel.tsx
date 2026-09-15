import { dailyPagesFor, formatDate, formatPages, remainingPagesFor } from '../pace'
import type { Book, TrackerStats } from '../types'
import { DateField } from './DateField'

type PacePanelProps = {
  groupId: string
  deadline: string | null
  stats: TrackerStats
  books: Book[]
  onDeadlineChange: (deadline: string | null) => void
}

function statusCopy(stats: TrackerStats, deadline: string | null): string {
  switch (stats.status) {
    case 'empty':
      return 'Add a book to start this stack. The daily pace will follow.'
    case 'no-deadline':
      return 'Set a finish date to see how many pages to read each day.'
    case 'done':
      return deadline
        ? `This stack is finished in time for ${formatDate(deadline)}.`
        : 'This stack is finished.'
    case 'overdue':
      return `Past ${deadline ? formatDate(deadline) : 'the deadline'} with ${formatPages(stats.remainingPages)} pages still unread.`
    default:
      return `Read ${formatPages(stats.pagesPerDay ?? 0)} pages a day to finish by ${deadline ? formatDate(deadline) : 'the deadline'}.`
  }
}

export function PacePanel({
  groupId,
  deadline,
  stats,
  books,
  onDeadlineChange,
}: PacePanelProps) {
  const headingId = `pace-heading-${groupId}`
  const daysLabel =
    stats.daysLeft === null
      ? 'No date'
      : stats.daysLeft <= 0
        ? 'Overdue'
        : stats.daysLeft === 1
          ? 'Due today'
          : `${stats.daysLeft} days left`

  return (
    <section className="pace" aria-labelledby={headingId}>
      <div className="pace__main">
        <p className="eyebrow">Daily pace</p>
        <h2 id={headingId}>
          {stats.status === 'done'
            ? 'Finished'
            : stats.pagesPerDay === null
              ? '—'
              : formatPages(stats.pagesPerDay)}
          {stats.status === 'done' ? null : <span> pages / day</span>}
        </h2>
        <p className="pace__copy">{statusCopy(stats, deadline)}</p>
        <dl className="pace__facts">
          <div>
            <dt>Remaining</dt>
            <dd>{formatPages(stats.remainingPages)} pages</dd>
          </div>
          <div>
            <dt>Finished</dt>
            <dd>
              {stats.booksDone} / {stats.bookCount} books
            </dd>
          </div>
          <div>
            <dt>Window</dt>
            <dd>{daysLabel}</dd>
          </div>
        </dl>
      </div>

      <form className="pace__date" onSubmit={(event) => event.preventDefault()}>
        <DateField
          id={`deadline-${groupId}`}
          value={deadline}
          onChange={onDeadlineChange}
        />
      </form>

      {stats.status === 'on-pace' || stats.status === 'overdue' ? (
        <ul className="pace__split">
          {books.map((book) => {
            const remaining = remainingPagesFor(book)
            const daily = dailyPagesFor(remaining, stats.daysLeft)
            if (remaining <= 0) return null
            return (
              <li key={book.id}>
                <span>{book.title}</span>
                <strong>
                  {daily === null ? '—' : `${formatPages(daily)} / day`}
                </strong>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
