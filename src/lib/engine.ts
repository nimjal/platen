/**
 * The typing engine, kept free of React so it can be tested directly.
 *
 *   ready -> running -> error -> running -> ... -> done
 *
 * Two counts are kept, because they answer different questions. `errors` is
 * the number of times the learner went off the rails, which is what the status
 * light reflects. `wrong` out of `strokes` is keystroke accuracy, which is what
 * decides whether a lesson has been passed — a fumbled word should cost four
 * keystrokes, not one.
 *
 * Whether a finished run counts as passed is not the engine's business; that
 * depends on the chapter's standard and lives in `curriculum.ts`.
 */

export type Status = 'ready' | 'running' | 'error' | 'done'

export type Command = 'restart' | 'fix' | null

export interface Session {
  status: Status
  /** Runs of mistakes, not individual wrong keys. */
  errors: number
  /** Characters typed forward; backspaces are not counted. */
  strokes: number
  /** Of those, the ones that did not match. */
  wrong: number
  startedAt: number | null
  finishedAt: number | null
  /** The characters the learner got wrong, one entry per run of mistakes. */
  missed: string[]
}

export interface StepResult {
  session: Session
  /** The input after the engine has had its say (`fix` truncates it). */
  value: string
  /** Number of leading characters that match the target. */
  goodChars: number
  /** Set when the learner typed a command the caller has to act on. */
  command: Command
}

export function newSession (): Session {
  return {
    status: 'ready',
    errors: 0,
    strokes: 0,
    wrong: 0,
    startedAt: null,
    finishedAt: null,
    missed: []
  }
}

export function commonPrefix (a: string, b: string): number {
  const limit = Math.min(a.length, b.length)
  let i = 0
  while (i < limit && a[i] === b[i]) i++
  return i
}

/** Keystroke accuracy as a percentage. An untouched lesson is 100. */
export function accuracy (session: Session): number {
  if (session.strokes === 0) return 100
  const right = session.strokes - session.wrong
  return Math.max(0, Math.min(100, (100 * right) / session.strokes))
}

/**
 * Words per minute, where a word is five characters. The first character is
 * excluded because it starts the clock and so is not itself timed.
 */
export function wordsPerMinute (goodChars: number, elapsedMs: number): number {
  if (goodChars <= 1 || elapsedMs <= 0) return 0
  return Math.round((60000 * (goodChars - 1)) / 5 / elapsedMs)
}

function detectCommand (value: string): Command {
  if (value.endsWith('restart') || value.endsWith('rst')) return 'restart'
  if (value.endsWith('fix') || value.endsWith('xxx')) return 'fix'
  return null
}

/**
 * Advances the session from `previous` to `value`.
 *
 * `now` is passed in rather than read from the clock so tests stay
 * deterministic.
 */
export function step (
  session: Session,
  target: string,
  previous: string,
  value: string,
  now: number
): StepResult {
  if (session.status === 'done') {
    return { session, value: previous, goodChars: commonPrefix(target, previous), command: null }
  }

  const next: Session = { ...session, missed: [...session.missed] }
  let command: Command = null

  if (next.status === 'ready' && value.length > 0) {
    next.startedAt = now
    next.status = 'running'
  }

  const before = commonPrefix(target, previous)
  const goodChars = commonPrefix(target, value)

  // Only forward motion counts as a keystroke, so holding backspace cannot be
  // used to talk accuracy back up.
  const grew = value.length - previous.length
  if (grew > 0) {
    const gained = Math.max(0, goodChars - before)
    next.strokes += grew
    next.wrong += Math.max(0, grew - gained)
  }

  if (goodChars === value.length) {
    if (next.status === 'error') next.status = 'running'
  } else {
    if (next.status === 'running') {
      next.status = 'error'
      next.errors += 1
      const expected = target.charAt(goodChars)
      if (expected !== '') next.missed.push(expected)
    }
    command = detectCommand(value)
    if (command === 'fix') {
      // Drop everything after the last good character and re-evaluate.
      const fixed = step(next, target, value, value.slice(0, goodChars), now)
      return { ...fixed, command: 'fix' }
    }
    if (command === 'restart') {
      return { session: newSession(), value: '', goodChars: 0, command }
    }
  }

  if (target.length > 0 && goodChars === target.length) {
    next.status = 'done'
    next.finishedAt = now
  }

  return { session: next, value, goodChars, command }
}

export function elapsedMs (session: Session, now: number): number {
  if (session.startedAt === null) return 0
  return (session.finishedAt ?? now) - session.startedAt
}

export function formatDuration (ms: number): string {
  const total = Math.floor(ms / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** A span of practice time, for the progress panel. */
export function formatSpan (ms: number): string {
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

const JOY = '(｡ʘ‿ʘ｡)'
const HAPPY = '(ʘ‿ʘ)'
const UNHAPPY = '(⊙_⊙)'
const SAD = '(⊙⁔⊙)'

/** Four faces, chosen from accuracy and speed. */
export function faceFor (session: Session, wpm: number): string {
  const percent = accuracy(session)
  if (percent >= 99) return wpm >= 40 ? JOY : HAPPY
  if (percent >= 95) return UNHAPPY
  return SAD
}
