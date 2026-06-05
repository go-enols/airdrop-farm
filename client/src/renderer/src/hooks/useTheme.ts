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
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme())
  const prefRef = useRef<ThemePref>(pref)

  // 保持 ref 与 state 同步，确保 onChange 始终读最新值
  useEffect(() => {
    prefRef.current = pref
  }, [pref])

  useEffect(() => {
    applyTheme(pref)
  }, [pref])

  // 监听系统主题变化（用 ref 避免闭包捕获旧 pref 值）
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (): void => {
      setSystemTheme(mql.matches ? 'dark' : 'light')
      if (prefRef.current === 'auto') {
        applyTheme('auto')
      }
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const setPref = useCallback((p: ThemePref) => {
    localStorage.setItem(STORAGE_KEY, p)
    setPrefState(p)
  }, [])

  const theme: ResolvedTheme = pref === 'auto' ? systemTheme : pref

  return { theme, pref, setPref }
}
