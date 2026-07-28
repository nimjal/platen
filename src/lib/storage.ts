/**
 * Local storage, and nothing else. The tutor makes no network requests: every
 * score, setting and keystroke stays in this browser.
 */
export const KEYS = {
  lesson: 'typing.lesson',
  theme: 'typing.theme',
  guide: 'typing.guide',
  keyboard: 'typing.keyboard',
  focus: 'typing.focus',
  scores: 'typing.scores'
} as const

export function readString (key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeString (key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* storage unavailable or full; carry on without persisting */
  }
}

export function removeKey (key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* nothing to do */
  }
}

export function readJSON<T> (key: string, fallback: T): T {
  const raw = readString(key)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON (key: string, value: unknown): void {
  writeString(key, JSON.stringify(value))
}

export function readFlag (key: string, fallback: boolean): boolean {
  const stored = readString(key)
  return stored === null ? fallback : stored === 'yes'
}

export function writeFlag (key: string, value: boolean): void {
  writeString(key, value ? 'yes' : 'no')
}
