export const INTERPRETATION_TITLES = [
  'CHART OVERVIEW & DOMINANT THEMES',
  'CORE IDENTITY: SUN, MOON & RISING',
  'COMMUNICATION & INTELLECT: MERCURY',
  'LOVE & VALUES: VENUS',
  'ACTION & DESIRE: MARS',
  'EXPANSION & WISDOM: JUPITER',
  'DISCIPLINE & LESSONS: SATURN',
  'TRANSFORMATION & OUTER PLANETS',
  'ASPECT PATTERNS & DYNAMICS',
  'LIFE PATH & CAREER',
  'RELATIONSHIPS & PARTNERSHIPS',
  'SOUL PURPOSE & SPIRITUAL PATH',
  'PRACTICAL GUIDANCE & INTEGRATION',
]

export function parseInterpretationSections(text: string) {
  return Array.from(text.matchAll(/##\s*(\d+)\.\s*([^\n]+)\n([\s\S]*?)(?=##\s*\d+\.|$)/g), match => ({
    number: Number(match[1]), title: match[2].trim(), content: match[3].trim(),
  }))
}

export function missingInterpretationSections(text: string): number[] {
  const complete = new Set(parseInterpretationSections(text).filter(s => s.content).map(s => s.number))
  return INTERPRETATION_TITLES.map((_, i) => i + 1).filter(number => !complete.has(number))
}

export function upsertInterpretationSection(text: string, number: number, response: string): string {
  const title = INTERPRETATION_TITLES[number - 1]
  if (!Number.isInteger(number) || !title) throw new Error('Invalid interpretation section')
  let content = response
    .replace(/^\s*#{1,4}\s+\d+\.\s*[^\n]*\n?/, '')
    .replace(/^\s*\*\*\d+\.\s*[^*]+\*\*\n?/, '').trim()
  if (!content) throw new Error('The AI returned an empty section. Please try again.')
  if (number === 13) content = content.replace(/\[\s*your name\s*\]/gi, 'The Psychic Link')
  const sections = new Map(parseInterpretationSections(text).map(section => [section.number, section]))
  sections.set(number, { number, title, content })
  // Preserve any legacy reading/preamble before the first numbered heading.
  const firstHeading = text.search(/##\s*\d+\./)
  const preamble = (firstHeading < 0 ? text : text.slice(0, firstHeading)).trim()
  const reading = [...sections.values()].sort((a, b) => a.number - b.number)
    .map(section => `## ${section.number}. ${section.title}\n${section.content}`).join('\n\n')
  return preamble ? `${preamble}\n\n${reading}` : reading
}

export async function generateInterpretationSections(options: {
  initialText: string
  numbers: number[]
  generate: (number: number) => Promise<string>
  save: (text: string) => void | Promise<void>
  progress: (number: number) => void
}) {
  let text = options.initialText
  for (const number of options.numbers) {
    options.progress(number)
    const response = await options.generate(number)
    text = upsertInterpretationSection(text, number, response)
    await options.save(text)
  }
  return text
}
