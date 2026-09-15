import { parseTrackerState } from './storage'
import type { TrackerState } from './types'

export const PIN_STORAGE_KEY = 'book-tracker-key:v1'
const PIN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

type SyncResponse = {
  found?: boolean
  state?: unknown
  error?: string
}

function syncUrl(): string {
  if (window.location.pathname.startsWith('/books')) return '/api/books/sync'
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'https://bettergpt-lake.vercel.app/api/books/sync'
  }
  return '/api/books/sync'
}

export function loadPin(): string {
  try {
    return String(localStorage.getItem(PIN_STORAGE_KEY) || '').trim()
  } catch {
    return ''
  }
}

export function savePin(pin: string): void {
  if (pin) localStorage.setItem(PIN_STORAGE_KEY, pin)
  else localStorage.removeItem(PIN_STORAGE_KEY)
}

export function generatePin(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => PIN_ALPHABET[byte & 31]).join('')
}

export function validPin(value: string): string {
  const pin = value.trim()
  return pin.length > 0 && pin.length <= 128 ? pin : ''
}

export async function syncBooks(
  action: 'get' | 'put',
  pin: string,
  state?: TrackerState,
): Promise<{ found: boolean; state: TrackerState | null }> {
  const response = await fetch(syncUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action === 'put' ? { action, key: pin, state } : { action, key: pin }),
  })
  const data = (await response.json().catch(() => ({}))) as SyncResponse
  if (!response.ok) {
    throw new Error(data.error || 'Could not sync books.')
  }
  const parsed = parseTrackerState(data.state)
  return { found: data.found === true && parsed !== null, state: parsed }
}
