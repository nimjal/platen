import { useCallback, useSyncExternalStore } from 'react'
import { hashOf, parseHash } from '../lib/curriculum'
import type { LessonRef } from '../types'

function subscribe (onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function getHash (): string {
  return window.location.hash
}

/**
 * Lesson selection lives in the URL fragment (`#4.2`), so a lesson can be
 * bookmarked, shared, and reached with the back button.
 */
export function useHashRoute (): [LessonRef, (ref: LessonRef, replace?: boolean) => void] {
  const hash = useSyncExternalStore(subscribe, getHash, () => '')
  const ref = parseHash(hash)

  const navigate = useCallback((next: LessonRef, replace = false) => {
    const target = hashOf(next)
    if (window.location.hash === target) return
    if (replace) {
      window.history.replaceState(null, '', target)
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    } else {
      window.location.hash = target
    }
  }, [])

  return [ref, navigate]
}
