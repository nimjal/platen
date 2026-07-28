import { useEffect, useRef, type CSSProperties, type ReactElement } from 'react'
import { CHAPTERS, hashOf, ordinalOf } from '../lib/curriculum'
import { roleVar, rolesFor, type FingerRole } from '../lib/layout'
import { chapterTally, frontier, type Scores } from '../lib/scores'

interface ChapterPathProps {
  current: number
  scores: Scores
}

/** The chapters that add no new keys still exercise the whole hand. */
const ALL_ROLES: FingerRole[] = ['index', 'middle', 'ring', 'pinky', 'thumb']

/**
 * The course drawn as the tab-stop ruler above a platen: one stop per chapter,
 * in order, labelled with the keys it teaches. The scale under a stop is
 * struck in the hues of the fingers those keys belong to and fills as the
 * chapter's lessons are passed, so the ruler reads as a map of the hands
 * filling in from left to right.
 *
 * Chapters beyond the frontier are dimmed rather than hidden — the road ahead
 * should be visible even though you cannot skip to the end of it.
 */
export function ChapterPath ({ current, scores }: ChapterPathProps): ReactElement {
  const currentRef = useRef<HTMLAnchorElement>(null)
  const reach = frontier(scores)

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [current])

  return (
    <nav className="ruler" aria-label="Chapters">
      <ol className="ruler-list">
        {CHAPTERS.map((chapter) => {
          const found = rolesFor(chapter.keys)
          const roles = found.length > 0 ? found : ALL_ROLES
          const { passed, total } = chapterTally(scores, chapter.number, chapter.lessons.length)
          const open = ordinalOf({ chapter: chapter.number, lesson: 1 }) <= reach
          const keys = chapter.keys.length > 0 ? chapter.keys.join(' ') : chapter.title.toLowerCase()

          const scale = roles.map((role) => (
            <i key={role} style={{ '--key-hue': roleVar(role) } as CSSProperties} />
          ))

          const className = [
            'stop',
            chapter.number === current ? 'is-current' : '',
            open ? '' : 'is-locked',
            passed === total ? 'is-done' : ''
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <li key={chapter.number}>
              <a
                ref={chapter.number === current ? currentRef : undefined}
                className={className}
                href={hashOf({ chapter: chapter.number, lesson: 1 })}
                aria-current={chapter.number === current ? 'page' : undefined}
                title={
                  open
                    ? `${chapter.title} — ${passed} of ${total} passed`
                    : `${chapter.title} — locked until the chapters before it are passed`
                }
              >
                <span className="stop-no">{String(chapter.number).padStart(2, '0')}</span>
                <span className="stop-title">{chapter.title}</span>
                <span className="stop-keys">{keys}</span>
                <span className="stop-scale" aria-hidden="true">
                  <span className="scale-row scale-ghost">{scale}</span>
                  <span
                    className="scale-row scale-fill"
                    style={{ '--fill': `${(passed / total) * 100}%` } as CSSProperties}
                  >
                    {scale}
                  </span>
                </span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
