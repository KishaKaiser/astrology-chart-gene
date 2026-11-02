import { parseInterpretationSections } from './interpretation-sections'
import type { RelocatedChart } from './relocation'

export const CAREER_THEMES = {
  general: { label: 'All careers', planets: [] },
  communication: { label: 'Teaching, writing and communication', planets: ['Mercury', 'Jupiter'] },
  creative: { label: 'Creative work, design and the arts', planets: ['Venus', 'Sun'] },
  caring: { label: 'Care, counseling and community work', planets: ['Moon', 'Jupiter'] },
  leadership: { label: 'Business, management and leadership', planets: ['Sun', 'Saturn'] },
  technical: { label: 'Research, technology and analytical work', planets: ['Mercury', 'Uranus'] },
  practical: { label: 'Hands-on, technical trades and operations', planets: ['Mars', 'Saturn'] },
  spiritual: { label: 'Spiritual, intuitive and psychic services', planets: ['Moon', 'Neptune'] },
} as const
export interface RelocationPreferences {
  careerTheme: keyof typeof CAREER_THEMES
  environment: 'any' | 'large-city' | 'mid-sized' | 'smaller-near-city'
  careerNotes: string
  environmentNotes: string
}
export const DEFAULT_RELOCATION_PREFERENCES: RelocationPreferences = { careerTheme: 'general', environment: 'any', careerNotes: '', environmentNotes: '' }
export const ENVIRONMENT_LABELS = { any: 'Any qualifying living environment', 'large-city': 'Large city / metropolitan area (500,000+)', 'mid-sized': 'Mid-sized city (100,000–499,999)', 'smaller-near-city': 'Smaller place near a major city (25,000–99,999)' }
export function sectionOnePreferences(text: string): Pick<RelocationPreferences, 'careerNotes' | 'environmentNotes'> {
  const section = parseInterpretationSections(text).find(s => s.number === 1)?.content || ''
  let active = ''; const career: string[] = []; const environment: string[] = []
  for (const line of section.split('\n')) {
    const clean = line.replace(/^\s*#{1,6}\s*/, '').replace(/\*\*|__/g, '').trim().replace(/:$/, '')
    if (/^Careers?\s*(?:&|and)\s*Jobs?\s+To\s+Explore$/i.test(clean)) { active = 'career'; continue }
    if (/^Places\s*(?:&|and)\s*Living\s+Environments\s+That\s+May\s+Suit\s+You$/i.test(clean)) { active = 'environment'; continue }
    if (/^\s*#{1,6}\s/.test(line) || /^With warmth/i.test(clean)) active = ''
    if (active === 'career') career.push(line)
    if (active === 'environment') environment.push(line)
  }
  return { careerNotes: career.join('\n').trim(), environmentNotes: environment.join('\n').trim() }
}
export function validatePreferences(p: RelocationPreferences) {
  if (!Object.hasOwn(CAREER_THEMES, p.careerTheme) || !Object.hasOwn(ENVIRONMENT_LABELS, p.environment) || typeof p.careerNotes !== 'string' || typeof p.environmentNotes !== 'string' || p.careerNotes.length > 6000 || p.environmentNotes.length > 6000) throw new Error('Choose valid career and living-environment preferences, with notes under 6,000 characters each.')
}
export function matchesEnvironment(population: number, environment: RelocationPreferences['environment']): boolean {
  return environment === 'any' || (environment === 'large-city' ? population >= 500000 : environment === 'mid-sized' ? population >= 100000 && population < 500000 : population >= 25000 && population < 100000)
}
// Career fit is a chart interpretation, never evidence of local jobs or industries.
export function careerThemeBonus(item: RelocatedChart, theme: RelocationPreferences['careerTheme']): number {
  const planets: readonly string[] = CAREER_THEMES[theme].planets
  if (!planets.length) return 0
  return planets.reduce((total, name) => {
    const planet = item.planets.find(p => p.name === name)
    if (!planet) return total
    const orb = Math.abs(((planet.longitude - item.midheaven + 540) % 360) - 180)
    return total + 3 * Math.max(0, 1 - orb / 12) + ([2, 6, 10].includes(planet.house) ? 1 : 0)
  }, 0) / planets.length
}
