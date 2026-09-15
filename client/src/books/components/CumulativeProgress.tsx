import { formatPages } from '../pace'
import type { TrackerStats } from '../types'
import { ProgressBar } from './ProgressBar'

type CumulativeProgressProps = {
  groupId: string
  stats: TrackerStats
}

export function CumulativeProgress({ groupId, stats }: CumulativeProgressProps) {
  const headingId = `stack-heading-${groupId}`

  return (
    <section className="cumulative" aria-labelledby={headingId}>
      <div className="cumulative__copy">
        <p className="eyebrow">This stack</p>
        <h2 id={headingId}>Cumulative progress</h2>
        <p>
          {formatPages(stats.pagesRead)} of {formatPages(stats.totalPages)} pages
          {stats.bookCount > 0
            ? ` across ${stats.bookCount} ${stats.bookCount === 1 ? 'book' : 'books'}`
            : ''}
        </p>
      </div>
      <div className="cumulative__meter">
        <ProgressBar
          value={stats.pagesRead}
          max={stats.totalPages}
          label="Pages read in this stack"
        />
        <p className="cumulative__percent">{Math.round(stats.percent)}%</p>
      </div>
    </section>
  )
}
