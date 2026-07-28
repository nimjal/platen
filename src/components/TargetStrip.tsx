import type { CSSProperties, ReactElement } from 'react'
import { fingerVar, type KeyStroke } from '../lib/layout'

interface TargetStripProps {
  text: string
  /** Index of the character to type next. */
  cursor: number
  mistake: boolean
  done: boolean
  next: KeyStroke | null
}

/**
 * The tape. Text rides a carriage that slides under a head bolted to the
 * chassis, so the eye stays in one place — the whole point of touch typing.
 * The carriage is perforated at one hole per character, which puts your
 * keystroke rate on screen without adding a readout for it.
 */
export function TargetStrip ({
  text,
  cursor,
  mistake,
  done,
  next
}: TargetStripProps): ReactElement {
  const typed = text.slice(0, cursor)
  const current = text.slice(cursor, cursor + 1)
  const upcoming = text.slice(cursor + 1)
  const percent = text.length === 0 ? 0 : Math.round((cursor / text.length) * 100)

  const className = ['strip', mistake ? 'is-mistake' : '', done ? 'is-done' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={className}
      style={{ '--key-hue': fingerVar(next?.finger ?? null) } as CSSProperties}
    >
      <span className="strip-head" aria-hidden="true" />

      <div className="strip-track" style={{ '--cursor': cursor } as CSSProperties}>
        <span className="strip-perf" aria-hidden="true" />
        <span className="strip-typed">{typed}</span>
        <span className="strip-cursor">{current === '' ? ' ' : current}</span>
        <span className="strip-upcoming">{upcoming}</span>
      </div>

      <span
        className="strip-progress"
        style={{ '--p': `${percent}%` } as CSSProperties}
        aria-hidden="true"
      />
      <span className="strip-count" aria-hidden="true">
        {cursor}/{text.length}
      </span>
    </div>
  )
}
