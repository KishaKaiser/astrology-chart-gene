import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: ['src/lib/llm.ts'], bundle: true, write: false, format: 'esm', platform: 'node',
  define: { 'import.meta.env.VITE_API_BASE_URL': '"http://test-ai"', 'import.meta.env.VITE_PUBLIC_API_KEY': '"test-key"' }
})
const { llm, listModels } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const originalFetch = globalThis.fetch
let payload
let response = { content: 'A reading', model: 'model-b:latest' }
let status = 200
globalThis.fetch = async (url, options) => {
  assert.equal(options.headers['x-api-key'], 'test-key')
  payload = options.body ? JSON.parse(options.body) : undefined
  return Response.json(response, { status })
}
try {
  let used
  assert.equal(await llm('Test', false, { model: 'model-b:latest', onModelUsed: model => { used = model } }), 'A reading')
  assert.equal(payload.model, 'model-b:latest')
  assert.equal(used, 'model-b:latest')
  await llm('Test')
  assert.ok(!('model' in payload))
  response = { content: '```json\n{"ok":true}\n```' }
  assert.equal(await llm('Test', true), '{"ok":true}')
  await assert.rejects(llm('Test', false, { model: 'model-b:latest' }), /did not confirm/)
  response = { models: [{ name: 'model-a:latest' }, { name: 'model-b:latest' }], defaultModel: 'model-a:latest' }
  assert.deepEqual(await listModels(), response)
  status = 404
  await assert.rejects(listModels(), /updated Chatterbox backend/)
  status = 400
  response = { error: 'Selected model is not installed' }
  await assert.rejects(llm('Test'), /not installed/)
  console.log('PASS: model selection payload, default compatibility, response metadata, JSON extraction, model listing, and error handling')
} finally {
  globalThis.fetch = originalFetch
}
