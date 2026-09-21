"use client"

import { useState, useEffect, useCallback } from "react"
import { getCurrentUser, type UserProfile } from "@/lib/api"

export const USER_STORAGE_KEY = "scholarlens-user"
export const TOKEN_STORAGE_KEY = "scholarlens-token"
export const USER_EVENT_KEY = "scholarlens-user-updated"

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(() => {
    if (typeof window === "undefined") return

    // 1. Read from localStorage for immediate display
    const stored = localStorage.getItem(USER_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === "object") {
          setUser(parsed)
        }
      } catch {
        // ignore parse error
      }
    }

    // 2. Refresh from backend if token exists
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (token) {
      getCurrentUser()
        .then((profile) => {
          if (profile) {
            setUser(profile)
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile))
          }
        })
        .catch(() => {
          // In case API is unreachable or offline, keep cached user
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()

    const handleUpdate = () => {
      loadUser()
    }

    window.addEventListener(USER_EVENT_KEY, handleUpdate)
    window.addEventListener("storage", handleUpdate)

    return () => {
      window.removeEventListener(USER_EVENT_KEY, handleUpdate)
      window.removeEventListener("storage", handleUpdate)
    }
  }, [loadUser])

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
      setUser(null)
      window.dispatchEvent(new Event(USER_EVENT_KEY))
    }
  }, [])

  return { user, loading, logout, reload: loadUser }
}

export function notifyUserUpdated(user?: UserProfile | null) {
  if (typeof window !== "undefined") {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    }
    window.dispatchEvent(new Event(USER_EVENT_KEY))
  }
}
