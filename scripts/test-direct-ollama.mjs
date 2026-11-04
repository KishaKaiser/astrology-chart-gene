import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createAppServer } from '../server/index.mjs'

const dir = await mkdtemp(join(tmpdir(), 'astrology-ollama-test-'))
const calls = []
let truncate = 0
const ollama = createServer(async (req, res) => {
  let raw = ''
  for await (const part of req) raw += part
  const body = raw && JSON.parse(raw)
  calls.push({ path: req.url, body })
  res.setHeader('Content-Type', 'application/json')
  if (req.url === '/api/tags') return res.end(JSON.stringify({ models: [{name:'model-a'}, {name:'model-b'}] }))
  assert.equal(req.url, '/api/chat')
  assert.equal(body.stream, false)
  if (body.model === 'missing') { res.statusCode = 404; return res.end('{}') }
  res.end(JSON.stringify({ model: body.model, done: true, done_reason: truncate-- > 0 ? 'length' : 'stop', message: { content: 'Sample complete reading.' } }))
})
async function listen(server) {
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
  return `http://127.0.0.1:${server.address().port}`
}
let app
try {
  const baseUrl = await listen(ollama)
  app = await createAppServer({ dataDir: dir, distDir: dir, ollamaBaseUrl: baseUrl, ollamaModel: 'model-a' })
  const url = await listen(app)
  const list = await fetch(`${url}/api/ollama/models`)
  assert.deepEqual(await list.json(), { models: [{name:'model-a'}, {name:'model-b'}], defaultModel:'model-a' })
  const chat = model => fetch(`${url}/api/ollama/chat`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({model,messages:[{role:'user',content:'Synthetic reading'}]}) })
  assert.equal((await (await chat()).json()).model,'model-a')
  truncate = 1
  assert.deepEqual(await (await chat('model-b')).json(),{ model:'model-b', content:'Sample complete reading.' })
  assert.deepEqual(calls.slice(-2).map(c=>c.body.options.num_predict),[2048,4096])
  truncate = 2
  assert.equal((await chat()).status,502)
  assert.equal((await chat('missing')).status,400)
  const count = calls.length
  assert.equal((await fetch(`${url}/api/ollama/models`, { headers:{Origin:'https://other.test'} })).status,403)
  assert.equal(calls.length,count)
  console.log('PASS: astrology HTTP server lists models, calls Ollama with the default or selected model, retries truncation, handles missing models and enforces its origin check')
} finally {
  for (const server of [app,ollama]) if (server?.listening) await new Promise(resolve => server.close(resolve))
  await rm(dir,{ recursive:true,force:true })
}
