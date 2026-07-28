/**
 * The course, assembled once at module load.
 *
 * Chapters run in a straight line and each one is built on the accumulated
 * character set of the ones before it, so `chapter.taught` is the complete
 * alphabet available at that point in the course. Everything else here is
 * navigation.
 */
import { CHAPTERS as SPECS } from '../data/chapters'
import { buildLessons } from './generate'
import type { Chapter, Lesson, LessonRef } from '../types'

function build (): Chapter[] {
  const out: Chapter[] = []
  // Space is free; nobody needs a lesson on the space bar.
  let taught = ' '

  SPECS.forEach((spec, i) => {
    const number = i + 1
    taught += spec.keys.join('') + (spec.extra ?? '')
    out.push({
      ...spec,
      number,
      taught,
      lessons: buildLessons(spec, number, taught)
    })
  })

  return out
}

export const CHAPTERS: Chapter[] = build()

export const CHAPTER_COUNT = CHAPTERS.length

export const LESSONS: Lesson[] = CHAPTERS.flatMap((chapter) => chapter.lessons)

export const LESSON_COUNT = LESSONS.length

/** Every character the course teaches, in the order it is taught. */
export const ALL_TAUGHT = CHAPTERS[CHAPTERS.length - 1].taught

export function chapterAt (number: number): Chapter | undefined {
  return CHAPTERS[number - 1]
}

export function lessonAt (ref: LessonRef): Lesson | undefined {
  return chapterAt(ref.chapter)?.lessons[ref.lesson - 1]
}

export function isValid (ref: LessonRef): boolean {
  return lessonAt(ref) !== undefined
}

export function refOf (lesson: Lesson): LessonRef {
  return { chapter: lesson.chapter, lesson: lesson.index }
}

/** Position in the single straight line of lessons, 0-based. */
export function ordinalOf (ref: LessonRef): number {
  return LESSONS.findIndex((lesson) => lesson.id === `${ref.chapter}.${ref.lesson}`)
}

export function nextRef (ref: LessonRef): LessonRef | null {
  const at = ordinalOf(ref)
  const next = at < 0 ? undefined : LESSONS[at + 1]
  return next === undefined ? null : refOf(next)
}

export function previousRef (ref: LessonRef): LessonRef | null {
  const at = ordinalOf(ref)
  const previous = at <= 0 ? undefined : LESSONS[at - 1]
  return previous === undefined ? null : refOf(previous)
}

export const FIRST: LessonRef = { chapter: 1, lesson: 1 }

// ------------------------------------------------------------ addressing --

/** The URL fragment for a lesson: `#3.2`. */
export function hashOf (ref: LessonRef): string {
  return `#${ref.chapter}.${ref.lesson}`
}

export function parseHash (hash: string): LessonRef {
  const raw = hash.replace(/^#/, '')
  if (raw === '') return FIRST
  const [chapterPart, lessonPart] = raw.split('.')
  const chapter = Number.parseInt(chapterPart ?? '', 10)
  const lesson = lessonPart === undefined ? 1 : Number.parseInt(lessonPart, 10)
  return {
    chapter: Number.isNaN(chapter) ? 1 : chapter,
    lesson: Number.isNaN(lesson) ? 1 : lesson
  }
}

export function idOf (ref: LessonRef): string {
  return `${ref.chapter}.${ref.lesson}`
}

// ------------------------------------------------------------- standards --

/**
 * What counts as learned. Accuracy is the gate throughout; the speed target
 * rises gently across the course so that passing chapter one does not require
 * the hands of someone who has finished chapter ten.
 */
export interface Standard {
  wpm: number
  accuracy: number
}

export function standardFor (chapter: number): Standard {
  return {
    wpm: Math.min(15 + (chapter - 1) * 2, 32),
    accuracy: 96
  }
}

export function meetsStandard (chapter: number, wpm: number, accuracy: number): boolean {
  const standard = standardFor(chapter)
  return accuracy >= standard.accuracy && wpm >= standard.wpm
}
