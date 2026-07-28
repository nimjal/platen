import type { ReactElement } from 'react'
import { chapterAt, hashOf, ordinalOf } from '../lib/curriculum'
import { frontier, hasPassed, type Scores } from '../lib/scores'
import type { LessonRef } from '../types'

interface LessonTabsProps {
  current: LessonRef
  scores: Scores
}

/** The lessons inside a chapter, in the order they are meant to be taken. */
export function LessonTabs ({ current, scores }: LessonTabsProps): ReactElement | null {
  const chapter = chapterAt(current.chapter)
  if (chapter === undefined) return null
  const reach = frontier(scores)

  return (
    <nav className="tabs" aria-label={`${chapter.title} lessons`}>
      {chapter.lessons.map((lesson) => {
        const ref: LessonRef = { chapter: chapter.number, lesson: lesson.index }
        const passed = hasPassed(scores, ref)
        const isCurrent = lesson.index === current.lesson
        const open = ordinalOf(ref) <= reach

        const className = [
          'tab',
          isCurrent ? 'is-current' : '',
          passed ? 'is-passed' : '',
          open ? '' : 'is-locked'
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <a
            key={lesson.id}
            className={className}
            href={hashOf(ref)}
            aria-current={isCurrent ? 'page' : undefined}
          >
            {lesson.title}
          </a>
        )
      })}
    </nav>
  )
}
