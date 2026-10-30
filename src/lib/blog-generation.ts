import type { UpcomingTransit } from './upcoming-transits'

export function transitFacts(event: UpcomingTransit): string {
  return `Topic: ${event.title}\nCategory: ${event.kind}\n${event.start === event.end ? 'Event time' : 'Active window'} (UTC): ${event.start}${event.start !== event.end ? ` to ${event.end}` : ''}\n${event.startsBeforeRange ? 'Already active at the start of the calendar. The actual beginning is earlier; do not call this window boundary a start date.\n' : ''}${event.endsAfterRange ? 'Continues past the calendar end. The actual ending is later; do not call this window boundary an end date.\n' : ''}Exact contacts (UTC): ${event.exact.join(', ') || 'No exact contact within this active window'}\nMethod: ${event.description}`
}

export async function generateTransitBlog(topic: string, context: string, generate: (prompt: string) => Promise<string>) {
  const response = (await generate(`Write an astrology blog post for The Psychic Link using the following supplied facts. Dates come from astronomical calculations; do not invent dates, extra transits, local eclipse visibility, or personal natal-chart claims. Describe astrological themes as interpretations, not guaranteed outcomes.\n\n${topic}\n\nReader focus: ${context || 'A general audience'}\n\nReturn ordinary Markdown, NOT JSON. Begin with one # title, then write a complete 450–650 word article with an introduction, themes, practical advice, and a finished conclusion. Use short paragraphs and headings. Preserve the supplied date boundaries and distinguish active windows from exact events. Keep all dates explicitly in UTC. No placeholder names or unfinished sections.`)).trim()
  const text = response.replace(/^```(?:markdown|md)?\s*\n/i, '').replace(/\n```\s*$/, '').trim()
  if (!text || text.startsWith('{')) throw new Error('The AI did not return an article. Choose another model or try again.')
  const lines = text.split('\n')
  const hasTitle = /^#\s+\S/.test(lines[0])
  const title = hasTitle ? lines.shift()!.replace(/^#\s+/, '').trim() : topic.split('\n')[0].replace(/^Topic:\s*/, '')
  const content = lines.join('\n').trim()
  if (content.length < 200) throw new Error('The AI returned an empty or very short article. Please try again.')
  return { title, content, imagePrompt: `A mystical celestial illustration inspired by ${title}, with a deep blue star field, soft gold light and symbolic planetary imagery. No text.` }
}
