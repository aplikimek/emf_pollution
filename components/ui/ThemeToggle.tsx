'use client'
import { useTheme } from './ThemeProvider'
import type { Theme } from './ThemeProvider'

const THEMES: { id: Theme; icon: string; title: string }[] = [
  { id: 'dark',  icon: '🌑', title: 'Tema e errët' },
  { id: 'blue',  icon: '🌊', title: 'Tema blu' },
  { id: 'light', icon: '☀',  title: 'Tema e ndritshme' },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div style={{ display:'flex', gap:3 }}>
      {THEMES.map(t => (
        <button
          key={t.id}
          className={`theme-btn${theme === t.id ? ' theme-btn--active' : ''}`}
          onClick={() => setTheme(t.id)}
          title={t.title}
        >
          {t.icon}
        </button>
      ))}
    </div>
  )
}
