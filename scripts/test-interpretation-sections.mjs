import assert from 'node:assert/strict'
import { build } from 'esbuild'
const bundle = await build({ entryPoints: ['src/lib/interpretation-sections.ts'], bundle: true, write: false, format: 'esm', platform: 'node' })
const { INTERPRETATION_TITLES: titles, normalizeInterpretationOrder: normalize, parseInterpretationSections: parse, missingInterpretationSections: missing, upsertInterpretationSection: upsert, generateInterpretationSections: generate } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
let saved = ''
const checkpoints = []
const requests = []
await assert.rejects(generate({ initialText: '', numbers: Array.from({length:13},(_,i)=>i+1),
  generate: async n => { requests.push(n); if(n===9) throw new Error('Offline'); return `Section ${n} original.` },
  save: text => { saved = text; checkpoints.push(parse(text).length) }, progress: () => {},
}), /Offline/)
assert.deepEqual(checkpoints, [1,2,3,4,5,6,7,8])
assert.deepEqual(missing(saved), [9,10,11,12,13])
const originals = parse(saved)
requests.length = 0
saved = await generate({ initialText: saved, numbers: missing(saved),
  generate: async n => { requests.push(n); return `## ${n}. Model heading\nSection ${n} completed.` },
  save: text => { saved = text }, progress: () => {},
})
assert.deepEqual(requests, [9,10,11,12,13])
assert.deepEqual(parse(saved).slice(0,8), originals)
assert.deepEqual(missing(saved), [])
const before = saved
await assert.rejects(generate({initialText:saved,numbers:[3],generate:async()=>{throw new Error('Offline')},save:text=>{saved=text},progress:()=>{}}), /Offline/)
assert.equal(saved,before)
saved = upsert(saved,3,'**3. Replacement heading**\nUpdated third section.')
assert.equal(parse(saved).length,13)
assert.equal(parse(saved)[2].content,'Updated third section.')
assert.deepEqual(parse(saved).filter(s=>s.number!==3),parse(before).filter(s=>s.number!==3))
const outOfOrder = upsert(upsert('',1,'With warmth and best wishes,\n[Your Name]'),4,'Venus reading.')
assert.deepEqual(parse(outOfOrder).map(s=>s.number),[1,4])
assert.ok(parse(outOfOrder)[0].content.endsWith('The Psychic Link'))
assert.throws(()=>upsert(saved,2,'## 2. Empty heading\n'), /empty section/)
assert.ok(upsert('Legacy reading without headings.',2,'New section.').startsWith('Legacy reading without headings.'))
assert.ok(missing('## 1. Empty\n').includes(1))
const oldTitles = [...titles.slice(1), titles[0]]
const oldReading = oldTitles.map((title, i) => `## ${i + 1}. ${title}\nOriginal content for ${title}.\n\nSecond paragraph stays intact.`).join('\n\n')
const reordered = normalize(oldReading)
assert.equal(parse(reordered)[0].title, 'PRACTICAL GUIDANCE & INTEGRATION')
assert.ok(parse(reordered)[0].content.includes('Original content for PRACTICAL'))
assert.deepEqual(parse(reordered).map(s => s.title), titles)
assert.equal(normalize(reordered), reordered, 'migration must be idempotent')
assert.deepEqual(missing(oldReading), [])
const partialOld = oldTitles.slice(0, 8).map((title, i) => `## ${i + 1}. ${title}\nSaved ${title}`).join('\n\n')
assert.deepEqual(missing(partialOld), [1, 10, 11, 12, 13])
const withOpening = upsert(partialOld, 1, 'A simple opening.\nWith warmth and best wishes,\n[Your Name]')
assert.equal(parse(withOpening).length, 9)
assert.ok(parse(withOpening)[0].content.endsWith('The Psychic Link'))
assert.deepEqual(parse(withOpening).slice(1), parse(partialOld))
console.log('PASS: interruption after eight sections, per-section saves, missing-only resume, isolated regeneration, failure preservation, ordering, signature, and legacy text')

const duplicateMars = '## 6. ACTION & DESIRE: MARS\n### **5. ACTION & DESIRE: MARS**\n\nMars body stays.'
const duplicateSaturn = '## 8. DISCIPLINE & LESSONS: SATURN\n### Section 7. Discipline & Lessons: Saturn\n\n### Saturn in Leo House 6\n\nSaturn body stays.'
assert.equal(parse(duplicateMars)[0].content, 'Mars body stays.')
assert.equal(parse(duplicateSaturn)[0].content, '### Saturn in Leo House 6\n\nSaturn body stays.')
for (const heading of ['### **5. ACTION & DESIRE: MARS**', '**Section 5. Action & Desire: Mars**', 'Section 5 Action & Desire: Mars']) {
  assert.equal(parse(upsert('',6,heading+'\nMars body stays.'))[0].content,'Mars body stays.')
}
assert.equal(normalize(normalize(duplicateMars)),normalize(duplicateMars))
console.log('PASS: screenshot duplicate titles removed from existing and new sections; meaningful subheadings preserved')
