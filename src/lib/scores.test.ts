import { describe, expect, it } from 'vitest'
import { LESSONS, standardFor } from './curriculum'
import {
  chapterTally,
  emptyScores,
  frontier,
  isUnlocked,
  overallTally,
  recordRun,
  resumeRef,
  summarise,
  troubleKeys,
  unlock,
  type Result,
  type Scores
} from './scores'

function run (over: Partial<Result> = {}): Result {
  return {
    chapter: 1,
    wpm: 30,
    accuracy: 99,
    ms: 30_000,
    chars: 200,
    errors: 0,
    misses: [],
    ...over
  }
}

/** Passes every lesson from the start up to, but not including, `count`. */
function passUpTo (count: number): Scores {
  let scores = emptyScores()
  for (let i = 0; i < count; i++) {
    const lesson = LESSONS[i]
    scores = recordRun(scores, lesson.id, run({ chapter: lesson.chapter, wpm: 40 }))
  }
  return scores
}

describe('recording a run', () => {
  it('keeps the best of each measure and counts the attempts', () => {
    let scores = emptyScores()
    scores = recordRun(scores, '1.1', run({ wpm: 20, accuracy: 97 }))
    scores = recordRun(scores, '1.1', run({ wpm: 34, accuracy: 91 }))

    const record = scores.lessons['1.1']
    expect(record.bestWpm).toBe(34)
    expect(record.bestAccuracy).toBe(97)
    expect(record.attempts).toBe(2)
    expect(scores.runs).toHaveLength(2)
  })

  it('passes only when both speed and accuracy meet the standard', () => {
    const standard = standardFor(1)

    const slow = recordRun(emptyScores(), '1.1', run({ wpm: standard.wpm - 1, accuracy: 100 }))
    expect(slow.lessons['1.1'].passed).toBe(false)

    const sloppy = recordRun(emptyScores(), '1.1', run({ wpm: 60, accuracy: standard.accuracy - 1 }))
    expect(sloppy.lessons['1.1'].passed).toBe(false)

    const good = recordRun(emptyScores(), '1.1', run({ wpm: standard.wpm, accuracy: standard.accuracy }))
    expect(good.lessons['1.1'].passed).toBe(true)
  })

  it('never un-passes a lesson that was passed before', () => {
    let scores = recordRun(emptyScores(), '1.1', run({ wpm: 40, accuracy: 100 }))
    scores = recordRun(scores, '1.1', run({ wpm: 2, accuracy: 40 }))
    expect(scores.lessons['1.1'].passed).toBe(true)
  })

  it('tallies the characters that were missed', () => {
    let scores = recordRun(emptyScores(), '1.1', run({ misses: ['a', 'k', 'a'] }))
    scores = recordRun(scores, '1.2', run({ misses: ['a'] }))
    expect(scores.misses).toEqual({ a: 3, k: 1 })
    expect(troubleKeys(scores)).toEqual([
      { char: 'a', count: 3 },
      { char: 'k', count: 1 }
    ])
  })

  it('caps the run history so storage cannot grow forever', () => {
    let scores = emptyScores()
    for (let i = 0; i < 450; i++) scores = recordRun(scores, '1.1', run())
    expect(scores.runs.length).toBeLessThanOrEqual(400)
  })
})

describe('the linear gate', () => {
  it('opens one lesson at a time', () => {
    const fresh = emptyScores()
    expect(frontier(fresh)).toBe(0)
    expect(isUnlocked(fresh, { chapter: 1, lesson: 1 })).toBe(true)
    expect(isUnlocked(fresh, { chapter: 1, lesson: 2 })).toBe(false)

    const after = passUpTo(1)
    expect(isUnlocked(after, { chapter: 1, lesson: 2 })).toBe(true)
    expect(isUnlocked(after, { chapter: 1, lesson: 3 })).toBe(false)
  })

  it('does not open on a failed attempt', () => {
    const scores = recordRun(emptyScores(), '1.1', run({ wpm: 2, accuracy: 50 }))
    expect(isUnlocked(scores, { chapter: 1, lesson: 2 })).toBe(false)
  })

  it('drops a returning learner at the frontier', () => {
    expect(resumeRef(emptyScores())).toEqual({ chapter: 1, lesson: 1 })
    expect(resumeRef(passUpTo(3))).toEqual({ chapter: 1, lesson: 4 })
  })

  it('can be opened by hand, up to but not including the lesson asked for', () => {
    const target = { chapter: 3, lesson: 2 }
    const scores = unlock(emptyScores(), target)
    expect(isUnlocked(scores, target)).toBe(true)
    expect(resumeRef(scores)).toEqual(target)
    expect(scores.lessons[`${target.chapter}.${target.lesson}`]).toBeUndefined()
  })
})

describe('summaries', () => {
  it('counts passed lessons by chapter and overall', () => {
    const scores = passUpTo(7)
    expect(overallTally(scores).passed).toBe(7)
    expect(overallTally(scores).total).toBe(LESSONS.length)
    expect(chapterTally(scores, 1, 5)).toEqual({ passed: 5, total: 5 })
    expect(chapterTally(scores, 2, 5)).toEqual({ passed: 2, total: 5 })
  })

  it('reports recent speed, best speed and time practised', () => {
    let scores = emptyScores()
    for (const wpm of [10, 20, 30, 40]) {
      scores = recordRun(scores, '1.1', run({ wpm, ms: 60_000 }))
    }
    const summary = summarise(scores)
    expect(summary.runs).toBe(4)
    expect(summary.recentWpm).toBe(25)
    expect(summary.bestWpm).toBe(40)
    expect(summary.ms).toBe(240_000)
    expect(summary.streak).toBe(1)
  })

  it('has nothing to say about an empty history', () => {
    const summary = summarise(emptyScores())
    expect(summary.runs).toBe(0)
    expect(summary.recentWpm).toBe(0)
    expect(summary.streak).toBe(0)
    expect(troubleKeys(emptyScores())).toEqual([])
  })
})
