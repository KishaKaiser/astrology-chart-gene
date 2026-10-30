import { useState, useCallback, useEffect, useSyncExternalStore } from 'react'
import { subscribeLibrary, getLibrarySnapshot, startLibrary, isSharedKey, setSharedValue } from '@/lib/shared-library'

// Share charts and readings; keep device-specific integration settings local.
export function useKV<T>(key: string, defaultValue: T): [T, (updater: T | ((prev: T) => T)) => void] {
  const library = useSyncExternalStore(subscribeLibrary, getLibrarySnapshot)
  const [local, setLocal] = useState<T>(() => {
    try { const stored = localStorage.getItem(`astro_kv_${key}`); return stored ? JSON.parse(stored) : defaultValue }
    catch { return defaultValue }
  })
  useEffect(startLibrary, [])
  const set = useCallback((updater: T | ((prev: T) => T)) => {
    if (isSharedKey(key)) { setSharedValue(key, updater); return }
    setLocal(prev => {
      const next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater
      localStorage.setItem(`astro_kv_${key}`, JSON.stringify(next))
      return next
    })
  }, [key])
  return [isSharedKey(key) ? library.values[key] as T : local, set]
}
