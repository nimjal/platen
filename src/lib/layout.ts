/**
 * The QWERTY layout as a map from character to the finger that types it.
 *
 * Every key belongs to the finger whose column it sits in, including the
 * number row: `4` is above `r`, so it is the left forefinger; `7` is above
 * `u`, so it is the right forefinger. One rule, no exceptions, nothing to
 * choose.
 */

export type Hand = 'left' | 'right'
export type FingerRole = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb'

export interface Finger {
  hand: Hand
  role: FingerRole
}

export const FINGER_LABEL: Record<FingerRole, string> = {
  pinky: 'little finger',
  ring: 'ring finger',
  middle: 'middle finger',
  index: 'forefinger',
  thumb: 'thumb'
}

const L = (role: FingerRole): Finger => ({ hand: 'left', role })
const R = (role: FingerRole): Finger => ({ hand: 'right', role })

/** Which finger presses each unshifted key. */
const KEYS: Record<string, Finger> = {
  '`': L('pinky'), 1: L('pinky'), q: L('pinky'), a: L('pinky'), z: L('pinky'),
  2: L('ring'), w: L('ring'), s: L('ring'), x: L('ring'),
  3: L('middle'), e: L('middle'), d: L('middle'), c: L('middle'),
  4: L('index'), 5: L('index'),
  r: L('index'), t: L('index'), f: L('index'), g: L('index'), v: L('index'), b: L('index'),
  6: R('index'), 7: R('index'),
  y: R('index'), u: R('index'), h: R('index'), j: R('index'), n: R('index'), m: R('index'),
  8: R('middle'), i: R('middle'), k: R('middle'), ',': R('middle'),
  9: R('ring'), o: R('ring'), l: R('ring'), '.': R('ring'),
  0: R('pinky'), p: R('pinky'), ';': R('pinky'), '/': R('pinky'),
  '-': R('pinky'), '=': R('pinky'), '[': R('pinky'), ']': R('pinky'),
  "'": R('pinky'), '\\': R('pinky'),
  ' ': L('thumb')
}

/** Characters reached by holding shift, mapped to the key underneath. */
const SHIFTED: Record<string, string> = {
  '~': '`', '!': '1', '@': '2', '#': '3', $: '4', '%': '5',
  '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', _: '-', '+': '=',
  '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/'
}

/** The key each finger rests on between strokes. */
const HOME: Record<Hand, Record<FingerRole, string>> = {
  left: { pinky: 'a', ring: 's', middle: 'd', index: 'f', thumb: ' ' },
  right: { pinky: ';', ring: 'l', middle: 'k', index: 'j', thumb: ' ' }
}

export const HOME_KEYS = 'asdfjkl;'

export function fingerFor (key: string): Finger | null {
  if (key === 'space') return L('thumb')
  return KEYS[key] ?? null
}

/** The home key a finger returns to after reaching for `key`. */
export function homeKeyFor (key: string): string {
  const finger = fingerFor(baseKeyFor(key))
  return finger === null ? 'f' : HOME[finger.hand][finger.role]
}

/** The unshifted key that produces `char`. */
export function baseKeyFor (char: string): string {
  if (char >= 'A' && char <= 'Z') return char.toLowerCase()
  return SHIFTED[char] ?? char
}

export function needsShift (char: string): boolean {
  return (char >= 'A' && char <= 'Z') || SHIFTED[char] !== undefined
}

export interface KeyStroke {
  /** The key cap to press: `f`, `9`, `space`. */
  key: string
  shift: boolean
  finger: Finger
  /** Shift is always pressed by the little finger of the other hand. */
  shiftFinger: Finger | null
}

export function strokeFor (char: string): KeyStroke | null {
  if (char === '') return null
  if (char === ' ') {
    return { key: 'space', shift: false, finger: L('thumb'), shiftFinger: null }
  }

  const key = baseKeyFor(char)
  const shift = needsShift(char)
  const finger = fingerFor(key)
  if (finger === null) return null

  const shiftFinger: Finger | null = shift
    ? { hand: finger.hand === 'left' ? 'right' : 'left', role: 'pinky' }
    : null

  return { key, shift, finger, shiftFinger }
}

/** Every character this layout can produce, including shifted forms. */
export function allCharacters (): string {
  return Object.keys(KEYS).join('') +
    Object.keys(SHIFTED).join('') +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
}

/** CSS custom property holding the colour for a finger. */
export function fingerVar (finger: Finger | null): string {
  return finger === null ? 'var(--f-none)' : `var(--f-${finger.role})`
}

export function roleVar (role: FingerRole): string {
  return `var(--f-${role})`
}

const ROLE_ORDER: FingerRole[] = ['index', 'middle', 'ring', 'pinky', 'thumb']

/** The distinct fingers a set of keys trains, strongest finger first. */
export function rolesFor (keys: string[]): FingerRole[] {
  const roles = new Set<FingerRole>()
  for (const key of keys) {
    const finger = fingerFor(baseKeyFor(key))
    if (finger !== null) roles.add(finger.role)
  }
  return ROLE_ORDER.filter((role) => roles.has(role))
}

/** A plain-English name for a key, for use in the guide. */
export function fingerNameFor (key: string): string {
  const finger = fingerFor(baseKeyFor(key))
  if (finger === null) return 'thumb'
  return `${finger.hand} ${FINGER_LABEL[finger.role]}`
}
