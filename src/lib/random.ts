/**
 * A small seeded generator, so a lesson reads the same on every visit and in
 * every test run. Lesson text is calculated rather than stored, and calculated
 * text that shuffles on reload would make progress impossible to compare.
 */
export interface Rand {
  /** A float in [0, 1). */
  next: () => number
  int: (limit: number) => number
  pick: <T>(items: readonly T[]) => T
  shuffled: <T>(items: readonly T[]) => T[]
}

/** Turns a string into a 32-bit seed. */
export function seedFrom (text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** mulberry32 — short, fast, and good enough for shuffling word lists. */
export function makeRand (seed: number | string): Rand {
  let state = (typeof seed === 'string' ? seedFrom(seed) : seed) >>> 0

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const int = (limit: number): number => Math.floor(next() * limit)

  const pick = <T>(items: readonly T[]): T => items[int(items.length)]

  const shuffled = <T>(items: readonly T[]): T[] => {
    const out = [...items]
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(i + 1)
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }

  return { next, int, pick, shuffled }
}
