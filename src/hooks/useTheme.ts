import { useCallback, useEffect, useState } from 'react'
import { KEYS, readString, writeString } from '../lib/storage'

export type Theme = 'system' | 'light' | 'dark'

const ORDER: Theme[] = ['system', 'light', 'dark']

function read (): Theme {
  const stored = readString(KEYS.theme)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

/**
 * Themes ride on the CSS `color-scheme` property, which lets the stylesheet
 * express both palettes with `light-dark()` and no class juggling.
 */
export function useTheme (): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(read)

  useEffect(() => {
    document.documentElement.style.colorScheme = theme === 'system' ? 'light dark' : theme
    if (theme === 'system') {
      writeString(KEYS.theme, 'system')
    } else {
      writeString(KEYS.theme, theme)
    }
  }, [theme])

  const cycle = useCallback(() => {
    setTheme((current) => ORDER[(ORDER.indexOf(current) + 1) % ORDER.length])
  }, [])

  return [theme, cycle]
}
