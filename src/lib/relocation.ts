import { Body, MakeTime, SiderealTime, e_tilt, GeoVector, Ecliptic } from 'astronomy-engine'
import { birthTimeToUTC } from './birth-time'
import { ZODIAC_SIGNS, type ChartData } from './astrology-types'
import { RELOCATION_CITIES } from './relocation-cities'

export type RelocationPriority = 'balanced' | 'career' | 'home' | 'relationships'
export interface PlaceRanking { score: number; reasons: string[]; tradeoffs: string[] }

export interface RelocationPlace { name: string; latitude: number; longitude: number; country?: string }
export interface RelocatedChart {
  ranking?: PlaceRanking
  place: RelocationPlace
  ascendant: number
  midheaven: number
  descendant: number
  ic: number
  planets: Array<{ name: string; longitude: number; house: number }>
  angularContacts: Array<{ planet: string; angle: 'Ascendant' | 'Midheaven' | 'Descendant' | 'IC'; orb: number }>
}
export interface RelocationAnalysis {
  search?: { method: 'worldwide-v1' | 'domestic-international-v1'; priority: RelocationPriority; candidateCount: number; domesticCountry?: string }
  version: 1
  sourceKey: string
  birthUTC: string
  calculatedAt: number
  houseSystem: 'Whole sign'
  natal: RelocatedChart
  destinations: RelocatedChart[]
  interpretation?: string
  model?: string
}
const RAD = Math.PI / 180
const normalize = (degrees: number) => ((degrees % 360) + 360) % 360
export const angularDistance = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180)
export function relocationSourceKey(chart: ChartData): string {
  return JSON.stringify([chart.date, chart.time, chart.timezone, chart.latitude, chart.longitude])
}
export function currentRelocation(chart: ChartData): RelocationAnalysis | undefined {
  const report = chart.relocationAnalysis
  return report?.version === 1 && report.sourceKey === relocationSourceKey(chart) ? report : undefined
}
export function validateRelocationPlace(place: RelocationPlace) {
  if (!place.name.trim()) throw new Error('Enter a place name.')
  if (!Number.isFinite(place.latitude) || Math.abs(place.latitude) >= 66) throw new Error('Choose a latitude between 66° south and 66° north. Polar locations are not supported in this comparison.')
  if (!Number.isFinite(place.longitude) || Math.abs(place.longitude) > 180) throw new Error('Longitude must be between -180 and 180.')
}
export function relocationAngles(date: Date, place: RelocationPlace) {
  validateRelocationPlace(place)
  const sidereal = normalize(SiderealTime(date) * 15 + place.longitude) * RAD
  const tilt = e_tilt(MakeTime(date)).tobl * RAD
  const latitude = place.latitude * RAD
  // Intersection of the ecliptic with the local horizon, selecting its eastern
  // half (rising). Sidereal time and obliquity both refer to the true date frame.
  const a = Math.cos(latitude) * Math.cos(sidereal)
  const b = Math.cos(latitude) * Math.sin(sidereal) * Math.cos(tilt) + Math.sin(latitude) * Math.sin(tilt)
  let asc = Math.atan2(-a, b)
  const east = -Math.cos(asc) * Math.sin(sidereal) + Math.sin(asc) * Math.cos(tilt) * Math.cos(sidereal)
  if (east < 0) asc += Math.PI
  const ascendant = normalize(asc / RAD)
  const midheaven = normalize(Math.atan2(Math.sin(sidereal), Math.cos(sidereal) * Math.cos(tilt)) / RAD)
  return { ascendant, midheaven, descendant: normalize(ascendant + 180), ic: normalize(midheaven + 180) }
}
export const wholeSignHouse = (longitude: number, ascendant: number) => (Math.floor(normalize(longitude) / 30) - Math.floor(normalize(ascendant) / 30) + 12) % 12 + 1
export function calculateRelocation(chart: ChartData, places: RelocationPlace[]): RelocationAnalysis {
  if (!places.length || places.length > 10) throw new Error('Compare between one and ten places.')
  return calculateCandidates(chart, places)
}
function calculateCandidates(chart: ChartData, places: RelocationPlace[]): RelocationAnalysis {
  const original = { name: chart.location, latitude: chart.latitude, longitude: chart.longitude }
  validateRelocationPlace(original)
  places.forEach(validateRelocationPlace)
  const date = birthTimeToUTC(chart.date, chart.time, chart.timezone)
  const positions = [Body.Sun, Body.Moon, Body.Mercury, Body.Venus, Body.Mars, Body.Jupiter, Body.Saturn, Body.Uranus, Body.Neptune, Body.Pluto]
    .map(body => ({ name: String(body), longitude: Ecliptic(GeoVector(body, date, true)).elon }))
  const calculate = (place: RelocationPlace): RelocatedChart => {
    const angles = relocationAngles(date, place)
    const angularContacts: RelocatedChart['angularContacts'] = []
    for (const planet of positions) for (const [angle, longitude] of [['Ascendant', angles.ascendant], ['Midheaven', angles.midheaven], ['Descendant', angles.descendant], ['IC', angles.ic]] as const) {
      const orb = angularDistance(planet.longitude, longitude)
      if (orb <= 5) angularContacts.push({ planet: planet.name, angle, orb })
    }
    return { place: { ...place }, ...angles, planets: positions.map(planet => ({ ...planet, house: wholeSignHouse(planet.longitude, angles.ascendant) })), angularContacts: angularContacts.sort((a, b) => a.orb - b.orb) }
  }
  return { version: 1, sourceKey: relocationSourceKey(chart), birthUTC: date.toISOString(), calculatedAt: Date.now(), houseSystem: 'Whole sign', natal: calculate(original), destinations: places.map(calculate) }
}
export function zodiacPosition(longitude: number) {
  return `${(normalize(longitude) % 30).toFixed(1)}° ${ZODIAC_SIGNS[Math.floor(normalize(longitude) / 30)]}`
}
// Versioned interpretive heuristic, not a probability or quality-of-life score.
export function scoreRelocation(item: RelocatedChart, priority: RelocationPriority): PlaceRanking {
  const factors: Array<{ value: number; text: string }> = []
  const angles = [
    ['Ascendant', item.ascendant, 'balanced', 'self-expression'],
    ['Midheaven', item.midheaven, 'career', 'career visibility'],
    ['IC', item.ic, 'home', 'feeling settled'],
    ['Descendant', item.descendant, 'relationships', 'partnerships'],
  ] as const
  const weights: Record<string, number> = { Sun: 3, Moon: 2, Mercury: 1.5, Venus: 4, Mars: -2, Jupiter: 4, Saturn: -3, Uranus: -1.5, Neptune: -1.5, Pluto: -2 }
  const benefits: Record<string, string> = { Sun: 'confidence', Moon: 'emotional connection', Mercury: 'communication', Venus: 'cooperation and enjoyment', Jupiter: 'growth and opportunity' }
  const challenges: Record<string, string> = { Mars: 'friction or restlessness', Saturn: 'responsibility and pressure', Uranus: 'disruption and a need for freedom', Neptune: 'unclear expectations', Pluto: 'intensity and power dynamics' }
  for (const planet of item.planets) {
    for (const [angle, longitude, theme, meaning] of angles) {
      const orb = angularDistance(planet.longitude, longitude)
      const strength = Math.max(0, 1 - orb / 12)
      if (!strength) continue
      const emphasis = priority !== 'balanced' && priority === theme ? 2 : 1
      const value = (weights[planet.name] ?? 0) * strength * emphasis
      if (value) factors.push({ value, text: `${planet.name} ${orb.toFixed(1)}° from ${angle}: ${value > 0 ? `may support ${benefits[planet.name]}` : `may bring ${challenges[planet.name]}`} around ${meaning}.` })
    }
    const theme = [2, 6, 10].includes(planet.house) ? 'career' : planet.house === 4 ? 'home' : [5, 7, 11].includes(planet.house) ? 'relationships' : undefined
    if (theme && (priority === 'balanced' || priority === theme) && benefits[planet.name]) {
      factors.push({ value: 0.75, text: `${planet.name} in house ${planet.house}: ${benefits[planet.name]} may support ${theme === 'home' ? 'home life' : theme}.` })
    }
  }
  return {
    score: factors.reduce((total, factor) => total + factor.value, 0),
    reasons: factors.filter(f => f.value > 0).sort((a, b) => b.value - a.value).slice(0, 3).map(f => f.text),
    tradeoffs: factors.filter(f => f.value < 0).sort((a, b) => a.value - b.value).slice(0, 2).map(f => f.text),
  }
}
export function findTopRelocationPlaces(chart: ChartData, priority: RelocationPriority = 'balanced'): RelocationAnalysis {
  if (!['balanced', 'career', 'home', 'relationships'].includes(priority)) throw new Error('Choose a supported relocation priority.')
  const report = calculateCandidates(chart, RELOCATION_CITIES)
  report.destinations = report.destinations.map(item => ({ ...item, ranking: scoreRelocation(item, priority) }))
    .sort((a, b) => b.ranking.score - a.ranking.score || a.place.name.localeCompare(b.place.name, 'en')).slice(0, 5)
  report.search = { method: 'worldwide-v1', priority, candidateCount: RELOCATION_CITIES.length }
  return report
}
export const RELOCATION_COUNTRIES = [...new Set(RELOCATION_CITIES.map(place => place.country!).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'en'))
export function defaultDomesticCountry(chart: ChartData): string {
  const suffix = chart.location.split(',').at(-1)?.trim().toLowerCase()
  const aliases: Record<string, string> = { usa: 'United States of America', us: 'United States of America', 'united states': 'United States of America', uk: 'United Kingdom' }
  return RELOCATION_COUNTRIES.find(country => country.toLowerCase() === suffix) || aliases[suffix || ''] || ''
}
export function findCombinedRelocationPlaces(chart: ChartData, priority: RelocationPriority, domesticCountry: string): RelocationAnalysis {
  if (!RELOCATION_COUNTRIES.includes(domesticCountry)) throw new Error('Choose the country to use for domestic places.')
  if (!['balanced', 'career', 'home', 'relationships'].includes(priority)) throw new Error('Choose a supported relocation priority.')
  const domestic = RELOCATION_CITIES.filter(place => place.country === domesticCountry)
  if (domestic.length < 5) throw new Error(`The city list contains only ${domestic.length} supported places in ${domesticCountry}. Five domestic suggestions are not available. You can compare places manually instead.`)
  const report = calculateCandidates(chart, RELOCATION_CITIES)
  const ranked = report.destinations.map(item => ({ ...item, ranking: scoreRelocation(item, priority) }))
  const compare = (a: typeof ranked[number], b: typeof ranked[number]) => b.ranking.score - a.ranking.score || a.place.name.localeCompare(b.place.name, 'en') || a.place.latitude - b.place.latitude || a.place.longitude - b.place.longitude
  ranked.sort(compare)
  report.destinations = [...ranked.filter(item => item.place.country === domesticCountry).slice(0, 5), ...ranked.filter(item => item.place.country !== domesticCountry).slice(0, 5)].sort(compare)
  report.search = { method: 'domestic-international-v1', priority, candidateCount: RELOCATION_CITIES.length, domesticCountry }
  return report
}
export function relocationCategory(report: RelocationAnalysis, place: RelocationPlace): string {
  return report.search?.domesticCountry ? (place.country === report.search.domesticCountry ? 'Domestic' : 'International') : ''
}
export function relocationRankingText(report: RelocationAnalysis): string {
  if (!report.search) return ''
  const selection = report.search.domesticCountry ? `Five domestic places in ${report.search.domesticCountry} and five international places, combined in descending chart-score order` : 'Top five'
  return `${selection} from ${report.search.candidateCount} worldwide candidate cities, priority: ${report.search.priority}. Ranked by an interpretive chart heuristic, not a scientific livability measure or an exhaustive search of every place. Angular factors use a 12° range; highlighted close contacts elsewhere use 5°.\n${report.destinations.map((item, i) => `${i + 1}. ${item.place.name}${relocationCategory(report, item.place) ? ` (${relocationCategory(report, item.place)})` : ''}\n${item.ranking?.reasons.join(' ') || 'Limited supportive signals in this scoring method.'}\nTradeoffs: ${item.ranking?.tradeoffs.join(' ') || 'No close challenging angular factors in this scoring method; this does not imply a difficulty-free location.'}`).join('\n\n')}`
}
export function relocationFacts(report: RelocationAnalysis): string {
  const describe = (item: RelocatedChart) => `${item.place.name} (${item.place.latitude}, ${item.place.longitude}): Ascendant ${zodiacPosition(item.ascendant)}, Midheaven ${zodiacPosition(item.midheaven)}, IC ${zodiacPosition(item.ic)}. Whole-sign houses: ${item.planets.map(p => `${p.name} H${p.house}`).join(', ')}. Ecliptic conjunctions within 5° of an angle: ${item.angularContacts.map(c => `${c.planet} at ${c.angle}, orb ${c.orb.toFixed(2)}°`).join('; ') || 'none'}.`
  return `${relocationRankingText(report)}\nRelocated chart comparison at the SAME birth instant: ${report.birthUTC}. Tropical zodiac, whole-sign houses; geocentric planetary positions recalculated consistently for this comparison. Planetary longitudes stay fixed across locations. This is not a world astrocartography map or a city quality-of-life assessment.\nBirthplace baseline: ${describe(report.natal)}\n${report.destinations.map(describe).join('\n')}`
}
export function relocationPrompt(report: RelocationAnalysis, name: string, focus: string) {
  return `Write a plain-language relocation comparison for ${name}. Focus: ${focus || 'Career, home life, and relationships'}.\n${relocationFacts(report)}\nCompare ONLY the selected destinations with each other and the birthplace. When a ranking is supplied, keep its order and domestic/international labels; briefly cover every listed destination. Do not rerank the list or replace places. Explain career themes using the Midheaven, 10th and 6th houses; home themes using the IC, Moon and 4th house; relationship themes using the Descendant and 7th house. Mention strengths and tradeoffs, including challenging themes where relevant. Name which of the compared places may better support each priority, with a clear reason tied to the supplied placements. If the evidence is mixed, say so rather than declaring a winner. Do not invent planetary lines, distances to lines, additional places, jobs available, living costs, climate, or factual city qualities. Astrological suitability is interpretive, not a guarantee or instruction to move. Include practical next steps such as checking jobs, budget, and support networks. Return 500-700 words of ordinary text with short paragraphs and unnumbered subheadings, not JSON. Do not add a signature.`
}

export function relocationExportText(report: RelocationAnalysis): string {
  const summary = report.search
    ? relocationRankingText(report)
    : report.destinations.map((item, i) => `${i + 1}. ${item.place.name}`).join('\n')
  return `## RELOCATION ANALYSIS\n${summary}${report.interpretation ? `\n\n### Relocation comparison\n${report.interpretation}` : '\n\nGenerate a plain-language comparison in the Relocation tab for a fuller interpretation.'}`
}
