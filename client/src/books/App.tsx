import { GroupCard } from './components/GroupCard'
import { useTracker } from './hooks/useTracker'

export default function App() {
  const tracker = useTracker()
  const onBetterGpt = window.location.pathname.startsWith('/books')

  return (
    <div className="app">
      <header className="masthead">
        {onBetterGpt ? (
          <a className="home-link" href="/">
            ← BetterGPT
          </a>
        ) : null}
        <p className="eyebrow">Reading journal</p>
        <h1>Book tracker</h1>
        <p className="masthead__lede">
          Keep separate stacks with their own finish dates. Add titles, log pages,
          and see how many pages a day each stack needs.
        </p>
        <button type="button" className="masthead__add" onClick={tracker.addGroup}>
          Add another stack
        </button>
      </header>

      {tracker.groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          stats={tracker.groupStats[group.id]}
          canRemove={tracker.groups.length > 1}
          onRename={(name) => tracker.renameGroup(group.id, name)}
          onRemove={() => tracker.removeGroup(group.id)}
          onDeadlineChange={(deadline) => tracker.setDeadline(group.id, deadline)}
          onAddBook={(title, pageCount, pagesRead) =>
            tracker.addBook(group.id, title, pageCount, pagesRead)
          }
          onUpdateBook={(id, patch) => tracker.updateBook(group.id, id, patch)}
          onRemoveBook={(id) => tracker.removeBook(group.id, id)}
        />
      ))}

      <p className="footnote">Saved on this device. Each stack has its own deadline and pace.</p>
    </div>
  )
}
