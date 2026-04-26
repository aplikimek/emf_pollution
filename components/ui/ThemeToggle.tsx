'use client'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button className="theme-toggle" onClick={toggle} title={theme === 'dark' ? 'Tema e ndritshme' : 'Tema e errët'}>
      {theme === 'dark' ? '☀' : '🌙'}
    </button>
  )
}
