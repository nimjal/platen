/**
 * Score keeping. Everything lives in this browser's local storage; nothing is
 * sent anywhere, and clearing site data clears the lot.
 *
 * Three things are kept: a best-ever record per lesson, a rolling history of
 * runs for the progress panel, and a count of how often each character was the
 * one the learner got wrong. The last of these is what makes the trouble-key
 * drill possible.
 */
import { LESSONS, idOf, meetsStandard, ordinalOf } from './curriculum'
import { KEYS, readJSON, removeKey, writeJSON } from './storage'
import type { LessonRef } from '../types'

export interface LessonScore {
  passed: boolean
  bestWpm: number
  bestAccuracy: number
  attempts: number
  lastAt: number
}

export interface Run {
  at: number
  id: string
  wpm: number
  accuracy: number
  ms: number
  chars: number
  errors: number
}

export interface Scores {
  version: 2
  lessons: Record<string, LessonScore>
  /** Newest last, capped so storage cannot grow without bound. */
  runs: Run[]
  /** Character -> number of times it was the one typed wrong. */
  misses: Record<string, number>
  /** Lessons unlocked by hand rather than by passing the one before. */
  skipped: string[]
}

const RUN_LIMIT = 400

export function emptyScores (): Scores {
  return { version: 2, lessons: {}, runs: [], misses: {}, skipped: [] }
}

export function loadScores (): Scores {
  const stored = readJSON<Partial<Scores>>(KEYS.scores, {})
  return {
    version: 2,
    lessons: stored.lessons ?? {},
    runs: stored.runs ?? [],
    misses: stored.misses ?? {},
    skipped: stored.skipped ?? []
  }
}

export function saveScores (scores: Scores): void {
  writeJSON(KEYS.scores, scores)
}

export function clearScores (): void {
  removeKey(KEYS.scores)
}

// ---------------------------------------------------------------- record --

export interface Result {
  chapter: number
  wpm: number
  accuracy: number
  ms: number
  chars: number
  errors: number
  /** Characters the learner got wrong during the run, one entry per slip. */
  misses: string[]
}

/** Folds a finished run into the scores. Pure: returns a new object. */
export function recordRun (scores: Scores, id: string, result: Result): Scores {
  const previous = scores.lessons[id]
  const passed = meetsStandard(result.chapter, result.wpm, result.accuracy)

  const misses = { ...scores.misses }
  for (const char of result.misses) {
    misses[char] = (misses[char] ?? 0) + 1
  }

  const run: Run = {
    at: Date.now(),
    id,
    wpm: result.wpm,
    accuracy: Math.round(result.accuracy),
    ms: result.ms,
    chars: result.chars,
    errors: result.errors
  }

  return {
    ...scores,
    lessons: {
      ...scores.lessons,
      [id]: {
        passed: (previous?.passed ?? false) || passed,
        bestWpm: Math.max(previous?.bestWpm ?? 0, result.wpm),
        bestAccuracy: Math.max(previous?.bestAccuracy ?? 0, result.accuracy),
        attempts: (previous?.attempts ?? 0) + 1,
        lastAt: run.at
      }
    },
    runs: [...scores.runs, run].slice(-RUN_LIMIT),
    misses
  }
}

export function scoreFor (scores: Scores, ref: LessonRef): LessonScore | undefined {
  return scores.lessons[idOf(ref)]
}

export function hasPassed (scores: Scores, ref: LessonRef): boolean {
  return scoreFor(scores, ref)?.passed ?? false
}

// ---------------------------------------------------------------- unlock --

/**
 * How far along the line the learner may go: every lesson up to and including
 * the first one they have not yet passed. The course is meant to be walked,
 * not browsed — but `unlock` is there for anyone who already types.
 */
export function frontier (scores: Scores): number {
  let i = 0
  while (i < LESSONS.length) {
    const id = LESSONS[i].id
    if ((scores.lessons[id]?.passed ?? false) || scores.skipped.includes(id)) i++
    else break
  }
  return Math.min(i, LESSONS.length - 1)
}

export function isUnlocked (scores: Scores, ref: LessonRef): boolean {
  const at = ordinalOf(ref)
  return at >= 0 && at <= frontier(scores)
}

/**
 * Opens the road as far as `ref` without passing anything. Every lesson
 * *before* it is marked skipped, so the frontier lands on `ref` itself and the
 * learner still has to do that one.
 */
export function unlock (scores: Scores, ref: LessonRef): Scores {
  const target = ordinalOf(ref)
  if (target < 0) return scores
  const skipped = new Set(scores.skipped)
  for (let i = 0; i < target; i++) skipped.add(LESSONS[i].id)
  return { ...scores, skipped: [...skipped] }
}

/** Where to drop the learner when they arrive with no lesson in the URL. */
export function resumeRef (scores: Scores): LessonRef {
  const lesson = LESSONS[frontier(scores)]
  return { chapter: lesson.chapter, lesson: lesson.index }
}

// ------------------------------------------------------------- summaries --

export interface Tally {
  passed: number
  total: number
}

export function chapterTally (scores: Scores, chapter: number, lessons: number): Tally {
  let passed = 0
  for (let i = 1; i <= lessons; i++) {
    if (scores.lessons[`${chapter}.${i}`]?.passed ?? false) passed++
  }
  return { passed, total: lessons }
}

export function overallTally (scores: Scores): Tally {
  let passed = 0
  for (const lesson of LESSONS) {
    if (scores.lessons[lesson.id]?.passed ?? false) passed++
  }
  return { passed, total: LESSONS.length }
}

export interface Summary {
  runs: number
  /** Mean speed over the last ten runs — the honest current number. */
  recentWpm: number
  bestWpm: number
  recentAccuracy: number
  chars: number
  ms: number
  /** Consecutive days up to today with at least one run. */
  streak: number
}

function dayOf (at: number): string {
  const date = new Date(at)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function summarise (scores: Scores): Summary {
  const runs = scores.runs
  const recent = runs.slice(-10)
  const mean = (values: number[]): number =>
    values.length === 0 ? 0 : Math.round(values.reduce((a, b) => a + b, 0) / values.length)

  const days = new Set(runs.map((run) => dayOf(run.at)))
  let streak = 0
  const cursor = new Date()
  while (days.has(dayOf(cursor.getTime()))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return {
    runs: runs.length,
    recentWpm: mean(recent.map((run) => run.wpm)),
    bestWpm: runs.reduce((best, run) => Math.max(best, run.wpm), 0),
    recentAccuracy: mean(recent.map((run) => run.accuracy)),
    chars: runs.reduce((total, run) => total + run.chars, 0),
    ms: runs.reduce((total, run) => total + run.ms, 0),
    streak
  }
}

export interface Trouble {
  char: string
  count: number
}

/** The characters missed most often, worst first. */
export function troubleKeys (scores: Scores, limit = 8): Trouble[] {
  return Object.entries(scores.misses)
    .map(([char, count]) => ({ char, count }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.char.localeCompare(b.char))
    .slice(0, limit)
}

/** Everything the tutor knows about you, as a file you can keep. */
export function exportScores (scores: Scores): string {
  return JSON.stringify(scores, null, 2)
}
