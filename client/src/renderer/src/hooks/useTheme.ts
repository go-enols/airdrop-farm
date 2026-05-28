import { useCallback, useEffect, useRef, useState } from 'react'

export type ThemePref = 'auto' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readPref(): ThemePref {
  if (typeof localStorage === 'undefined') return 'auto'
  const v = localStorage.getItem(STORAGE_KEY)
  if (v === 'light' || v === 'dark' || v === 'auto') return v
  return 'auto'
}

function resolveTheme(pref: ThemePref): ResolvedTheme {
  return pref === 'auto' ? getSystemTheme() : pref
}

export function applyTheme(pref: ThemePref): ResolvedTheme {
  const resolved = resolveTheme(pref)
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(resolved)

  let meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'color-scheme'
    document.head.appendChild(meta)
  }
  meta.content = resolved
  return resolved
}

export function initTheme(): ResolvedTheme {
  return applyTheme(readPref())
}

export function useTheme(): {
  theme: ResolvedTheme
  pref: ThemePref
  setPref: (p: ThemePref) => void
} {
  const [pref, setPrefState] = useState<ThemePref>(() => readPref())
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme(readPref()))

  const isFirstMount = useRef(true)

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      if ((window as unknown as Record<string, unknown>).__themeResolved) {
        const hasDark = document.documentElement.classList.contains('dark')
        setTheme(hasDark ? 'dark' : 'light')
        return
      }
    }
    const resolved = applyTheme(pref)
    setTheme(resolved)
  }, [pref])

  useEffect(() => {
    if (pref !== 'auto') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (): void => {
      const resolved = applyTheme('auto')
      setTheme(resolved)
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [pref])

  const setPref = useCallback((p: ThemePref) => {
    localStorage.setItem(STORAGE_KEY, p)
    setPrefState(p)
  }, [])

  return { theme, pref, setPref }
}
