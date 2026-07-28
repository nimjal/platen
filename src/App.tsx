import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { ChapterPath } from './components/ChapterPath'
import { FocusMode } from './components/FocusMode'
import { Keyboard } from './components/Keyboard'
import { LessonTabs } from './components/LessonTabs'
import { StatsPanel } from './components/StatsPanel'
import { TargetStrip } from './components/TargetStrip'
import { useHashRoute } from './hooks/useHashRoute'
import { useTheme } from './hooks/useTheme'
import { useTypingSession } from './hooks/useTypingSession'
import {
  CHAPTERS,
  FIRST,
  chapterAt,
  hashOf,
  idOf,
  isValid,
  lessonAt,
  meetsStandard,
  nextRef,
  previousRef,
  standardFor
} from './lib/curriculum'
import { formatDuration } from './lib/engine'
import { troubleLesson } from './lib/generate'
import { strokeFor } from './lib/layout'
import {
  clearScores,
  exportScores,
  isUnlocked,
  loadScores,
  overallTally,
  recordRun,
  resumeRef,
  saveScores,
  scoreFor,
  unlock,
  type Scores
} from './lib/scores'
import { KEYS, readFlag, writeFlag, writeString } from './lib/storage'
import type { Lesson, LessonRef } from './types'

const THEME_LABEL = { system: 'Match system', light: 'Light', dark: 'Dark' } as const
// A three-position switch, not weather icons: half, open, closed.
const THEME_ICON = { system: '◐', light: '○', dark: '●' } as const

export function App (): ReactElement {
  const [route, navigate] = useHashRoute()
  const [theme, cycleTheme] = useTheme()
  const [scores, setScores] = useState<Scores>(loadScores)
  const [focus, setFocus] = useState(() => readFlag(KEYS.focus, false))
  const [showGuide, setShowGuide] = useState(() => readFlag(KEYS.guide, true))
  const [showKeyboard, setShowKeyboard] = useState(() => readFlag(KEYS.keyboard, true))
  const [showStats, setShowStats] = useState(false)
  const [trouble, setTrouble] = useState<Lesson | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const restored = useRef(false)

  // Arriving with no lesson in the URL drops you where you left off, which is
  // the furthest lesson you have unlocked rather than the last one you opened.
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    if (window.location.hash !== '') return
    navigate(resumeRef(loadScores()), true)
  }, [navigate])

  const valid = isValid(route)
  const ref: LessonRef = valid ? route : FIRST

  useEffect(() => {
    if (!valid) navigate(FIRST, true)
  }, [valid, navigate])

  const chapter = chapterAt(ref.chapter) ?? CHAPTERS[0]
  const courseLesson = lessonAt(ref) ?? chapter.lessons[0]
  const locked = !isUnlocked(scores, ref)

  // The trouble drill sits outside the course, so it never affects the gate.
  const lesson = trouble ?? courseLesson
  const standard = standardFor(chapter.number)

  const typing = useTypingSession(lesson.text)
  const { session, value, goodChars, wpm, accuracy, elapsed, finished, mistake } = typing

  const passed = finished && meetsStandard(chapter.number, wpm, accuracy)

  // Remember where the learner is, for the next visit.
  useEffect(() => {
    writeString(KEYS.lesson, idOf(ref))
  }, [ref.chapter, ref.lesson])

  useEffect(() => {
    if (!focus) inputRef.current?.focus()
  }, [lesson.id, focus])

  // Bank the result once, when a lesson is finished.
  const banked = useRef<string | null>(null)
  useEffect(() => {
    if (!finished) {
      banked.current = null
      return
    }
    const stamp = `${lesson.id}:${session.finishedAt ?? 0}`
    if (banked.current === stamp) return
    banked.current = stamp

    setScores((current) => {
      const next = recordRun(current, lesson.id, {
        chapter: chapter.number,
        wpm,
        accuracy,
        ms: elapsed,
        chars: goodChars,
        errors: session.errors,
        misses: session.missed
      })
      saveScores(next)
      return next
    })
  }, [finished, session.finishedAt, lesson.id, chapter.number, wpm, accuracy, elapsed, goodChars])

  const forward = nextRef(ref)
  const back = previousRef(ref)
  const record = scoreFor(scores, ref)
  const overall = useMemo(() => overallTally(scores), [scores])
  const stroke = finished ? null : strokeFor(lesson.text.charAt(goodChars))

  const goNext = useCallback(() => {
    if (forward !== null) navigate(forward)
  }, [forward, navigate])

  const toggleFocus = useCallback(() => {
    setFocus((current) => !current)
    setTrouble(null)
  }, [])

  useEffect(() => {
    writeFlag(KEYS.focus, focus)
  }, [focus])

  useEffect(() => {
    writeFlag(KEYS.keyboard, showKeyboard)
  }, [showKeyboard])

  useEffect(() => {
    writeFlag(KEYS.guide, showGuide)
  }, [showGuide])

  const startTrouble = useCallback(
    (chars: string[]) => {
      setTrouble(troubleLesson(chars, chapter.taught))
      setShowStats(false)
      setFocus(false)
    },
    [chapter.taught]
  )

  const download = useCallback(() => {
    const blob = new Blob([exportScores(scores)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'typing-progress.json'
    link.click()
    URL.revokeObjectURL(url)
  }, [scores])

  const erase = useCallback(() => {
    clearScores()
    setScores(loadScores())
    navigate(FIRST)
  }, [navigate])

  const openGate = useCallback(() => {
    setScores((current) => {
      const next = unlock(current, ref)
      saveScores(next)
      return next
    })
  }, [ref.chapter, ref.lesson])

  if (focus && !locked && trouble === null) {
    return (
      <FocusMode
        chapter={chapter}
        lesson={courseLesson}
        typing={typing}
        standard={standard}
        passed={passed}
        stroke={stroke}
        hasNext={forward !== null}
        onNext={goNext}
        onExit={toggleFocus}
      />
    )
  }

  const statusText =
    session.status === 'ready'
      ? 'Ready'
      : session.status === 'error'
        ? 'Fix the last keystroke'
        : session.status === 'done'
          ? passed
            ? 'Passed'
            : 'Finished — not yet to standard'
          : 'Typing'

  const paneClass = [
    'pane',
    `is-${session.status}`,
    finished ? (passed ? 'is-passed' : 'is-short') : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href={hashOf(FIRST)}>
          <span className="brand-mark" aria-hidden="true" />
          Typing
        </a>

        <div className="topbar-lesson">
          <span className="stamp">{trouble === null ? lesson.id : '—'}</span>
          <h1>
            {chapter.title}
            <span className="topbar-sub"> · {lesson.title}</span>
          </h1>
        </div>

        <div className="topbar-actions">
          <span className="tally" title="Lessons passed">
            <strong>{overall.passed}</strong>
            <span>/ {overall.total}</span>
          </span>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => setShowStats((current) => !current)}
            aria-pressed={showStats}
          >
            Progress
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => setShowKeyboard((current) => !current)}
            aria-pressed={showKeyboard}
          >
            Keyboard
          </button>
          <button type="button" className="btn btn-quiet" onClick={toggleFocus}>
            Focus
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={cycleTheme}
            title={`Theme: ${THEME_LABEL[theme]}`}
          >
            <span aria-hidden="true">{THEME_ICON[theme]}</span>
            <span className="sr-only">Theme: {THEME_LABEL[theme]}</span>
          </button>
        </div>
      </header>

      <ChapterPath current={chapter.number} scores={scores} />

      <main className="stage">
        {showStats && (
          <section className="panel" aria-label="Progress">
            <StatsPanel
              scores={scores}
              onDrill={startTrouble}
              onReset={erase}
              onExport={download}
            />
          </section>
        )}

        <LessonTabs current={ref} scores={scores} />

        {locked ? (
          <section className="pane is-gate">
            <p className="gate-title">This lesson is still locked.</p>
            <p className="gate-body">
              The course runs in a straight line: each lesson opens when the one before it
              is passed, at {standard.wpm} words a minute and {standard.accuracy}% accuracy.
              It is the only way the drills can assume what your hands already know.
            </p>
            <div className="actions">
              <a className="btn btn-primary" href={hashOf(resumeRef(scores))}>
                Go to lesson {idOf(resumeRef(scores))}
              </a>
              <button type="button" className="btn" onClick={openGate}>
                Unlock it anyway
              </button>
            </div>
          </section>
        ) : (
          <section
            className={paneClass}
            onClick={() => inputRef.current?.focus()}
            aria-label="Practice"
          >
            {trouble !== null && (
              <p className="pane-note">
                Trouble-key drill, built from the keys you miss most.{' '}
                <button type="button" className="link" onClick={() => setTrouble(null)}>
                  Back to the course
                </button>
              </p>
            )}

            <TargetStrip
              text={lesson.text}
              cursor={goodChars}
              mistake={mistake}
              done={finished}
              next={stroke}
            />

            <label className="sr-only" htmlFor="input">
              Type the lesson text
            </label>
            <textarea
              id="input"
              ref={inputRef}
              className="input"
              rows={3}
              value={value}
              disabled={finished}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="Start typing to begin"
              onChange={(e) => typing.setValue(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  typing.restart()
                }
              }}
            />

            <div className="readout">
              <p className="status" role="status">
                <span className="status-dot" aria-hidden="true" />
                {statusText}
                <span className="status-face" aria-hidden="true">
                  {typing.face}
                </span>
              </p>

              <dl className="metrics">
                <div>
                  <dt>Speed</dt>
                  <dd>
                    {wpm}
                    <small>wpm</small>
                  </dd>
                </div>
                <div>
                  <dt>Accuracy</dt>
                  <dd>
                    {Math.round(accuracy)}
                    <small>%</small>
                  </dd>
                </div>
                <div>
                  <dt>Slips</dt>
                  <dd>{session.errors}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{formatDuration(elapsed)}</dd>
                </div>
              </dl>
            </div>

            <div className="actions">
              <button type="button" className="btn" onClick={typing.restart}>
                Restart
              </button>
              {finished && !passed && (
                <button type="button" className="btn btn-primary" onClick={typing.restart}>
                  Try again
                </button>
              )}
              {finished && passed && forward !== null && trouble === null && (
                <a className="btn btn-primary" href={hashOf(forward)}>
                  Next lesson
                </a>
              )}
              {!finished && back !== null && trouble === null && (
                <a className="btn btn-quiet" href={hashOf(back)}>
                  Previous
                </a>
              )}

              {trouble === null && (
                <p className="best">
                  pass at {standard.wpm} wpm · {standard.accuracy}%
                  {record !== undefined && record.bestWpm > 0 && (
                    <> · best {record.bestWpm} wpm at {Math.round(record.bestAccuracy)}%</>
                  )}
                </p>
              )}
            </div>
          </section>
        )}

        {showKeyboard && <Keyboard next={stroke} mistake={mistake} />}

        <section className="guide">
          <button
            type="button"
            className="guide-toggle"
            onClick={() => setShowGuide((current) => !current)}
            aria-expanded={showGuide}
            aria-controls="guide-body"
          >
            <span className="guide-caret" aria-hidden="true">
              ▸
            </span>
            How to type this chapter
          </button>
          <div id="guide-body" className="guide-body" hidden={!showGuide}>
            {chapter.guide.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
            <p className="guide-tip">
              Type <code>fix</code> to delete a bad run of characters, or{' '}
              <code>restart</code> to start over. <kbd className="kbd">Esc</kbd> restarts too.
            </p>
          </div>
        </section>
      </main>

      <footer className="foot">
        {overall.passed} of {overall.total} lessons passed · chapter {chapter.number} of{' '}
        {CHAPTERS.length} · every score is kept in this browser and nowhere else
      </footer>
    </div>
  )
}
