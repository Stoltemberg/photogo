'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'photogo-theme'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(resolved: 'light' | 'dark') {
  const html = document.documentElement
  if (resolved === 'dark') {
    html.classList.add('dark')
    html.style.colorScheme = 'dark'
  } else {
    html.classList.remove('dark')
    html.style.colorScheme = 'light'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Mount: read storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const initial = (stored === 'light' || stored === 'dark' || stored === 'system')
        ? stored as Theme
        : 'system'
      setThemeState(initial)

      const systemTheme = getSystemTheme()
      const resolved = initial === 'system' ? systemTheme : initial
      setResolvedTheme(resolved)
      applyTheme(resolved)
    } catch {
      // ignore
    }
  }, [])

  // Listen for system theme changes (when set to "system")
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const sys = getSystemTheme()
      setResolvedTheme(sys)
      applyTheme(sys)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  function setTheme(next: Theme) {
    setThemeState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch {}

    const resolved = next === 'system' ? getSystemTheme() : next
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }

  function toggleTheme() {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
