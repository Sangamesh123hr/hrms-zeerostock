'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const isDark =
      savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)

    document.documentElement.classList.toggle('dark', isDark)
    const syncState = window.setTimeout(() => setDarkMode(isDark), 0)

    return () => window.clearTimeout(syncState)
  }, [])

  const toggleTheme = () => {
    const nextDarkMode = !darkMode
    document.documentElement.classList.toggle('dark', nextDarkMode)
    localStorage.setItem('theme', nextDarkMode ? 'dark' : 'light')
    setDarkMode(nextDarkMode)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
    >
      {darkMode ? 'Light Mode' : 'Dark Mode'}
    </button>
  )
}
