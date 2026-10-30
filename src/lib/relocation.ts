import { Body, MakeTime, SiderealTime, e_tilt, GeoVector, Ecliptic } from 'astronomy-engine'
import { birthTimeToUTC } from './birth-time'
import { ZODIAC_SIGNS, type ChartData } from './astrology-types'

export interface RelocationPlace { name: string; latitude: number; longitude: number }
export interface RelocatedChart {
  place: RelocationPlace
  ascendant: number
  midheaven: number
  descendant: number
  ic: number
  planets: Array<{ name: string; longitude: number; house: number }>
  angularContacts: Array<{ planet: string; angle: 'Ascendant' | 'Midheaven' | 'Descendant' | 'IC'; orb: number }>
}
export interface RelocationAnalysis {
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
  if (!places.length || places.length > 5) throw new Error('Compare between one and five places.')
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
export function relocationFacts(report: RelocationAnalysis): string {
  const describe = (item: RelocatedChart) => `${item.place.name} (${item.place.latitude}, ${item.place.longitude}): Ascendant ${zodiacPosition(item.ascendant)}, Midheaven ${zodiacPosition(item.midheaven)}, IC ${zodiacPosition(item.ic)}. Whole-sign houses: ${item.planets.map(p => `${p.name} H${p.house}`).join(', ')}. Ecliptic conjunctions within 5° of an angle: ${item.angularContacts.map(c => `${c.planet} at ${c.angle}, orb ${c.orb.toFixed(2)}°`).join('; ') || 'none'}.`
  return `Relocated chart comparison at the SAME birth instant: ${report.birthUTC}. Tropical zodiac, whole-sign houses; geocentric planetary positions recalculated consistently for this comparison. Planetary longitudes stay fixed across locations. This is not a world astrocartography map or a city quality-of-life assessment.\nBirthplace baseline: ${describe(report.natal)}\n${report.destinations.map(describe).join('\n')}`
}
export function relocationPrompt(report: RelocationAnalysis, name: string, focus: string) {
  return `Write a plain-language relocation comparison for ${name}. Focus: ${focus || 'Career, home life, and relationships'}.\n${relocationFacts(report)}\nCompare ONLY the selected destinations with each other and the birthplace. Explain career themes using the Midheaven, 10th and 6th houses; home themes using the IC, Moon and 4th house; relationship themes using the Descendant and 7th house. Mention strengths and tradeoffs, including challenging themes where relevant. Name which of the compared places may better support each priority, with a clear reason tied to the supplied placements. If the evidence is mixed, say so rather than declaring a winner. Do not invent planetary lines, distances to lines, additional places, jobs available, living costs, climate, or factual city qualities. Astrological suitability is interpretive, not a guarantee or instruction to move. Include practical next steps such as checking jobs, budget, and support networks. Return 500-700 words of ordinary text with short paragraphs and unnumbered subheadings, not JSON. Do not add a signature.`
}

export function relocationExportText(report: RelocationAnalysis): string {
  const places = [report.natal, ...report.destinations].map((item, i) => `## ${i === 0 ? 'Birthplace baseline' : 'Relocated chart'}: ${item.place.name}\nCoordinates: ${item.place.latitude}, ${item.place.longitude}\nAscendant: ${zodiacPosition(item.ascendant)}\nMidheaven: ${zodiacPosition(item.midheaven)}\nDescendant: ${zodiacPosition(item.descendant)}\nIC: ${zodiacPosition(item.ic)}\n\n${item.planets.map(p => `${p.name}: ${zodiacPosition(p.longitude)}, whole-sign house ${p.house}`).join('\n')}\n\nAngle contacts within 5 degrees: ${item.angularContacts.map(c => `${c.planet} near ${c.angle} (${c.orb.toFixed(2)} degrees)`).join('; ') || 'none'}.`)
  return `## RELOCATION ANALYSIS\nBirth instant (UTC): ${report.birthUTC}\nTropical zodiac and whole-sign houses, calculated consistently for all places at the same birth instant. This comparison is independent of the original chart's house system. It is not a world astrocartography map. Location suitability is interpretive, not a guarantee.\n\n${places.join('\n\n')}${report.interpretation ? `\n\n## RELOCATION COMPARISON\n${report.interpretation}` : ''}`
}
