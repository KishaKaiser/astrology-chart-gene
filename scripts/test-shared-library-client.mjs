import assert from 'node:assert/strict'
import vm from 'node:vm'
import { build } from 'esbuild'
import { defaults, mergeChange } from '../server/library.mjs'

const { outputFiles } = await build({ entryPoints: ['src/lib/shared-library.ts'], bundle: true, write: false, format: 'cjs', platform: 'node' })
let values = structuredClone(defaults)
const applied = new Set()
let offline = false
let loseResponse = false
const storage = (initial = {}) => {
  const data = new Map(Object.entries(initial))
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }
}
function client(localStorage = storage(), sessionStorage = storage()) {
  const context = vm.createContext({
    module: { exports: {} }, exports: {}, localStorage, sessionStorage, crypto, Uint8Array,
    AbortSignal, Error, document: { hidden: false }, window: { addEventListener() {} },
    setInterval() {}, setTimeout,
    fetch: async (_, options) => {
      if (offline) throw new Error('Network unavailable')
      if (options.method === 'POST') {
        const body = JSON.parse(options.body)
        if (!applied.has(body.requestId)) {
          const next = { ...values }
          try { for (const { key, before, after } of body.changes) next[key] = mergeChange(next[key], before, after) }
          catch (error) { return Response.json({ error: error.message }, { status: 409 }) }
          values = next; applied.add(body.requestId)
        }
        if (loseResponse) { loseResponse = false; throw new Error('Connection lost after save') }
      }
      return Response.json({ values })
    },
  })
  vm.runInContext(outputFiles[0].text, context)
  return context.module.exports
}
const tick = async () => { for (let i = 0; i < 10; i++) await new Promise(resolve => setTimeout(resolve, 0)) }
const charts = 'astrology-charts'
const a = { id: 'a', name: 'Desktop' }
const b = { id: 'b', name: 'Laptop' }
const originals = storage({ [`astro_kv_${charts}`]: JSON.stringify([a]), 'astro_kv_past-life-readings': JSON.stringify({ a: { interpretation: 'Story' } }), 'astro_kv_wordpress-settings': '{"password":"private"}' })
const desktopSession = storage()
const desktop = client(originals, desktopSession)
const laptop = client()
assert.equal(JSON.stringify(desktop.sharedDefaults), JSON.stringify(defaults), 'client and server collections must match')
desktop.startLibrary(); laptop.startLibrary(); await tick()
assert.ok(desktop.getLibrarySnapshot().ready)
assert.equal(desktop.importBrowserLibrary(), 2)
await tick(); await laptop.refreshLibrary()
assert.equal(laptop.getLibrarySnapshot().values[charts][0].name, 'Desktop')
assert.ok(!Object.hasOwn(values, 'wordpress-settings'))
assert.equal(originals.getItem(`astro_kv_${charts}`), JSON.stringify([a]))
assert.equal(desktop.importBrowserLibrary(), 0, 'migration is repeatable without duplicates')
laptop.setSharedValue(charts, old => [...old, b]); await tick()
// Desktop still has a stale list, but its update must preserve laptop's chart.
desktop.setSharedValue(charts, old => [...old, { id: 'c', name: 'Third' }]); await tick()
assert.equal(values[charts].length, 3)
await laptop.refreshLibrary()
assert.equal(laptop.getLibrarySnapshot().values[charts].length, 3)
offline = true
desktop.setSharedValue('past-life-readings', old => ({ ...old, b: { interpretation: 'Pending story' } }))
await tick()
assert.equal(desktop.getLibrarySnapshot().pending, 1)
assert.match(desktop.getLibrarySnapshot().error, /Network/)
assert.ok(desktopSession.getItem('astro_shared_pending_v1').includes('Pending story'))
offline = false
const restored = client(originals, desktopSession)
restored.startLibrary(); await tick()
assert.equal(restored.getLibrarySnapshot().pending, 0)
assert.equal(values['past-life-readings'].b.interpretation, 'Pending story')
loseResponse = true
restored.setSharedValue(charts, old => [...old, { id: 'd', name: 'Once' }]); await tick()
assert.equal(restored.getLibrarySnapshot().pending, 1)
await restored.refreshLibrary()
assert.equal(values[charts].filter(c => c.id === 'd').length, 1)
assert.equal(restored.getLibrarySnapshot().pending, 0)
await laptop.refreshLibrary()
restored.setSharedValue(charts, old => old.map(c => c.id === 'a' ? { ...c, name: 'First edit' } : c)); await tick()
laptop.setSharedValue(charts, old => old.map(c => c.id === 'a' ? { ...c, name: 'Conflicting edit' } : c)); await tick()
assert.equal(laptop.getLibrarySnapshot().pending, 1)
assert.match(laptop.getLibrarySnapshot().error, /Another computer/)
assert.equal(values[charts].find(c => c.id === 'a').name, 'First edit')
await laptop.discardPendingChanges()
assert.equal(laptop.getLibrarySnapshot().pending, 0)
assert.equal(laptop.getLibrarySnapshot().values[charts].find(c => c.id === 'a').name, 'First edit')
console.log('PASS: two browser stores, migration, shared reports, stale edits, offline recovery, lost responses, and conflicts')
