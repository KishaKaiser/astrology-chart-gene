import { useState, useEffect, useCallback, useRef } from "react"

const BASE_URL = (import.meta.env.VITE_ASTRO_API_BASE_URL as string | undefined) ?? "https://api.astrology.link"
const TOKEN_KEY = "astrology_token"

export function getAstroToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAstroToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeAstroToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function kvGet<T>(key: string): Promise<T | null> {
  const token = getAstroToken()
  if (!token) return null
  try {
    const res = await fetch(`${BASE_URL}/kv/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { value: T | null }
    return data.value
  } catch {
    return null
  }
}

async function kvPut<T>(key: string, value: T): Promise<void> {
  const token = getAstroToken()
  if (!token) return
  try {
    await fetch(`${BASE_URL}/kv/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    })
  } catch {
    // silently fail — value stays in local state
  }
}

/**
 * Drop-in replacement for GitHub Spark's useKV hook.
 * Reads from and writes to the astrology backend when logged in,
 * falls back to localStorage when not authenticated.
 */
export function useKV<T>(key: string, defaultValue: T): [T, (updater: T | ((prev: T) => T)) => void] {
  const localKey = `astro_kv_${key}`

  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(localKey)
      return stored ? (JSON.parse(stored) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const syncedFromServer = useRef(false)

  // On mount (or when token changes), load from server
  useEffect(() => {
    const token = getAstroToken()
    if (!token || syncedFromServer.current) return

    kvGet<T>(key).then((serverValue) => {
      if (serverValue !== null) {
        setValue(serverValue)
        localStorage.setItem(localKey, JSON.stringify(serverValue))
      }
      syncedFromServer.current = true
    })
  }, [key, localKey])

  const set = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater
        localStorage.setItem(localKey, JSON.stringify(next))
        kvPut(key, next)
        return next
      })
    },
    [key, localKey]
  )

  return [value, set]
}
