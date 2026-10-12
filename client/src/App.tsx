import './App.css'
import { useEffect, useRef, useState, type ReactNode } from 'react'

const MESSAGE_BANK = [
  "What do you want to work on today?",
  "How can I help you today?",
  "What would you like to explore?",
  "What's on your mind?",
  "What can we create together?",
  "What challenge are you facing?",
  "What would you like to learn about?",
  "What's your next project?",
]

const CHAT_ITEMS = [
  { id: 'new', label: 'New chat', icon: 'new' },
  { id: 'search', label: 'Search chats', icon: 'search' },
  { id: 'library', label: 'Library', icon: 'library' },
] as const

const PROJECTS = [
  { label: "When we're free", href: '/when', icon: 'calendar' },
  { label: 'MAS-I Timer', href: '/mas-i/', icon: 'timer' },
  { label: 'Book tracker', href: '/books', icon: 'book' },
  {
    label: 'Medical AI Insurance Calculator',
    href: 'https://medical-ai-insurance-calculator.vercel.app',
    icon: 'calculator',
  },
  {
    label: 'Time Till Death',
    href: 'https://time-till-death.vercel.app',
    icon: 'hourglass',
  },
] as const

function Icon({ name }: { name: string }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      {iconPath(name)}
    </svg>
  )
}

function iconPath(name: string): ReactNode {
  switch (name) {
    case 'new':
      return (
        <>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </>
      )
    case 'search':
      return (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </>
      )
    case 'library':
      return (
        <>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </>
      )
    case 'calendar':
      return (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </>
      )
    case 'timer':
      return (
        <>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 13V9M9 2h6" />
        </>
      )
    case 'book':
      return (
        <>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 0 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2z" />
        </>
      )
    case 'calculator':
      return (
        <>
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
        </>
      )
    default:
      return (
        <>
          <path d="M8 2h8" />
          <path d="M12 2v6l4 7a6 6 0 1 1-8 0l4-7" />
        </>
      )
  }
}

function App() {
  const host = window.location.host
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [text, setText] = useState('')
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const ran = useRef(false)

  const toggleSidebar = () => {
    setIsCollapsed((open) => !open)
  }

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const KEY = 'messageIndex'
    const prev = Number(localStorage.getItem(KEY)) || 0
    const next = (prev + 1) % MESSAGE_BANK.length
    localStorage.setItem(KEY, next.toString())
    setCurrentMessageIndex(next)
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    const maxHeight = 300
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px'
    }
  }, [text])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  const handleSubmit = async () => {
    if (!text.trim()) return
    const userInput = text
    setText('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: userInput }),
      })

      const data = await res.json()
      if (data.reply) {
        setReply(data.reply)
      }
    } catch (err) {
      console.error('Error calling OpenAI API:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const logoSrc =
    isCollapsed && hovered
      ? `${import.meta.env.BASE_URL}maximizer.png`
      : `${import.meta.env.BASE_URL}logo.png`

  return (
    <div className="shell">
      {mobileOpen ? (
        <button
          type="button"
          className="shell-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside className={`shell-sidebar${isCollapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-open' : ''}`}>
        <div className="shell-sidebar-top">
          <button
            type="button"
            className="shell-logo"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Reload'}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={isCollapsed ? toggleSidebar : handleRefresh}
          >
            <img src={logoSrc} alt="" className={isCollapsed && hovered ? 'is-small' : ''} />
          </button>
          <span className="shell-brand">BetterGPT</span>
          <button
            type="button"
            className="shell-icon-btn shell-collapse"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={toggleSidebar}
          >
            <img src={`${import.meta.env.BASE_URL}${isCollapsed ? 'maximizer.png' : 'minimizer.png'}`} alt="" />
          </button>
          <button
            type="button"
            className="shell-icon-btn shell-close"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="shell-nav" aria-label="BetterGPT">
          <div className="shell-group">
            {CHAT_ITEMS.map((item) => (
              <button key={item.id} type="button" className="nav-item" title={item.label}>
                <Icon name={item.icon} />
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="shell-group">
            <p className="shell-section">Projects</p>
            {PROJECTS.map((project) => (
              <a
                key={project.href}
                className="nav-item"
                href={project.href}
                title={project.label}
                onClick={() => setMobileOpen(false)}
              >
                <Icon name={project.icon} />
                <span className="nav-label">{project.label}</span>
              </a>
            ))}
          </div>
        </nav>
      </aside>

      <main className="shell-main">
        <header className="shell-mobile-bar">
          <button
            type="button"
            className="shell-icon-btn"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span>BetterGPT</span>
        </header>

        <div className="shell-stage">
          <h1 className="shell-greeting">{MESSAGE_BANK[currentMessageIndex]}</h1>
          {loading ? (
            <p className="shell-status">Thinking...</p>
          ) : reply ? (
            <p className="shell-reply">{reply}</p>
          ) : null}

          <div className="composer">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={host.includes('github.io') ? 'go to "bettergpt-lake.vercel.app"' : 'Ask anything'}
            />
            <div className="composer-bar">
              <div className="tooltip-wrapper" data-tooltip="Attach or add files">
                <button type="button" className="chatbar-item text-5xl bigplus" aria-label="Attach or add files" />
              </div>
              <div className="tooltip-wrapper" data-tooltip="Submit">
                <button type="button" className="chatbar-item send-btn" aria-label="Submit" onClick={handleSubmit}>
                  ↑
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
