import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import { join } from 'node:path'

export const defaults = {
  'astrology-charts': [], 'family-dynamics': {}, 'personal-horoscopes': {},
  'compatibility-reports': {}, 'karmic-reports': {}, 'past-life-readings': {},
  'karmic-debt-results': [], 'important-days-readings': {}, 'blog-posts': [],
  'life-events': [], 'election-analyses': [],
}
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const identity = value => value?.id ?? value?.chartId
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const safeKey = key => !['__proto__', 'constructor', 'prototype'].includes(key)

// Merge only the entries a browser actually edited. Conflicting edits to the
// same entry are rejected instead of silently replacing another computer's work.
export function mergeChange(current, before, after) {
  if (equal(before, after) || equal(current, after)) return current
  if (equal(current, before)) return after
  const arrays = [current, before, after].every(Array.isArray)
  if (arrays && [current, before, after].every(items => items.every(item => typeof identity(item) === 'string') && new Set(items.map(identity)).size === items.length)) {
    const toMap = items => Object.fromEntries(items.map(item => [identity(item), item]))
    return Object.values(mergeChange(toMap(current), toMap(before), toMap(after)))
  }
  if ([current, before, after].every(record)) {
    const result = { ...current }
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (!safeKey(key)) throw new Error('Invalid library entry')
      if (equal(before[key], after[key])) continue
      if (!equal(current[key], before[key]) && !equal(current[key], after[key])) {
        const error = new Error('Another computer changed the same item. Your pending changes are preserved in this browser; download a backup before discarding them.')
        error.status = 409
        throw error
      }
      if (Object.hasOwn(after, key)) result[key] = after[key]
      else delete result[key]
    }
    return result
  }
  const error = new Error('The shared library changed on another computer. Download your pending changes before discarding them.')
  error.status = 409
  throw error
}

export async function openLibrary(directory) {
  await mkdir(directory, { recursive: true })
  const path = join(directory, 'library.json')
  let state
  try {
    state = JSON.parse(await readFile(path, 'utf8'))
    if (state.version !== 1 || !record(state.values) || !Array.isArray(state.requests)) throw new Error('Invalid library file; restore a backup before starting')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    state = { version: 1, values: structuredClone(defaults), requests: [] }
  }
  let queue = Promise.resolve()
  return {
    read: () => structuredClone({ ...defaults, ...state.values }),
    change(request) {
      const task = queue.then(async () => {
        if (typeof request.requestId !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(request.requestId) || !Array.isArray(request.changes) || !request.changes.length) {
          throw new Error('Invalid save request')
        }
        if (state.requests.includes(request.requestId)) return this.read()
        const values = { ...defaults, ...state.values }
        for (const { key, before, after } of request.changes) {
          if (!Object.hasOwn(defaults, key) || before == null || after == null ||
              (Array.isArray(defaults[key]) ? !Array.isArray(before) || !Array.isArray(after) : !record(before) || !record(after))) throw new Error('Invalid library collection')
          values[key] = mergeChange(values[key], before, after)
        }
        const next = { version: 1, values, requests: [...state.requests, request.requestId].slice(-10000) }
        // The previous complete file remains usable if writing the new file fails.
        await writeFile(`${path}.tmp`, JSON.stringify(next), { mode: 0o600 })
        await rename(`${path}.tmp`, path)
        state = next
        return this.read()
      })
      queue = task.catch(() => {})
      return task
    },
  }
}
