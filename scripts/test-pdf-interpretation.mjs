import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { build } from 'esbuild'
import { jsPDF } from 'jspdf'

const bundle = await build({ entryPoints: ['src/lib/pdf-interpretation.ts'], bundle: true, write: false, format: 'esm', platform: 'node', define: { 'import.meta.env.BASE_URL': '"/"' } })
const { renderInterpretation, registerSignatureFont } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const font = await readFile('public/fonts/Arizonia-Regular.ttf')
const originalFetch = globalThis.fetch
globalThis.fetch = async url => { assert.equal(url, '/fonts/Arizonia-Regular.ttf'); return new Response(font) }
try {
  const pdf = new jsPDF()
  await registerSignatureFont(pdf)
  assert.ok(pdf.getFontList().Arizonia)
  const paragraph = 'You may feel most comfortable when you have space to explore your own ideas. Give yourself time to think before making a commitment. Talk openly with the people you trust, and ask for practical help when you need it. '.repeat(4)
  const layout = renderInterpretation(pdf, '## 2. CHART OVERVIEW & DOMINANT THEMES\n'+paragraph, 255)
  assert.equal(layout.placements[0].page, 2, 'near-bottom heading must move to the next page')
  assert.ok(layout.placements.every(line => line.page === 2), 'opening paragraph must stay with its title')
  const long = new jsPDF()
  await registerSignatureFont(long)
  const longLayout = renderInterpretation(long, '## 3. CORE IDENTITY: SUN, MOON & RISING\n'+paragraph.repeat(15), 255)
  assert.equal(longLayout.placements[0].page, 2)
  assert.ok(longLayout.placements.filter(line => line.page === 2 && line.kind === 'paragraph').length >= 3)
  assert.ok(longLayout.placements.every(line => line.y >= 25 && line.y <= 272.1), 'text stays outside footer')
  const wide = new jsPDF()
  await registerSignatureFont(wide)
  const wrap = renderInterpretation(wide, '### A very long subsection heading that must wrap safely inside the printable width without spilling into the margin\n'+paragraph, 240)
  assert.ok(wrap.placements.filter(line => line.kind === 'heading').length > 1)
  assert.equal(new Set(wrap.placements.map(line => line.page)).size, 1)
  const signature = new jsPDF()
  await registerSignatureFont(signature)
  renderInterpretation(signature, 'With warmth and best wishes,\n**The Psychic Link**', 260)
  assert.equal(signature.getFont().fontName, 'Arizonia')
  assert.equal(signature.getNumberOfPages(), 2, 'closing and signature move together')

  if (process.argv[2]) {
    const preview = new jsPDF()
    await registerSignatureFont(preview)
    preview.setFillColor(68, 21, 104); preview.rect(0, 0, 210, 45, 'F')
    preview.setTextColor(255,255,255); preview.setFontSize(20)
    preview.text('CHART INTERPRETATION',105,26,{align:'center'})
    preview.setFont('Arizonia','normal'); preview.setFontSize(18)
    preview.text('The Psychic Link',105,40,{align:'center'})
    const intro = `## 1. PRACTICAL GUIDANCE & INTEGRATION\nYou bring warmth and curiosity to the people around you. You may enjoy sharing ideas, while also needing quiet time to understand your own feelings. Both needs deserve room in your daily life.\n\nStart small. Choose one task each morning that matters to you, and give it your attention before taking on more. A short walk or a few quiet minutes can help you notice what you need.\n\nIn relationships, say what would help instead of hoping someone will guess. You might say, "I would like a little time to think, then we can talk." At work, break a large goal into one manageable step.\n\nYou do not have to change everything at once. Notice which habits leave you feeling calmer and more confident, and build on those. Your chart offers ideas to explore; you decide what fits your life.\n\nWith warmth and best wishes,\nThe Psychic Link`
    const first = renderInterpretation(preview, intro, 58)
    // Reproduce the reported layout: a new section arrives close to the footer.
    const next = renderInterpretation(preview, '## 2. CHART OVERVIEW & DOMINANT THEMES\n'+paragraph+'\n\nA fresh page gives this section room to begin clearly, with the title and complete opening paragraph together.', Math.max(first.y, 255))
    assert.equal(next.placements[0].page, 2)
    const pages = preview.getNumberOfPages()
    for (let i=1;i<=pages;i++) {
      preview.setPage(i); preview.setFillColor(245,245,250); preview.rect(0,282,210,15,'F')
      preview.setFont('helvetica','normal'); preview.setFontSize(8); preview.setTextColor(100,100,100)
      preview.text('Layout preview - sample text',20,289); preview.text(`Page ${i} of ${pages}`,190,289,{align:'right'})
    }
    await mkdir(dirname(process.argv[2]), { recursive: true })
    await writeFile(process.argv[2], new Uint8Array(preview.output('arraybuffer')))
  }
  console.log('PASS: embedded Arizonia, heading/paragraph pagination, long paragraphs, wrapped headings, signature grouping, and footer clearance')
} finally { globalThis.fetch = originalFetch }
