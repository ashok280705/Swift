'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <span className="w-9 h-9 inline-block" />

  const isDark = theme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex items-center justify-center w-9 h-9 rounded-xl border transition"
      style={{ borderColor: 'var(--sx-line)', color: 'var(--sx-ink-2)' }}
      title={isDark ? 'Switch to light' : 'Switch to dark'}>
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
