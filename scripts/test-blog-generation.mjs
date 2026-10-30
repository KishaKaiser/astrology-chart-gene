import assert from 'node:assert/strict'
import { build } from 'esbuild'
const bundle = await build({ entryPoints: ['src/lib/blog-generation.ts'], bundle: true, write: false, format: 'esm', platform: 'node' })
const { generateTransitBlog, transitFacts } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const event = { title:'Mercury retrograde', kind:'retrograde', start:'2026-10-30T12:00:00Z', end:'2026-11-13T15:52:00Z', exact:[], startsBeforeRange:true, endsAfterRange:false, description:'No shadow period' }
const facts = transitFacts(event)
assert.ok(facts.includes(event.start) && facts.includes(event.end))
assert.ok(facts.includes('actual beginning is earlier'))
const article = 'An ordinary paragraph with "unescaped quotes", symbols & advice. '.repeat(8) + '\n\nA complete conclusion.'
let calls = 0
const result = await generateTransitBlog(facts, 'Relationships', async prompt => {
  calls++
  assert.ok(prompt.includes(facts) && prompt.includes('Relationships') && prompt.includes('NOT JSON'))
  return '# A thoughtful transit\n\n' + article
})
assert.equal(calls, 1)
assert.equal(result.title, 'A thoughtful transit')
assert.equal(result.content, article)
assert.equal((await generateTransitBlog(facts, '', async () => article)).title, event.title)
assert.equal((await generateTransitBlog(facts, '', async () => '```markdown\n# Heading\n\n'+article+'\n```')).content, article)
await assert.rejects(generateTransitBlog(facts, '', async () => ''), /did not return/)
await assert.rejects(generateTransitBlog(facts, '', async () => '# Title\nToo short'), /very short/)
await assert.rejects(generateTransitBlog(facts, '', async () => '{"content":"bad"}'), /did not return/)
await assert.rejects(generateTransitBlog(facts, '', async () => { throw new Error('AI response reached its length limit') }), /length limit/)
console.log('PASS: plain-text article generation, dated facts, clipped periods, titles, quoted paragraphs, and error propagation')
