import { useCallback, useEffect, useRef, useState } from 'react'
import {
  accuracy,
  commonPrefix,
  elapsedMs,
  faceFor,
  newSession,
  step,
  wordsPerMinute,
  type Command,
  type Session
} from '../lib/engine'

interface Snapshot {
  session: Session
  value: string
  /** The lesson text this snapshot belongs to. */
  target: string
}

export interface UseTypingSession {
  session: Session
  value: string
  goodChars: number
  wpm: number
  accuracy: number
  elapsed: number
  face: string
  finished: boolean
  mistake: boolean
  setValue: (value: string) => void
  restart: () => void
}

/**
 * Drives one lesson. The engine does the thinking; this hook owns the React
 * state, the live clock, and the reset when the target text changes.
 */
export function useTypingSession (
  target: string,
  onCommand?: (command: Command) => void
): UseTypingSession {
  const [snapshot, setSnapshot] = useState<Snapshot>(() => ({
    session: newSession(),
    value: '',
    target
  }))
  const [now, setNow] = useState(() => Date.now())

  const commandRef = useRef(onCommand)
  commandRef.current = onCommand

  // Switching lessons resets during render, not in an effect. An effect would
  // let one render pass through with a finished session already attributed to
  // the new lesson, which would bank a result nobody typed.
  let current = snapshot
  if (snapshot.target !== target) {
    current = { session: newSession(), value: '', target }
    setSnapshot(current)
  }

  const latest = useRef(current)
  latest.current = current

  const { session, value } = current

  // Keep the clock moving while the learner is typing so the timer and speed
  // stay honest between keystrokes.
  const running = session.status === 'running' || session.status === 'error'
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [running])

  const setValue = useCallback((next: string) => {
    const at = Date.now()
    const from = latest.current
    const result = step(from.session, from.target, from.value, next, at)
    const updated: Snapshot = {
      session: result.session,
      value: result.value,
      target: from.target
    }
    latest.current = updated
    setSnapshot(updated)
    setNow(at)
    if (result.command !== null) commandRef.current?.(result.command)
  }, [])

  const restart = useCallback(() => {
    const fresh: Snapshot = { session: newSession(), value: '', target: latest.current.target }
    latest.current = fresh
    setSnapshot(fresh)
    setNow(Date.now())
  }, [])

  const goodChars = commonPrefix(target, value)
  const elapsed = elapsedMs(session, now)
  const wpm = wordsPerMinute(goodChars, elapsed)

  return {
    session,
    value,
    goodChars,
    wpm,
    accuracy: accuracy(session),
    elapsed,
    face: faceFor(session, wpm),
    finished: session.status === 'done',
    mistake: session.status === 'error',
    setValue,
    restart
  }
}
