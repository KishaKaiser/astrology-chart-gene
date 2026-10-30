type Values = Record<string, any>
type Change = { key: string; before: any; after: any }
type Pending = { requestId: string; changes: Change[] }
export const sharedDefaults: Values = {
  'astrology-charts': [], 'family-dynamics': {}, 'personal-horoscopes': {},
  'compatibility-reports': {}, 'karmic-reports': {}, 'past-life-readings': {},
  'karmic-debt-results': [], 'important-days-readings': {}, 'blog-posts': [],
  'life-events': [], 'election-analyses': [],
}
export const isSharedKey = (key: string) => Object.hasOwn(sharedDefaults, key)
const listeners = new Set<() => void>()
let snapshot = { ready: false, saving: false, error: '', pending: 0, values: { ...sharedDefaults } }
let pending: Pending[] = []
let running = false
let started = false
let polling = false
let journalLoaded = false
let mutationVersion = 0
const journalKey = 'astro_shared_pending_v1'
export const subscribeLibrary = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export const getLibrarySnapshot = () => snapshot
function emit(update: Partial<typeof snapshot>) {
  snapshot = { ...snapshot, ...update, pending: pending.length }
  listeners.forEach(listener => listener())
}
function persist() { sessionStorage.setItem(journalKey, JSON.stringify(pending)) }
async function request(path: string, body?: Pending) {
  const response = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store', signal: AbortSignal.timeout(30000),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.values || typeof data.values !== 'object') {
    throw new Error(data?.error || 'Shared library unavailable. Start the astrology home server and try again.')
  }
  return { ...sharedDefaults, ...data.values }
}
export async function refreshLibrary() {
  if (running || polling) return
  if (pending.length) return flushLibrary()
  polling = true
  const version = mutationVersion
  try {
    const values = await request('/api/library')
    // A local edit may have started while this GET was in flight.
    if (!running && !pending.length && version === mutationVersion) emit({ ready: true, values, error: '' })
  } catch (error) { emit({ error: error instanceof Error ? error.message : 'Shared library unavailable' }) }
  finally { polling = false }
}
export async function flushLibrary() {
  if (running) return
  running = true
  emit({ saving: true, error: '' })
  try {
    while (pending.length) {
      const values = await request('/api/library/changes', pending[0])
      pending.shift()
      persist()
      for (const item of pending) for (const change of item.changes) values[change.key] = change.after
      emit({ values, ready: true })
    }
  } catch (error) { emit({ error: error instanceof Error ? error.message : 'Could not save the shared library' }) }
  finally { running = false; emit({ saving: false }) }
}
export function startLibrary() {
  if (started) return
  started = true
  try {
    pending = JSON.parse(sessionStorage.getItem(journalKey) || '[]')
    if (!Array.isArray(pending)) throw new Error('Invalid pending changes')
    journalLoaded = true
  } catch { emit({ error: 'Could not restore pending changes. Back up this browser before clearing its storage.' }); return }
  void refreshLibrary()
  setInterval(() => { if (!document.hidden) void refreshLibrary() }, 15000)
  window.addEventListener('focus', () => { void refreshLibrary() })
  window.addEventListener('online', () => { void refreshLibrary() })
  window.addEventListener('beforeunload', event => {
    if (pending.length) { event.preventDefault(); event.returnValue = '' }
  })
}
function queueChanges(changes: Change[]) {
  if (!snapshot.ready || !journalLoaded) throw new Error('Wait for the shared library to connect before making changes.')
  const requestId = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
  const item = { requestId, changes }
  pending.push(item)
  mutationVersion++
  try { persist() }
  catch { pending.pop(); emit({ error: 'This browser cannot preserve pending changes. Free browser storage before saving.' }); throw new Error(snapshot.error) }
  const values = { ...snapshot.values }
  for (const change of changes) values[change.key] = change.after
  emit({ values })
  void flushLibrary()
}
export function setSharedValue<T>(key: string, updater: T | ((prev: T) => T)) {
  const before = snapshot.values[key]
  const after = typeof updater === 'function' ? (updater as (prev: T) => T)(before) : updater
  if (JSON.stringify(before) !== JSON.stringify(after)) queueChanges([{ key, before, after }])
}

// Import missing entries only; originals remain in localStorage as a backup.
export function importBrowserLibrary() {
  const changes: Change[] = []
  let count = 0
  for (const key of Object.keys(sharedDefaults)) {
    const raw = localStorage.getItem(`astro_kv_${key}`)
    if (!raw) continue
    const local = JSON.parse(raw)
    const before = snapshot.values[key]
    let after
    if (Array.isArray(before)) {
      if (!Array.isArray(local)) continue
      const id = (item: any) => item?.id ?? item?.chartId
      const ids = new Set(before.map(id))
      const additions = local.filter(item => {
        if (typeof id(item) !== 'string' || ids.has(id(item))) return false
        ids.add(id(item)); return true
      })
      after = [...before, ...additions]
      count += additions.length
    } else {
      if (!local || typeof local !== 'object' || Array.isArray(local)) continue
      after = { ...before }
      for (const [id, value] of Object.entries(local)) {
        if (!['__proto__', 'constructor', 'prototype'].includes(id) && !Object.hasOwn(before, id)) { after[id] = value; count++ }
      }
    }
    if (JSON.stringify(before) !== JSON.stringify(after)) changes.push({ key, before, after })
  }
  if (changes.length) queueChanges(changes)
  return count
}
export function downloadLibraryBackup() {
  const browser: Values = {}
  for (const key of Object.keys(sharedDefaults)) browser[key] = localStorage.getItem(`astro_kv_${key}`)
  const blob = new Blob([JSON.stringify({ shared: snapshot.values, pending, browser }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = `astrology-library-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export async function discardPendingChanges() {
  if (running) return
  const values = await request('/api/library')
  sessionStorage.removeItem(journalKey)
  pending = []
  emit({ values, ready: true, error: '' })
}
