'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'dark' | 'blue' | 'light'

interface ThemeCtx { theme: Theme; setTheme: (t: Theme) => void }
const Ctx = createContext<ThemeCtx>({ theme: 'dark', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    const saved = (localStorage.getItem('emf-theme') as Theme) ?? 'dark'
    setThemeState(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  function setTheme(next: Theme) {
    setThemeState(next)
    localStorage.setItem('emf-theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
