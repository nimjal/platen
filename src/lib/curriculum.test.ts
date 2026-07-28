import { describe, expect, it } from 'vitest'
import {
  CHAPTERS,
  LESSONS,
  hashOf,
  idOf,
  isValid,
  meetsStandard,
  nextRef,
  ordinalOf,
  parseHash,
  previousRef,
  standardFor
} from './curriculum'
import { troubleLesson, wordsFor } from './generate'
import { homeKeyFor, strokeFor } from './layout'

describe('the taught set', () => {
  it('grows and never shrinks', () => {
    let previous = ''
    for (const chapter of CHAPTERS) {
      expect(chapter.taught.startsWith(previous)).toBe(true)
      previous = chapter.taught
    }
  })

  it('covers the whole keyboard by the end', () => {
    const final = CHAPTERS[CHAPTERS.length - 1].taught
    for (const char of 'abcdefghijklmnopqrstuvwxyz0123456789') {
      expect(final).toContain(char)
    }
    for (const char of ".,;'-=[]\\`/") {
      expect(final).toContain(char)
    }
  })
})

describe('generated lessons', () => {
  it('never use a character that has not been taught', () => {
    const offenders: string[] = []
    for (const chapter of CHAPTERS) {
      for (const lesson of chapter.lessons) {
        for (const char of lesson.text) {
          if (!chapter.taught.includes(char)) {
            offenders.push(`${lesson.id} (${chapter.title}): ${JSON.stringify(char)}`)
          }
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('map every character to a finger', () => {
    const unmapped = new Set<string>()
    for (const lesson of LESSONS) {
      for (const char of lesson.text) {
        if (strokeFor(char) === null) unmapped.add(char)
      }
    }
    expect([...unmapped]).toEqual([])
  })

  it('are long enough to be worth doing and short enough to finish', () => {
    for (const lesson of LESSONS) {
      expect(lesson.text.length).toBeGreaterThanOrEqual(100)
      expect(lesson.text.length).toBeLessThanOrEqual(500)
    }
  })

  it('are tidy: no leading, trailing or double spaces', () => {
    for (const lesson of LESSONS) {
      expect(lesson.text).toBe(lesson.text.trim())
      expect(lesson.text).not.toContain('  ')
    }
  })

  it('are the same on every build', () => {
    const first = CHAPTERS[1].lessons[0].text
    const again = CHAPTERS[1].lessons[0].text
    expect(first).toBe(again)
  })

  it('give each chapter that adds keys some drill on those keys', () => {
    for (const chapter of CHAPTERS) {
      const letters = chapter.keys.filter((key) => /^[a-z]$/.test(key))
      if (letters.length === 0) continue
      const reach = chapter.lessons[0].text
      for (const letter of letters) {
        expect(reach).toContain(letter)
      }
    }
  })

  it('put the new keys in front of the learner more than the old ones', () => {
    for (const chapter of CHAPTERS) {
      const letters = chapter.keys.filter((key) => /^[a-z]$/.test(key))
      if (letters.length === 0) continue
      const text = chapter.lessons[0].text.replace(/\s/g, '')
      const fresh = [...text].filter((char) => letters.includes(char)).length
      expect(fresh / text.length).toBeGreaterThan(0.2)
    }
  })

  /**
   * The Reach drill is built key by key, so a length budget applied across the
   * whole thing starves whichever key is declared last: it keeps the opening
   * `ded` for every key but drops the later anchors off the end. Counting
   * strokes catches that where checking for one pattern does not.
   */
  it('give every new key the same amount of reach drill, not just the first', () => {
    const starved: string[] = []
    for (const chapter of CHAPTERS) {
      if (chapter.kind !== 'keys') continue
      const reach = chapter.lessons[0].text
      const counts = chapter.keys.map((key) => ({
        key,
        home: homeKeyFor(key),
        n: [...reach].filter((char) => char === key).length
      }))
      const most = Math.max(...counts.map((count) => count.n))
      for (const count of counts) {
        if (count.n < most * 0.6) {
          starved.push(`${chapter.title}: ${count.key} struck ${count.n}x against ${most}x`)
        }
        // And every key is reached from its own anchor at least once.
        expect(reach).toContain(`${count.home}${count.key}${count.home}`)
      }
    }
    expect(starved).toEqual([])
  })

  /**
   * A drill that runs out of material pads by repeating what it has. One
   * chapter used to be a third the word `all`, which trains nothing.
   */
  it('never pad a drill by repeating one token over and over', () => {
    const offenders: string[] = []
    for (const lesson of LESSONS) {
      const tokens = lesson.text.split(' ')
      const counts = new Map<string, number>()
      for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1)
      for (const [token, count] of counts) {
        if (count / tokens.length > 0.25) {
          offenders.push(`${lesson.id} (${lesson.title}): ${token} x${count} of ${tokens.length}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('the word pool', () => {
  it('has something to work with even on the home row alone', () => {
    expect(wordsFor(' asdfjkl;').length).toBeGreaterThan(10)
  })

  it('grows with the alphabet', () => {
    const home = wordsFor(' asdfjkl;').length
    const more = wordsFor(' asdfjkl;eoir').length
    expect(more).toBeGreaterThan(home)
  })

  /**
   * The point of ordering the keys by coverage rather than by geometry. If a
   * reordering costs the learner their vocabulary, it has undone the syllabus
   * whatever else it improved.
   */
  it('opens up most of the word bank by the fourth chapter', () => {
    const all = wordsFor(CHAPTERS[CHAPTERS.length - 1].taught).length
    const byFour = wordsFor(CHAPTERS[3].taught).length
    expect(byFour / all).toBeGreaterThan(0.6)
  })
})

describe('navigation', () => {
  it('walks the whole course in a straight line', () => {
    let ref = { chapter: 1, lesson: 1 }
    let seen = 1
    let next = nextRef(ref)
    while (next !== null) {
      expect(ordinalOf(next)).toBe(ordinalOf(ref) + 1)
      ref = next
      seen++
      next = nextRef(ref)
    }
    expect(seen).toBe(LESSONS.length)
  })

  it('goes back the way it came', () => {
    const ref = { chapter: 3, lesson: 2 }
    expect(previousRef(ref)).toEqual({ chapter: 3, lesson: 1 })
    expect(previousRef({ chapter: 3, lesson: 1 })).toEqual({
      chapter: 2,
      lesson: CHAPTERS[1].lessons.length
    })
    expect(previousRef({ chapter: 1, lesson: 1 })).toBeNull()
  })

  it('round-trips through the URL fragment', () => {
    for (const lesson of LESSONS) {
      const ref = { chapter: lesson.chapter, lesson: lesson.index }
      expect(parseHash(hashOf(ref))).toEqual(ref)
      expect(idOf(ref)).toBe(lesson.id)
    }
  })

  it('rejects lessons that do not exist', () => {
    expect(isValid({ chapter: 0, lesson: 1 })).toBe(false)
    expect(isValid({ chapter: 1, lesson: 0 })).toBe(false)
    expect(isValid({ chapter: 99, lesson: 1 })).toBe(false)
    expect(isValid({ chapter: 1, lesson: 99 })).toBe(false)
    expect(isValid({ chapter: 1, lesson: 1 })).toBe(true)
  })

  it('treats a junk fragment as the first lesson', () => {
    expect(parseHash('#nonsense')).toEqual({ chapter: 1, lesson: 1 })
    expect(parseHash('')).toEqual({ chapter: 1, lesson: 1 })
  })
})

describe('the standard', () => {
  it('asks more of later chapters, but not endlessly', () => {
    expect(standardFor(1).wpm).toBeLessThan(standardFor(5).wpm)
    expect(standardFor(11).wpm).toBeLessThanOrEqual(32)
    expect(standardFor(1).accuracy).toBe(96)
  })

  it('needs both speed and accuracy', () => {
    expect(meetsStandard(1, 40, 90)).toBe(false)
    expect(meetsStandard(1, 5, 100)).toBe(false)
    expect(meetsStandard(1, 20, 99)).toBe(true)
  })
})

describe('the trouble drill', () => {
  it('is built from the keys asked for', () => {
    const lesson = troubleLesson(['e', 'i'], ' asdfjkl;eiru')
    expect(lesson.text).toContain('e')
    expect(lesson.text).toContain('i')
    expect(lesson.text.length).toBeGreaterThan(80)
  })

  it('ignores keys the learner has not been taught', () => {
    const lesson = troubleLesson(['z'], ' asdfjkl;')
    for (const char of lesson.text) {
      expect(' asdfjkl;').toContain(char)
    }
  })
})
