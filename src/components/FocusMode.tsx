import { useEffect, useRef, type CSSProperties, type ReactElement } from 'react'
import { formatDuration } from '../lib/engine'
import { fingerVar, type KeyStroke } from '../lib/layout'
import type { Chapter, Lesson } from '../types'
import type { Standard } from '../lib/curriculum'
import type { UseTypingSession } from '../hooks/useTypingSession'

interface FocusModeProps {
  chapter: Chapter
  lesson: Lesson
  typing: UseTypingSession
  standard: Standard
  passed: boolean
  stroke: KeyStroke | null
  hasNext: boolean
  onNext: () => void
  onExit: () => void
}

/** How long a passed lesson rests on screen before the next one starts. */
const ADVANCE_MS = 1600

/**
 * Focus mode: the text, enlarged, and nothing else. No input box, no keyboard,
 * no metrics competing for the eye — the words light up as you type them and
 * the course walks itself, lesson after lesson, chapter after chapter.
 *
 * There is still a text area; it is simply invisible. Keeping a real form
 * control under the surface is what makes phone keyboards, dead keys and
 * input methods work, and it costs nothing to hide it.
 */
export function FocusMode ({
  chapter,
  lesson,
  typing,
  standard,
  passed,
  stroke,
  hasNext,
  onNext,
  onExit
}: FocusModeProps): ReactElement {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  const { value, goodChars, finished, mistake, wpm, accuracy, elapsed, session } = typing

  // Keep the hidden input focused: every keystroke has to land somewhere.
  useEffect(() => {
    const hold = (): void => inputRef.current?.focus()
    hold()
    const id = window.setInterval(hold, 400)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [lesson.id])

  // Escape always leaves, even once the input has been disabled at the end of
  // a lesson and can no longer report a key press of its own.
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit])

  // Follow the cursor down the page as the lines are consumed.
  useEffect(() => {
    cursorRef.current?.scrollIntoView({ block: 'nearest' })
  }, [goodChars])

  // A passed lesson rolls straight into the next one. That is the whole
  // point of the mode; stopping to click a button breaks the trance.
  useEffect(() => {
    if (!finished || !passed || !hasNext) return
    const id = window.setTimeout(onNext, ADVANCE_MS)
    return () => window.clearTimeout(id)
  }, [finished, passed, hasNext, onNext])

  const wrongCount = value.length - goodChars

  const characters = [...lesson.text].map((char, i) => {
    const state =
      i < goodChars ? 'is-done' : i < goodChars + wrongCount ? 'is-wrong' : ''
    const isCursor = i === goodChars
    return (
      <span
        key={i}
        ref={isCursor ? cursorRef : undefined}
        className={`glyph ${state}${isCursor ? ' is-cursor' : ''}`}
      >
        {char}
      </span>
    )
  })

  return (
    <div
      className={`focus${mistake ? ' is-mistake' : ''}${finished ? (passed ? ' is-passed' : ' is-short') : ''}`}
      style={{ '--key-hue': fingerVar(stroke?.finger ?? null) } as CSSProperties}
      onClick={() => inputRef.current?.focus()}
    >
      <header className="focus-head">
        <span className="focus-where">
          <span className="stamp">{lesson.id}</span>
          {chapter.title} · {lesson.title}
        </span>
        <span className="focus-live" aria-hidden="true">
          <b>{wpm}</b> wpm · <b>{Math.round(accuracy)}</b>% · {formatDuration(elapsed)}
        </span>
        <button type="button" className="btn btn-quiet" onClick={onExit}>
          Exit <kbd className="kbd">Esc</kbd>
        </button>
      </header>

      <div className="focus-text" lang="en">
        {characters}
      </div>

      <label className="sr-only" htmlFor="focus-input">
        Type the lesson text
      </label>
      <textarea
        id="focus-input"
        ref={inputRef}
        className="focus-input"
        value={value}
        disabled={finished}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        onChange={(e) => typing.setValue(e.target.value)}
        onPaste={(e) => e.preventDefault()}
      />

      <footer className="focus-foot">
        {finished ? (
          <p className="focus-result" role="status">
            <strong>{passed ? 'Passed' : 'Not yet'}</strong>
            <span>
              {wpm} wpm at {Math.round(accuracy)}% · {session.errors}{' '}
              {session.errors === 1 ? 'slip' : 'slips'}
            </span>
            <span className="focus-target">
              needs {standard.wpm} wpm at {standard.accuracy}%
            </span>
            {passed && hasNext ? (
              <button type="button" className="btn btn-primary" onClick={onNext}>
                Next lesson
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={typing.restart}>
                Again
              </button>
            )}
          </p>
        ) : (
          <p className="focus-hint">
            {standard.wpm} wpm at {standard.accuracy}% to pass · type{' '}
            <code>fix</code> to clear a bad run
          </p>
        )}
      </footer>
    </div>
  )
}
