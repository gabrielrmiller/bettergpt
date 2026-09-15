import { useCallback, useEffect, useRef, useState } from 'react'
import { hasTrackerData, trackerSnapshot } from '../storage'
import { generatePin, loadPin, savePin, syncBooks, validPin } from '../sync'
import type { TrackerState } from '../types'

const PUSH_DELAY_MS = 400

export function usePinLock(state: TrackerState, replaceState: (next: TrackerState) => void) {
  const [pin, setPin] = useState(loadPin)
  const [status, setStatus] = useState(() =>
    loadPin()
      ? 'Linked. These stacks follow this key across devices.'
      : 'Stacks stay on this browser until you set a key.',
  )
  const [busy, setBusy] = useState(false)
  const skipPushRef = useRef(false)
  const readyRef = useRef(false)
  const pinRef = useRef(pin)
  const stateRef = useRef(state)

  pinRef.current = pin
  stateRef.current = state

  const pushCloud = useCallback(async () => {
    const currentPin = pinRef.current
    if (!currentPin) return
    await syncBooks('put', currentPin, stateRef.current)
    setStatus('Linked. These stacks follow this key across devices.')
  }, [])

  const applyRemote = useCallback(
    (next: TrackerState) => {
      skipPushRef.current = true
      replaceState(next)
    },
    [replaceState],
  )

  const linkPin = useCallback(
    async (rawPin: string) => {
      const nextPin = validPin(rawPin)
      if (!nextPin) throw new Error('Enter a key first.')

      const previous = pinRef.current
      setPin(nextPin)
      pinRef.current = nextPin

      let remote
      try {
        remote = await syncBooks('get', nextPin)
      } catch (error) {
        setPin(previous)
        pinRef.current = previous
        throw error
      }

      const local = stateRef.current
      const localHasData = hasTrackerData(local)
      const remoteHasData = Boolean(remote.found && remote.state && hasTrackerData(remote.state))
      const same =
        remote.state !== null && trackerSnapshot(local) === trackerSnapshot(remote.state)

      if (remoteHasData && remote.state && !same && localHasData) {
        const useCloud = window.confirm(
          "This key already has stacks saved. This device also has stacks. OK uses the key's books. Cancel keeps this device and overwrites the key.",
        )
        if (useCloud) applyRemote(remote.state)
      } else if (remote.found && remote.state && !localHasData) {
        applyRemote(remote.state)
      }

      savePin(nextPin)
      if (!remote.found || localHasData) await pushCloud()
      setStatus('Linked. These stacks follow this key across devices.')
    },
    [applyRemote, pushCloud],
  )

  const forgetPin = useCallback(() => {
    setPin('')
    pinRef.current = ''
    savePin('')
    setStatus('Forgotten on this device. Synced stacks stay until someone uses the key.')
  }, [])

  useEffect(() => {
    let cancelled = false

    async function restore() {
      const stored = loadPin()
      if (!stored) {
        readyRef.current = true
        return
      }

      try {
        const remote = await syncBooks('get', stored)
        if (cancelled) return
        if (remote.found && remote.state) applyRemote(remote.state)
        else await pushCloud()
        if (!cancelled) setStatus('Linked. These stacks follow this key across devices.')
      } catch (error) {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : 'Could not load this key.')
        }
      } finally {
        readyRef.current = true
      }
    }

    void restore()
    return () => {
      cancelled = true
    }
  }, [applyRemote, pushCloud])

  useEffect(() => {
    if (!pin || !readyRef.current) return
    if (skipPushRef.current) {
      skipPushRef.current = false
      return
    }

    const timer = window.setTimeout(() => {
      pushCloud().catch((error: unknown) => {
        setStatus(error instanceof Error ? error.message : 'Could not save to your key.')
      })
    }, PUSH_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [pin, pushCloud, state])

  return {
    pin,
    linked: Boolean(pin),
    status,
    setStatus,
    busy,
    setBusy,
    linkPin,
    forgetPin,
    generatePin,
  }
}
