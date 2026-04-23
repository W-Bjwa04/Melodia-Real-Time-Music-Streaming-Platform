import { createContext, useContext, useEffect, useMemo } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { THEMES } from '@/styles/themes'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const { user } = useAuth()

  const role = user?.role || 'listener'
  const theme = useMemo(() => THEMES[role] || THEMES.listener, [role])

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('theme-transitioning')
    root.classList.remove('theme-artist', 'theme-listener')
    root.classList.add(`theme-${theme.name}`)

    Object.entries(theme.cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    document.body.style.backgroundColor = `hsl(${theme.cssVars['--background']})`

    const timeout = window.setTimeout(() => {
      root.classList.remove('theme-transitioning')
    }, 600)

    return () => {
      window.clearTimeout(timeout)
      root.classList.remove('theme-transitioning')
    }
  }, [theme])

  const value = useMemo(
    () => ({ theme, role, isArtist: role === 'artist' }),
    [role, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }
  return context
}
