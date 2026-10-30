import type jsPDF from 'jspdf'
import { normalizeInterpretationOrder } from './interpretation-sections'

export async function registerSignatureFont(pdf: jsPDF) {
  const response = await fetch(`${import.meta.env.BASE_URL}fonts/Arizonia-Regular.ttf`)
  if (!response.ok) throw new Error('Could not load the signature font. Refresh the app and try exporting again.')
  const bytes = new Uint8Array(await response.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
  pdf.addFileToVFS('Arizonia-Regular.ttf', btoa(binary))
  pdf.addFont('Arizonia-Regular.ttf', 'Arizonia', 'normal')
}

type Block = { text: string; kind: 'heading' | 'paragraph' | 'signature'; level: number }
function blocksFrom(text: string): Block[] {
  const blocks: Block[] = []
  let paragraph: string[] = []
  const flush = () => { if (paragraph.length) blocks.push({ text: paragraph.join('\n'), kind: 'paragraph', level: 0 }); paragraph = [] }
  for (const raw of normalizeInterpretationOrder(text).split('\n')) {
    const line = raw.trim()
    const heading = line.match(/^(#{2,4})\s+(.+)$/)
    const boldHeading = line.match(/^\*\*([^*]+)\*\*$/)
    if (line.replace(/\*\*/g, '').trim() === 'The Psychic Link') {
      flush(); blocks.push({ text: 'The Psychic Link', kind: 'signature', level: 0 })
    } else if (heading || boldHeading) {
      flush()
      const title = heading ? heading[2] : boldHeading![1]
      blocks.push({ text: title, kind: 'heading', level: heading ? heading[1].length : 3 })
    } else if (!line) flush()
    else paragraph.push(line.replace(/\*\*/g, '').replace(/^[-•]\s*/, '• '))
  }
  flush()
  return blocks
}

export function renderInterpretation(pdf: jsPDF, text: string, startY = 55) {
  const margin = 20
  const top = 25
  const bottom = pdf.internal.pageSize.getHeight() - 25
  const width = pdf.internal.pageSize.getWidth() - margin * 2
  const available = bottom - top
  const blocks = blocksFrom(text)
  const style = (block: Block) => {
    const size = block.kind === 'signature' ? 23 : block.kind === 'heading' ? (block.level === 2 ? 14 : block.level === 3 ? 12 : 10) : 10
    pdf.setFont(block.kind === 'signature' ? 'Arizonia' : 'helvetica', block.kind === 'heading' ? 'bold' : 'normal')
    pdf.setFontSize(size)
    if (block.kind === 'paragraph') pdf.setTextColor(50, 50, 50)
    else pdf.setTextColor(68, 21, 104)
    return block.kind === 'signature' ? 10 : block.kind === 'heading' ? 7 : 5
  }
  const measured = blocks.map(block => {
    const lineHeight = style(block)
    const lines: string[] = pdf.splitTextToSize(block.text, width)
    return { ...block, lines, lineHeight, height: lines.length * lineHeight, gap: block.kind === 'heading' ? 4 : 3 }
  })
  let y = startY
  const placements: Array<{ text: string; page: number; y: number; kind: string }> = []
  const newPage = () => { pdf.addPage(); y = top }
  for (let index = 0; index < measured.length; index++) {
    const block = measured[index]
    // Each main interpretation section starts on its own page. The first
    // section shares the interpretation banner; subsections stay in the flow.
    if (index > 0 && block.kind === 'heading' && block.level === 2 && y > top) newPage()
    let keep = block.height + block.gap
    if (block.kind === 'heading') {
      // Keep consecutive headings with the first complete paragraph whenever it
      // fits on a fresh page. Oversized paragraphs retain at least three lines.
      for (let next = index + 1; next < measured.length; next++) {
        const following = measured[next]
        if (following.kind === 'heading' && following.level === 2) break
        if (following.kind === 'heading') keep += following.height + following.gap
        else {
          const leadingHeight = keep
          keep += following.height
          if (keep > available) keep = Math.min(available, leadingHeight + Math.min(3, following.lines.length) * following.lineHeight)
          break
        }
      }
    } else if (block.kind === 'paragraph' && measured[index + 1]?.kind === 'signature') {
      keep += measured[index + 1].height
    }
    if (keep <= available && y + keep > bottom && y > top) newPage()
    style(block)
    let offset = 0
    while (offset < block.lines.length) {
      let count = Math.floor((bottom - y) / block.lineHeight)
      const remaining = block.lines.length - offset
      if (count < Math.min(2, remaining)) { newPage(); continue }
      count = Math.min(count, remaining)
      // Avoid leaving only one line of a long paragraph on the following page.
      if (remaining - count === 1 && count > 2) count--
      for (const line of block.lines.slice(offset, offset + count)) {
        pdf.text(line, margin, y)
        placements.push({ text: line, page: pdf.getNumberOfPages(), y, kind: block.kind })
        y += block.lineHeight
      }
      offset += count
      if (offset < block.lines.length) newPage()
    }
    y += block.gap
  }
  return { y, placements }
}
