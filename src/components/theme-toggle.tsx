'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from './theme-provider'
import { useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const themes = [
    { value: 'light', label: 'Açık', icon: Sun },
    { value: 'dark', label: 'Koyu', icon: Moon },
    { value: 'system', label: 'Sistem', icon: Monitor },
  ] as const

  const currentTheme = themes.find((t) => t.value === theme) || themes[0]
  const Icon = currentTheme.icon

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-surface-1 hover:bg-surface-2 transition-colors"
        aria-label="Tema değiştir"
        title="Tema"
      >
        <Icon className="w-5 h-5 text-foreground" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-40 bg-surface-1 border border-surface-3 rounded-lg shadow-lg z-50 overflow-hidden">
            {themes.map(({ value, label, icon: ThemeIcon }) => (
              <button
                key={value}
                onClick={() => {
                  setTheme(value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  theme === value
                    ? 'bg-primary-500/10 text-primary-600'
                    : 'text-foreground hover:bg-surface-2'
                }`}
              >
                <ThemeIcon className="w-4 h-4" />
                <span>{label}</span>
                {theme === value && (
                  <span className="ml-auto text-primary-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Simple toggle button (light/dark only)
export function ThemeToggleSimple() {
  const { resolvedTheme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-surface-1 hover:bg-surface-2 transition-colors"
      aria-label={resolvedTheme === 'light' ? 'Koyu temaya geç' : 'Açık temaya geç'}
      title={resolvedTheme === 'light' ? 'Koyu tema' : 'Açık tema'}
    >
      {resolvedTheme === 'light' ? (
        <Moon className="w-5 h-5 text-foreground" />
      ) : (
        <Sun className="w-5 h-5 text-foreground" />
      )}
    </button>
  )
}
