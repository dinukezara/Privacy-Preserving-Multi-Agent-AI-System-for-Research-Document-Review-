"use client"

import { useState, useEffect } from "react"

export function useTheme() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  // On mount, read persisted preference or system preference
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("scholarlens-theme")
    if (stored) {
      const dark = stored === "dark"
      setIsDark(dark)
      if (dark) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    } else {
      // Fall back to system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setIsDark(prefersDark)
      if (prefersDark) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  }, [])

  const toggleDark = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("scholarlens-theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("scholarlens-theme", "light")
    }
  }

  return { isDark, toggleDark, mounted }
}
