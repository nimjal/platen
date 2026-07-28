/**
 * @vitest-environment happy-dom
 *
 * A smoke test for the shell. It does not try to be a UI test suite; it checks
 * that the app mounts, that typing drives the engine through to a finished
 * lesson, that the score is banked in local storage, and that focus mode is
 * reachable and shows the lesson text.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { CHAPTERS } from './lib/curriculum'
import { loadScores } from './lib/scores'

let container: HTMLDivElement
let root: Root

// React reads this to decide whether it is running inside a test.
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

function render (): void {
  act(() => {
    root.render(<App />)
  })
}

/** Types `text` into the practice input the way a person would. */
function typeInto (input: HTMLTextAreaElement, text: string): void {
  for (let i = 1; i <= text.length; i++) {
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        'value'
      )?.set
      setter?.call(input, text.slice(0, i))
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }
}

beforeEach(() => {
  window.localStorage.clear()
  window.location.hash = ''
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('the app', () => {
  it('mounts on the first lesson of the first chapter', () => {
    render()
    expect(container.textContent).toContain('Home Row')
    expect(container.querySelector('#input')).not.toBeNull()
  })

  it('shows the chapter path and the lessons in the chapter', () => {
    render()
    const stops = container.querySelectorAll('.ruler .stop')
    expect(stops).toHaveLength(CHAPTERS.length)
    expect(container.querySelectorAll('.tabs .tab')).toHaveLength(
      CHAPTERS[0].lessons.length
    )
  })

  it('locks everything past the first lesson until it is passed', () => {
    render()
    const open = container.querySelectorAll('.tabs .tab:not(.is-locked)')
    expect(open).toHaveLength(1)
  })

  it('runs a lesson to the end and banks the result', () => {
    render()
    const input = container.querySelector('#input') as HTMLTextAreaElement
    const text = CHAPTERS[0].lessons[0].text

    typeInto(input, text)

    expect(container.textContent).toMatch(/Passed|not yet to standard/)

    const scores = loadScores()
    expect(scores.lessons['1.1']).toBeDefined()
    expect(scores.lessons['1.1'].attempts).toBe(1)
    expect(scores.runs).toHaveLength(1)
  })

  it('records the character that was missed', () => {
    render()
    const input = container.querySelector('#input') as HTMLTextAreaElement
    const text = CHAPTERS[0].lessons[0].text

    // One deliberate slip, then the rest of the lesson typed correctly.
    typeInto(input, text.slice(0, 3) + 'q')
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        'value'
      )?.set
      setter?.call(input, text.slice(0, 3))
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    typeInto(input, text)

    expect(loadScores().misses[text.charAt(3)]).toBe(1)
  })

  it('follows the URL fragment once a lesson has been unlocked', () => {
    render()
    const input = container.querySelector('#input') as HTMLTextAreaElement
    typeInto(input, CHAPTERS[0].lessons[0].text)

    act(() => {
      window.location.hash = '#1.2'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })

    expect(container.textContent).toContain(CHAPTERS[0].lessons[1].title)
    expect(container.querySelector('.pane.is-gate')).toBeNull()
  })

  it('puts a gate in front of a lesson that has not been reached', () => {
    act(() => {
      window.location.hash = '#5.3'
    })
    render()
    expect(container.querySelector('.pane.is-gate')).not.toBeNull()
    expect(container.textContent).toContain('still locked')
  })

  it('opens the gate by hand when asked', () => {
    act(() => {
      window.location.hash = '#5.3'
    })
    render()
    const unlock = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Unlock it anyway'
    )
    act(() => unlock?.click())
    expect(container.querySelector('.pane.is-gate')).toBeNull()
    expect(container.querySelector('#input')).not.toBeNull()
  })

  it('enters focus mode and shows the lesson as enlarged text', () => {
    render()
    const focus = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Focus'
    )
    act(() => focus?.click())

    const stage = container.querySelector('.focus')
    expect(stage).not.toBeNull()
    // No practice box in focus mode, and the text is on the page character
    // by character so it can be lit up as it is typed.
    expect(container.querySelector('#input')).toBeNull()
    expect(container.querySelector('.focus-text')?.textContent).toBe(
      CHAPTERS[0].lessons[0].text
    )
    expect(container.querySelectorAll('.glyph')).toHaveLength(
      CHAPTERS[0].lessons[0].text.length
    )
  })

  it('lights up the characters as they are typed in focus mode', () => {
    render()
    const focus = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Focus'
    )
    act(() => focus?.click())

    const input = container.querySelector('#focus-input') as HTMLTextAreaElement
    typeInto(input, CHAPTERS[0].lessons[0].text.slice(0, 4))

    expect(container.querySelectorAll('.glyph.is-done')).toHaveLength(4)
    expect(container.querySelectorAll('.glyph.is-cursor')).toHaveLength(1)
  })
})
