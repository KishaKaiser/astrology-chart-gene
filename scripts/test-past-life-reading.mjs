import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundle = await build({ entryPoints: ['src/lib/past-life-reading.ts'], bundle: true, write: false, format: 'esm', platform: 'node' })
const { parsePastLifeDetails, generatePastLifeReading } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const details = { primaryLifeTheme: 'Service', lifeEra: 'Medieval era', occupation: 'Healer', challenges: ['Isolation'], karmaLessons: ['Trust'], talents: ['Compassion'] }
const json = JSON.stringify(details)
assert.deepEqual(parsePastLifeDetails('```json\n' + json + '\n```'), details)
for (const invalid of ['', '{"primaryLifeTheme":', 'null', '{}', JSON.stringify({ ...details, challenges: 'Isolation' }), JSON.stringify({ ...details, talents: [null] })]) {
  assert.throws(() => parsePastLifeDetails(invalid), /AI/)
}
const story = 'A story with "quoted words" and\n\nmultiple paragraphs, without JSON escaping.'
let calls = []
const reading = await generatePastLifeReading('Chart context', async (prompt, expectJson) => {
  calls.push({ prompt, expectJson })
  return expectJson ? json : story
})
assert.deepEqual(reading, { ...details, interpretation: story })
assert.deepEqual(calls.map(c => c.expectJson), [true, false])
assert.ok(calls[1].prompt.includes(json))
assert.ok(calls.every(c => c.prompt.includes('Chart context')))
let attempts = 0
await generatePastLifeReading('Chart', async (_, structured) => {
  attempts++
  return attempts === 1 ? 'Invalid JSON' : structured ? json : story
})
assert.equal(attempts, 3)
attempts = 0
await assert.rejects(generatePastLifeReading('Chart', async () => { attempts++; return 'Invalid JSON' }), /invalid reading details/)
assert.equal(attempts, 2)
attempts = 0
await assert.rejects(generatePastLifeReading('Chart', async () => { attempts++; throw new Error('AI service unavailable') }), /AI service unavailable/)
assert.equal(attempts, 1)
await assert.rejects(generatePastLifeReading('Chart', async (_, structured) => structured ? json : ''), /empty past life story/)
await assert.rejects(generatePastLifeReading('Chart', async (_, structured) => {
  if (structured) return json
  throw new Error('AI response reached its length limit')
}), /length limit/)
console.log('PASS: structured details, unescaped narrative, validation, bounded retry, and service failure propagation')
