import './App.css'
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

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

const PROJECTS = [
  {
    label: "When we're free",
    description: 'Tool for planning outings with friends and figuring out date availability',
    href: '/when',
    icon: 'calendar',
    tone: 'calendar',
  },
  {
    label: 'MAS-I Timer',
    description: 'Timer to track hours spent studying and practicing for my actuarial exam',
    href: '/mas-i/',
    icon: 'timer',
    tone: 'timer',
  },
  {
    label: 'Book tracker',
    description: 'Tool to track page count and time to complete books',
    href: '/books',
    icon: 'book',
    tone: 'books',
  },
  {
    label: 'Medical AI Insurance Calculator',
    description: 'Model pricing tool for calculating value of premium for a health practitioner AI system',
    href: 'https://medical-ai-insurance-calculator.vercel.app',
    icon: 'calculator',
    tone: 'insurance',
  },
  {
    label: 'Time Till Death',
    description: 'Lifespan calculator using exponential decay model',
    href: 'https://time-till-death.vercel.app',
    icon: 'hourglass',
    tone: 'death',
  },
  {
    label: 'Pavi Clone',
    description: "Replication of my friend's personal website, as an effort to learn how to code in HTML",
    href: 'https://gabrielrmiller.github.io/paviclone/',
    icon: 'person',
    tone: 'pavi',
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
    case 'person':
      return (
        <>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19.5a7 7 0 0 1 14 0" />
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

function placeProjectTooltip(anchor: HTMLElement, tip: HTMLElement) {
  const sidebar = anchor.closest('.shell-sidebar')
  const anchorRect = anchor.getBoundingClientRect()
  const sideRect = sidebar?.getBoundingClientRect()
  const visibleRight = sideRect ? Math.min(anchorRect.right, sideRect.right) : anchorRect.right
  const height = tip.offsetHeight
  const width = tip.offsetWidth
  const margin = 8
  let left = visibleRight + margin
  let top = anchorRect.top + anchorRect.height / 2 - height / 2
  if (left + width > window.innerWidth - margin) {
    left = Math.max(margin, visibleRight - width - margin)
  }
  top = Math.max(margin, Math.min(top, window.innerHeight - height - margin))
  tip.style.left = `${left}px`
  tip.style.top = `${top}px`
}

function ProjectLink({
  project,
  onNavigate,
}: {
  project: (typeof PROJECTS)[number]
  onNavigate: () => void
}) {
  const anchorRef = useRef<HTMLAnchorElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const open = hovered || focused
  const tipId = useId()

  useLayoutEffect(() => {
    if (!open) return
    const anchor = anchorRef.current
    const tip = tipRef.current
    if (!anchor || !tip) return
    placeProjectTooltip(anchor, tip)
  }, [open, project.description])

  useEffect(() => {
    if (!open) return
    let frame = 0
    const tick = () => {
      const anchor = anchorRef.current
      const tip = tipRef.current
      if (anchor && tip) placeProjectTooltip(anchor, tip)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [open])

  return (
    <a
      ref={anchorRef}
      className={`nav-item nav-tone-${project.tone}`}
      href={project.href}
      aria-describedby={open ? tipId : undefined}
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <Icon name={project.icon} />
      <span className="nav-label">
        {project.label === 'Medical AI Insurance Calculator' ? (
          <>
            {'Medical AI Insurance '}
            <br />
            Calculator
          </>
        ) : (
          project.label
        )}
      </span>
      {open
        ? createPortal(
            <div ref={tipRef} id={tipId} className="project-tooltip" role="tooltip">
              {project.description}
            </div>,
            document.body,
          )
        : null}
    </a>
  )
}

function App() {
  const host = window.location.host
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches)
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
    const media = window.matchMedia('(min-width: 768px)')
    const onChange = () => setIsDesktop(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

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

  const collapsedRail = isDesktop && isCollapsed
  const logoSrc =
    collapsedRail && hovered
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
            aria-label={collapsedRail ? 'Expand sidebar' : 'Reload'}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={collapsedRail ? toggleSidebar : handleRefresh}
          >
            <img src={logoSrc} alt="" className={collapsedRail && hovered ? 'is-small' : ''} />
          </button>
          <span className="shell-brand">BetterGPT</span>
          {collapsedRail ? null : (
            <button
              type="button"
              className="shell-icon-btn shell-collapse"
              aria-label="Collapse sidebar"
              onClick={toggleSidebar}
            >
              <img src={`${import.meta.env.BASE_URL}minimizer.png`} alt="" />
            </button>
          )}
          <button
            type="button"
            className="shell-icon-btn shell-close"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="shell-nav" aria-label="Projects">
          <div className="shell-group">
            <p className="shell-section">Projects</p>
            {PROJECTS.map((project) => (
              <ProjectLink
                key={project.href}
                project={project}
                onNavigate={() => setMobileOpen(false)}
              />
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
