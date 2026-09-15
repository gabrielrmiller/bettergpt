import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { usePinLock } from '../hooks/usePinLock'

type PinLockHandle = ReturnType<typeof usePinLock>

export function PinLock({ lock }: { lock: PinLockHandle }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(lock.pin)
  const [focused, setFocused] = useState(false)
  const [reveal, setReveal] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!focused) setDraft(lock.pin)
  }, [focused, lock.pin])

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  async function submit(event: FormEvent) {
    event.preventDefault()
    lock.setBusy(true)
    lock.setStatus('Linking key…')
    try {
      await lock.linkPin(draft)
      setOpen(false)
    } catch (error) {
      lock.setStatus(error instanceof Error ? error.message : 'Could not link this key.')
    } finally {
      lock.setBusy(false)
    }
  }

  async function copyPin() {
    const value = draft.trim() || lock.pin
    if (!value) {
      lock.setStatus('Generate or type a key first.')
      return
    }
    try {
      await navigator.clipboard.writeText(value)
      lock.setStatus('Copied. Keep this key private.')
    } catch {
      lock.setStatus('Copy failed. Select the key and copy it yourself.')
    }
  }

  return (
    <div className="pin-lock" ref={rootRef}>
      {open ? (
        <section className="pin-lock__panel" role="dialog" aria-label="Device key">
          <div className="pin-lock__head">
            <p className="pin-lock__label">Device key</p>
            {lock.linked ? <span className="pin-lock__badge">Linked</span> : null}
          </div>
          <p className="pin-lock__hint">
            One key keeps these stacks in sync on every device. Anyone with it can change them.
          </p>
          <form className="pin-lock__form" onSubmit={submit}>
            <label className="pin-lock__field">
              <span>Key</span>
              <input
                type={reveal ? 'text' : 'password'}
                name="book-key"
                autoComplete="off"
                spellCheck={false}
                maxLength={128}
                value={draft}
                disabled={lock.busy}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onChange={(event) => setDraft(event.target.value)}
              />
            </label>
            <div className="pin-lock__actions">
              <button
                type="button"
                disabled={lock.busy}
                onClick={() => {
                  const next = lock.generatePin()
                  setDraft(next)
                  setReveal(true)
                  lock.setStatus('Copy this key, then click Use key.')
                }}
              >
                New key
              </button>
              <button type="submit" disabled={lock.busy}>
                Use key
              </button>
              <button type="button" disabled={lock.busy} onClick={() => void copyPin()}>
                Copy
              </button>
              <button
                type="button"
                disabled={lock.busy}
                onClick={() => {
                  lock.forgetPin()
                  setDraft('')
                  setReveal(false)
                }}
              >
                Forget
              </button>
            </div>
            <p className="pin-lock__status">{lock.status}</p>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className={`pin-lock__token${lock.linked ? ' is-linked' : ''}`}
        aria-expanded={open}
        aria-label={lock.linked ? 'Device key linked' : 'Sync stacks with a device key'}
        onClick={(event) => {
          event.stopPropagation()
          setOpen((current) => !current)
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {lock.linked ? (
            <path
              fill="currentColor"
              d="M8.5 10.2V8.4a3.5 3.5 0 0 1 7 0v1.8h1.3A1.7 1.7 0 0 1 18.5 12v6.3A1.7 1.7 0 0 1 16.8 20H7.2A1.7 1.7 0 0 1 5.5 18.3V12a1.7 1.7 0 0 1 1.7-1.8Zm2-1.8v1.8h3V8.4a1.5 1.5 0 0 0-3 0Z"
            />
          ) : (
            <path
              fill="currentColor"
              d="M8.5 10.2h7V8.4a3.5 3.5 0 0 0-6.7-1.4l-1.7-.8A5.5 5.5 0 0 1 17.5 8.4v1.8h.3A1.7 1.7 0 0 1 19.5 12v6.3A1.7 1.7 0 0 1 17.8 20H6.2A1.7 1.7 0 0 1 4.5 18.3V12a1.7 1.7 0 0 1 1.7-1.8Zm-2 1.8v6.3h11V12Z"
            />
          )}
        </svg>
        <span>{lock.linked ? 'Linked' : 'Key'}</span>
      </button>
    </div>
  )
}
