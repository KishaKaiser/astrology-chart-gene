import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { once } from 'node:events'
import { request as httpRequest } from 'node:http'
import { createAppServer } from '../server/index.mjs'

const root = await mkdtemp(join(tmpdir(), 'astrology-library-test-'))
const dataDir = join(root, 'data')
const distDir = join(root, 'dist')
await mkdir(distDir)
await writeFile(join(distDir, 'index.html'), '<html>Astrology test</html>')
let server, base
async function start() {
  server = await createAppServer({ dataDir, distDir })
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  base = `http://127.0.0.1:${server.address().port}`
}
async function stop() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)) }
const read = async () => (await (await fetch(`${base}/api/library`)).json()).values
const save = async (changes, requestId = crypto.randomUUID()) => fetch(`${base}/api/library/changes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId, changes }) })
const chartChange = (before, after) => [{ key: 'astrology-charts', before, after }]
try {
  await start()
  assert.deepEqual((await read())['astrology-charts'], [])
  const a = { id: 'desktop-chart', name: 'Desktop', interpretation: 'Saved reading' }
  const b = { id: 'laptop-chart', name: 'Laptop' }
  const results = await Promise.all([save(chartChange([], [a])), save(chartChange([], [b]))])
  assert.ok(results.every(r => r.status === 200))
  assert.equal((await read())['astrology-charts'].length, 2, 'stale clients adding different charts both persist')
  const requestId = crypto.randomUUID()
  assert.equal((await save([{ key: 'past-life-readings', before: {}, after: { [a.id]: { interpretation: 'Story' } } }], requestId)).status, 200)
  assert.equal((await save([{ key: 'past-life-readings', before: {}, after: { [a.id]: { interpretation: 'Story' } } }], requestId)).status, 200)
  const before = (await read())['astrology-charts']
  const changed = before.map(c => c.id === a.id ? { ...c, interpretation: 'Updated' } : c)
  assert.equal((await save(chartChange(before, changed))).status, 200)
  assert.equal((await save(chartChange(before, before.map(c => c.id === a.id ? { ...c, interpretation: 'Conflicting' } : c)))).status, 409)
  const deletion = changed.filter(c => c.id !== b.id)
  assert.equal((await save(chartChange(changed, deletion))).status, 200)
  // Unchanged stale records must not resurrect a deleted chart.
  assert.equal((await save(chartChange(changed, [...changed, { id: 'new-chart', name: 'New' }]))).status, 200)
  assert.ok(!(await read())['astrology-charts'].some(c => c.id === b.id))
  const final = await read()
  await stop(); await start()
  assert.deepEqual(await read(), final, 'data survives server restart')
  const crossSite = await fetch(`${base}/api/library/changes`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://unrelated.example' }, body: '{}' })
  assert.equal(crossSite.status, 403)
  const badHostStatus = await new Promise((resolve, reject) => {
    const req = httpRequest(`${base}/api/library`, { headers: { Host: 'untrusted.example' } }, res => { res.resume(); resolve(res.statusCode) })
    req.on('error', reject); req.end()
  })
  assert.equal(badHostStatus, 403)
  assert.equal((await fetch(`${base}/api/library`, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403)
  assert.equal((await fetch(`${base}/storage/library.json`)).status, 404)
  assert.equal((await fetch(`${base}/.env`)).status, 404)
  assert.ok((await (await fetch(base)).text()).includes('Astrology test'))
  const invalid = await save([{ key: 'wordpress-settings', before: {}, after: { password: 'not-shared' } }])
  assert.notEqual(invalid.status, 200)
  assert.deepEqual(await read(), final)
  assert.ok(JSON.parse(await readFile(join(dataDir, 'library.json'), 'utf8')).values)
  await stop()
  await writeFile(join(dataDir, 'library.json'), 'broken')
  await assert.rejects(start(), /JSON/)
  assert.equal(await readFile(join(dataDir, 'library.json'), 'utf8'), 'broken', 'corruption must never reset the library')
  console.log('PASS: shared HTTP library, concurrent browsers, conflicts, idempotency, deletes, restart persistence, corruption protection, and request boundaries')
} finally {
  if (server?.listening) await stop()
  await rm(root, { recursive: true, force: true })
}
