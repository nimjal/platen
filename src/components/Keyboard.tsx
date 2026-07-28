import { memo, type CSSProperties, type ReactElement } from 'react'
import { fingerFor, fingerVar, type KeyStroke } from '../lib/layout'

interface Cap {
  /** The key's identity, matching the finger map. */
  id: string
  /** What is printed on the cap. */
  label: string
  /** The shifted legend, printed small above the label. */
  upper?: string
  /** Width in quarter units; a row always totals 60. */
  span: number
  /** Keys the learner never has to press are drawn as scenery. */
  scenery?: boolean
}

const u = (n: number): number => n * 4

const ROWS: Cap[][] = [
  [
    { id: '`', label: '`', upper: '~', span: u(1) },
    { id: '1', label: '1', upper: '!', span: u(1) },
    { id: '2', label: '2', upper: '@', span: u(1) },
    { id: '3', label: '3', upper: '#', span: u(1) },
    { id: '4', label: '4', upper: '$', span: u(1) },
    { id: '5', label: '5', upper: '%', span: u(1) },
    { id: '6', label: '6', upper: '^', span: u(1) },
    { id: '7', label: '7', upper: '&', span: u(1) },
    { id: '8', label: '8', upper: '*', span: u(1) },
    { id: '9', label: '9', upper: '(', span: u(1) },
    { id: '0', label: '0', upper: ')', span: u(1) },
    { id: '-', label: '-', upper: '_', span: u(1) },
    { id: '=', label: '=', upper: '+', span: u(1) },
    { id: 'backspace', label: '⌫', span: u(2), scenery: true }
  ],
  [
    { id: 'tab', label: 'tab', span: u(1.5), scenery: true },
    { id: 'q', label: 'q', span: u(1) },
    { id: 'w', label: 'w', span: u(1) },
    { id: 'e', label: 'e', span: u(1) },
    { id: 'r', label: 'r', span: u(1) },
    { id: 't', label: 't', span: u(1) },
    { id: 'y', label: 'y', span: u(1) },
    { id: 'u', label: 'u', span: u(1) },
    { id: 'i', label: 'i', span: u(1) },
    { id: 'o', label: 'o', span: u(1) },
    { id: 'p', label: 'p', span: u(1) },
    { id: '[', label: '[', upper: '{', span: u(1) },
    { id: ']', label: ']', upper: '}', span: u(1) },
    { id: '\\', label: '\\', upper: '|', span: u(1.5) }
  ],
  [
    { id: 'caps', label: 'caps', span: u(1.75), scenery: true },
    { id: 'a', label: 'a', span: u(1), },
    { id: 's', label: 's', span: u(1) },
    { id: 'd', label: 'd', span: u(1) },
    { id: 'f', label: 'f', span: u(1) },
    { id: 'g', label: 'g', span: u(1) },
    { id: 'h', label: 'h', span: u(1) },
    { id: 'j', label: 'j', span: u(1) },
    { id: 'k', label: 'k', span: u(1) },
    { id: 'l', label: 'l', span: u(1) },
    { id: ';', label: ';', upper: ':', span: u(1) },
    { id: "'", label: "'", upper: '"', span: u(1) },
    { id: 'enter', label: '⏎', span: u(2.25), scenery: true }
  ],
  [
    { id: 'lshift', label: 'shift', span: u(2.25) },
    { id: 'z', label: 'z', span: u(1) },
    { id: 'x', label: 'x', span: u(1) },
    { id: 'c', label: 'c', span: u(1) },
    { id: 'v', label: 'v', span: u(1) },
    { id: 'b', label: 'b', span: u(1) },
    { id: 'n', label: 'n', span: u(1) },
    { id: 'm', label: 'm', span: u(1) },
    { id: ',', label: ',', upper: '<', span: u(1) },
    { id: '.', label: '.', upper: '>', span: u(1) },
    { id: '/', label: '/', upper: '?', span: u(1) },
    { id: 'rshift', label: 'shift', span: u(2.75) }
  ],
  [
    { id: 'lctrl', label: 'ctrl', span: u(1.25), scenery: true },
    { id: 'lalt', label: 'alt', span: u(1.25), scenery: true },
    { id: 'space', label: '', span: u(10), scenery: false },
    { id: 'ralt', label: 'alt', span: u(1.25), scenery: true },
    { id: 'rctrl', label: 'ctrl', span: u(1.25), scenery: true }
  ]
]

/** Keys sitting under a resting finger, drawn with a home-row notch. */
const HOME_KEYS = new Set(['a', 's', 'd', 'f', 'j', 'k', 'l', ';'])

function capFinger (cap: Cap): ReturnType<typeof fingerFor> {
  if (cap.id === 'lshift') return { hand: 'left', role: 'pinky' }
  if (cap.id === 'rshift') return { hand: 'right', role: 'pinky' }
  if (cap.scenery) return null
  return fingerFor(cap.id)
}

interface KeyboardProps {
  /** The keystroke the learner should make next, if any. */
  next: KeyStroke | null
  /** Highlighted red while the input does not match the lesson. */
  mistake: boolean
}

function KeyboardView ({ next, mistake }: KeyboardProps): ReactElement {
  const shiftSide = next?.shiftFinger?.hand
  return (
    <div className={`keyboard${mistake ? ' is-mistake' : ''}`} aria-hidden="true">
      {ROWS.map((row, i) => (
        <div className="keyboard-row" key={i}>
          {row.map((cap) => {
            const finger = capFinger(cap)
            const isNext =
              next !== null &&
              (cap.id === next.key ||
                (cap.id === 'lshift' && shiftSide === 'left') ||
                (cap.id === 'rshift' && shiftSide === 'right'))
            const className = [
              'key',
              cap.scenery ? 'key-scenery' : '',
              HOME_KEYS.has(cap.id) ? 'key-home' : '',
              isNext ? 'key-next' : ''
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <div
                key={cap.id}
                className={className}
                style={
                  {
                    gridColumn: `span ${cap.span}`,
                    '--key-hue': fingerVar(finger)
                  } as CSSProperties
                }
              >
                {cap.upper !== undefined && <span className="key-upper">{cap.upper}</span>}
                <span className="key-label">{cap.label}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export const Keyboard = memo(KeyboardView)
