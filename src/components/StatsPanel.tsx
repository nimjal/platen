import { useMemo, useState, type CSSProperties, type ReactElement } from 'react'
import { formatSpan } from '../lib/engine'
import { fingerVar, strokeFor } from '../lib/layout'
import { overallTally, summarise, troubleKeys, type Scores } from '../lib/scores'

interface StatsPanelProps {
  scores: Scores
  onDrill: (chars: string[]) => void
  onReset: () => void
  onExport: () => void
}

/** Recent speed, drawn small. No axes: the shape is the point. */
function Sparkline ({ values }: { values: number[] }): ReactElement | null {
  if (values.length < 2) return null

  const top = Math.max(...values, 1)
  const points = values
    .map((value, i) => {
      const x = (i / (values.length - 1)) * 100
      const y = 24 - (value / top) * 22
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <svg className="spark" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} />
    </svg>
  )
}

/**
 * Everything the tutor has measured about you, and the two buttons that let
 * you take it away with you or delete it. It is all in this browser.
 */
export function StatsPanel ({ scores, onDrill, onReset, onExport }: StatsPanelProps): ReactElement {
  const [armed, setArmed] = useState(false)
  const summary = useMemo(() => summarise(scores), [scores])
  const tally = useMemo(() => overallTally(scores), [scores])
  const trouble = useMemo(() => troubleKeys(scores), [scores])
  const recent = useMemo(() => scores.runs.slice(-40).map((run) => run.wpm), [scores.runs])

  return (
    <div className="stats">
      <dl className="stat-grid">
        <div>
          <dt>Lessons passed</dt>
          <dd>
            {tally.passed}
            <small>/ {tally.total}</small>
          </dd>
        </div>
        <div>
          <dt>Speed now</dt>
          <dd>
            {summary.recentWpm}
            <small>wpm</small>
          </dd>
        </div>
        <div>
          <dt>Best</dt>
          <dd>
            {summary.bestWpm}
            <small>wpm</small>
          </dd>
        </div>
        <div>
          <dt>Accuracy</dt>
          <dd>
            {summary.recentAccuracy}
            <small>%</small>
          </dd>
        </div>
        <div>
          <dt>Practised</dt>
          <dd>{formatSpan(summary.ms)}</dd>
        </div>
        <div>
          <dt>Streak</dt>
          <dd>
            {summary.streak}
            <small>{summary.streak === 1 ? 'day' : 'days'}</small>
          </dd>
        </div>
      </dl>

      {recent.length > 1 && (
        <div className="stat-block">
          <p className="eyebrow">Speed, last {recent.length} runs</p>
          <Sparkline values={recent} />
        </div>
      )}

      <div className="stat-block">
        <p className="eyebrow">Trouble keys</p>
        {trouble.length === 0 ? (
          <p className="stat-note">
            Nothing yet. Once you start missing keys, the worst of them collect here.
          </p>
        ) : (
          <>
            <ul className="trouble">
              {trouble.map((entry) => (
                <li
                  key={entry.char}
                  style={
                    { '--key-hue': fingerVar(strokeFor(entry.char)?.finger ?? null) } as CSSProperties
                  }
                >
                  <span className="trouble-key">{entry.char === ' ' ? '␣' : entry.char}</span>
                  <span className="trouble-count">{entry.count}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn"
              onClick={() => onDrill(trouble.map((entry) => entry.char))}
            >
              Drill these
            </button>
          </>
        )}
      </div>

      <div className="stat-block">
        <p className="eyebrow">Your data</p>
        <p className="stat-note">
          {summary.runs} {summary.runs === 1 ? 'run' : 'runs'} recorded in this browser only.
          Nothing is uploaded.
        </p>
        <div className="actions">
          <button type="button" className="btn" onClick={onExport}>
            Export
          </button>
          <button
            type="button"
            className={`btn${armed ? ' btn-danger' : ''}`}
            onClick={() => {
              if (!armed) {
                setArmed(true)
                return
              }
              setArmed(false)
              onReset()
            }}
            onBlur={() => setArmed(false)}
          >
            {armed ? 'Really erase?' : 'Erase progress'}
          </button>
        </div>
      </div>
    </div>
  )
}
