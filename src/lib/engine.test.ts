import { describe, expect, it } from 'vitest'
import {
  accuracy,
  commonPrefix,
  elapsedMs,
  faceFor,
  formatDuration,
  formatSpan,
  newSession,
  step,
  wordsPerMinute,
  type Session
} from './engine'

/** Types `text` one character at a time, as a person would. */
function type (target: string, text: string, start = 1000): { session: Session; value: string } {
  let session = newSession()
  let value = ''
  for (let i = 0; i < text.length; i++) {
    const result = step(session, target, value, value + text[i], start + i * 10)
    session = result.session
    value = result.value
  }
  return { session, value }
}

describe('commonPrefix', () => {
  it('counts the leading characters that match', () => {
    expect(commonPrefix('asdf', 'as')).toBe(2)
    expect(commonPrefix('asdf', 'asdf')).toBe(4)
    expect(commonPrefix('asdf', 'axdf')).toBe(1)
    expect(commonPrefix('asdf', '')).toBe(0)
  })
})

describe('the state machine', () => {
  it('starts the clock on the first keystroke', () => {
    const before = newSession()
    expect(before.status).toBe('ready')
    expect(before.startedAt).toBeNull()

    const after = step(before, 'asdf', '', 'a', 5000).session
    expect(after.status).toBe('running')
    expect(after.startedAt).toBe(5000)
  })

  it('enters the error state once per run of mistakes', () => {
    // `xxx` is the fix command, so a plain wrong key is used here.
    const { session } = type('asdf', 'aqqq')
    expect(session.status).toBe('error')
    expect(session.errors).toBe(1)
  })

  it('counts a second run of mistakes separately', () => {
    let session = newSession()
    let value = ''
    for (const [i, char] of [...'axa'].entries()) {
      const out = step(session, 'asdf', value, value + char, 1000 + i)
      session = out.session
      value = out.value
    }
    // Back on track after deleting the bad character.
    let out = step(session, 'asdf', value, 'a', 1100)
    session = out.session
    expect(session.status).toBe('running')
    // ...and off again.
    out = step(session, 'asdf', 'a', 'aq', 1200)
    expect(out.session.errors).toBe(2)
  })

  it('finishes when the whole target has been typed', () => {
    const { session } = type('asdf', 'asdf')
    expect(session.status).toBe('done')
    expect(session.errors).toBe(0)
    expect(session.finishedAt).not.toBeNull()
  })

  it('ignores further input once finished', () => {
    const { session, value } = type('as', 'as')
    const after = step(session, 'as', value, 'asd', 9999)
    expect(after.session).toBe(session)
    expect(after.value).toBe('as')
  })

  it('records which character was missed', () => {
    const { session } = type('asdf', 'asx')
    expect(session.missed).toEqual(['d'])
  })
})

describe('keystroke accuracy', () => {
  it('is 100 before anything is typed', () => {
    expect(accuracy(newSession())).toBe(100)
  })

  it('counts every wrong key, not every run of them', () => {
    const { session } = type('asdf', 'aqqq')
    expect(session.strokes).toBe(4)
    expect(session.wrong).toBe(3)
    expect(accuracy(session)).toBe(25)
  })

  it('is not repaired by backspacing', () => {
    const { session, value } = type('asdf', 'ax')
    expect(session.wrong).toBe(1)
    const after = step(session, 'asdf', value, 'a', 2000).session
    expect(after.strokes).toBe(2)
    expect(after.wrong).toBe(1)
    expect(accuracy(after)).toBe(50)
  })

  it('is perfect for a clean run', () => {
    const { session } = type('asdf jkl;', 'asdf jkl;')
    expect(accuracy(session)).toBe(100)
  })
})

describe('the commands', () => {
  it('restart clears the session', () => {
    const start = type('asdf', 'as').session
    const out = step(start, 'asdf', 'as', 'asrestart', 3000)
    expect(out.command).toBe('restart')
    expect(out.value).toBe('')
    expect(out.session.status).toBe('ready')
  })

  it('fix trims back to the last good character', () => {
    const start = type('asdf jkl;', 'asdf ').session
    const out = step(start, 'asdf jkl;', 'asdf ', 'asdf fix', 3000)
    expect(out.command).toBe('fix')
    expect(out.value).toBe('asdf ')
    expect(out.goodChars).toBe(5)
  })
})

describe('speed', () => {
  it('excludes the character that started the clock', () => {
    // 11 good characters in 6 seconds: 10 timed characters = 2 words.
    expect(wordsPerMinute(11, 6000)).toBe(20)
  })

  it('is zero before there is anything to measure', () => {
    expect(wordsPerMinute(0, 1000)).toBe(0)
    expect(wordsPerMinute(1, 1000)).toBe(0)
    expect(wordsPerMinute(50, 0)).toBe(0)
  })
})

describe('the clock', () => {
  it('runs from the first keystroke to the last', () => {
    const session = { ...newSession(), startedAt: 1000, finishedAt: 4000 }
    expect(elapsedMs(session, 9999)).toBe(3000)
  })

  it('tracks the present while a lesson is in progress', () => {
    const session = { ...newSession(), startedAt: 1000 }
    expect(elapsedMs(session, 2500)).toBe(1500)
  })

  it('formats', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(65_000)).toBe('1:05')
    expect(formatSpan(90_000)).toBe('2m')
    expect(formatSpan(3_900_000)).toBe('1h 5m')
  })
})

describe('the faces', () => {
  it('gets happier with accuracy and speed', () => {
    const clean = { ...newSession(), strokes: 100, wrong: 0 }
    const messy = { ...newSession(), strokes: 100, wrong: 10 }
    expect(faceFor(clean, 60)).not.toBe(faceFor(clean, 10))
    expect(faceFor(messy, 60)).not.toBe(faceFor(clean, 60))
  })
})
