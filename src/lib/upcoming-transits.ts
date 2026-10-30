import { Body, Ecliptic, GeoVector, SearchMoonPhase, SearchGlobalSolarEclipse, SearchLunarEclipse } from 'astronomy-engine'

const DAY = 86400000
const STEP = DAY / 4
const MINUTE = 60000
const BODIES = [Body.Sun, Body.Mercury, Body.Venus, Body.Mars, Body.Jupiter, Body.Saturn, Body.Uranus, Body.Neptune, Body.Pluto]
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
const ASPECTS = [[0, 'conjunct'], [60, 'sextile'], [90, 'square'], [120, 'trine'], [180, 'opposite'], [240, 'trine'], [270, 'square'], [300, 'sextile']] as const
export type TransitKind = 'retrograde' | 'ingress' | 'aspect' | 'moon' | 'eclipse'
export interface UpcomingTransit {
  id: string
  title: string
  kind: TransitKind
  start: string
  end: string
  exact: string[]
  startsBeforeRange: boolean
  endsAfterRange: boolean
  description: string
}
export interface TransitCalendar { start: string; end: string; events: UpcomingTransit[] }
export const signedAngle = (angle: number) => ((angle + 180) % 360 + 360) % 360 - 180
export function sixMonthsFrom(date: Date): Date {
  const result = new Date(date)
  const day = result.getUTCDate()
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() + 6)
  const last = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()
  result.setUTCDate(Math.min(day, last))
  return result
}
function boundary(a: number, b: number, test: (time: number) => boolean) {
  const first = test(a)
  while (b - a > MINUTE) { const mid = (a + b) / 2; if (test(mid) === first) a = mid; else b = mid }
  return Math.round((a + b) / 2)
}

// Return only the portion of an active interval inside the requested window.
// The flags ensure clipped boundaries are never presented as actual stations.
export function activeIntervals(times: number[], active: (time: number) => boolean) {
  const result: Array<{ start: number; end: number; startsBeforeRange: boolean; endsAfterRange: boolean }> = []
  let inside = active(times[0])
  let start = times[0]
  let clipped = inside
  for (let i = 1; i < times.length; i++) {
    const next = active(times[i])
    if (next !== inside) {
      const crossing = boundary(times[i - 1], times[i], active)
      if (next) { start = crossing; clipped = false }
      else result.push({ start, end: crossing, startsBeforeRange: clipped, endsAfterRange: false })
    }
    inside = next
  }
  if (inside) result.push({ start, end: times[times.length - 1], startsBeforeRange: clipped, endsAfterRange: true })
  return result
}

export function calculateUpcomingTransits(now = new Date()): TransitCalendar {
  if (!Number.isFinite(now.getTime())) throw new Error('Invalid calendar start date')
  const start = now.getTime()
  const end = sixMonthsFrom(now).getTime()
  const times = [start]
  while (times[times.length - 1] < end) times.push(Math.min(end, times[times.length - 1] + STEP))
  const cache = new Map<string, number>()
  const longitude = (body: Body, time: number) => {
    const key = `${body}:${time}`
    if (!cache.has(key)) cache.set(key, Ecliptic(GeoVector(body, new Date(time), true)).elon)
    return cache.get(key)!
  }
  const events: UpcomingTransit[] = []
  const add = (kind: TransitKind, title: string, a: number, b: number, description: string, exact: number[] = [], startsBeforeRange = false, endsAfterRange = false) => {
    events.push({ id: `${kind}:${title}:${Math.round(a / MINUTE)}`, kind, title, start: new Date(a).toISOString(), end: new Date(b).toISOString(), exact: exact.map(t => new Date(t).toISOString()), startsBeforeRange, endsAfterRange, description })
  }
  for (const body of BODIES) {
    if (body !== Body.Sun) {
      const backwards = (t: number) => signedAngle(longitude(body, t + DAY / 8) - longitude(body, t - DAY / 8)) < 0
      for (const period of activeIntervals(times, backwards)) add('retrograde', `${body} retrograde`, period.start, period.end, 'Apparent geocentric retrograde motion, from the retrograde station to the direct station. Shadow periods are not included.', [], period.startsBeforeRange, period.endsAfterRange)
    }
    for (let i = 1; i < times.length; i++) {
      const previous = Math.floor(longitude(body, times[i - 1]) / 30)
      const next = Math.floor(longitude(body, times[i]) / 30)
      if (previous !== next) {
        const t = boundary(times[i - 1], times[i], t => Math.floor(longitude(body, t) / 30) === previous)
        const retrograde = signedAngle(longitude(body, times[i]) - longitude(body, times[i - 1])) < 0
        add('ingress', `${body} ${retrograde ? 'returns to' : 'enters'} ${SIGNS[next]}`, t, t, 'Exact tropical zodiac sign change; this is an event time, not the full duration in the sign.', [t])
      }
    }
  }
  for (let a = 0; a < BODIES.length; a++) for (let b = a + 1; b < BODIES.length; b++) {
    for (const [angle, name] of ASPECTS) {
      const offset = (t: number) => signedAngle(longitude(BODIES[a], t) - longitude(BODIES[b], t) - angle)
      for (const period of activeIntervals(times, t => Math.abs(offset(t)) <= 1)) {
        const exact: number[] = []
        const samples = [period.start, ...times.filter(t => t > period.start && t < period.end), period.end]
        for (let i = 1; i < samples.length; i++) {
          const x = offset(samples[i - 1]); const y = offset(samples[i])
          if (x * y <= 0 && Math.abs(x - y) < 180) {
            const t = x === 0 ? samples[i - 1] : y === 0 ? samples[i] : boundary(samples[i - 1], samples[i], t => offset(t) < 0)
            if (!exact.some(previous => Math.abs(t - previous) < MINUTE * 2)) exact.push(t)
          }
        }
        add('aspect', `${BODIES[a]} ${name} ${BODIES[b]}`, period.start, period.end, 'Active while within a 1° orb of the major aspect, using tropical geocentric longitude. Exact contacts are listed separately; an active interval can turn away without becoming exact.', exact, period.startsBeforeRange, period.endsAfterRange)
      }
    }
  }
  for (const phase of [0, 180]) {
    let cursor = new Date(start)
    while (true) {
      const found = SearchMoonPhase(phase, cursor, 40)
      if (!found || found.date.getTime() > end) break
      const t = found.date.getTime()
      const sign = SIGNS[Math.floor(longitude(Body.Moon, t) / 30)]
      add('moon', `${phase === 0 ? 'New' : 'Full'} Moon in ${sign}`, t, t, 'Exact lunar phase time. No multi-day influence window is assumed.', [t])
      cursor = new Date(t + DAY)
    }
  }
  for (const solar of [true, false]) {
    let cursor = new Date(start)
    while (true) {
      const eclipse = solar ? SearchGlobalSolarEclipse(cursor) : SearchLunarEclipse(cursor)
      const t = eclipse.peak.date.getTime()
      if (t > end) break
      add('eclipse', `${eclipse.kind} ${solar ? 'solar' : 'lunar'} eclipse`, t, t, 'Global eclipse peak. Visibility depends on location; the date does not imply it is visible from your home.', [t])
      cursor = new Date(t + DAY)
    }
  }
  // An eclipse replaces the matching ordinary lunation to avoid duplicate topics.
  const eclipseTimes = events.filter(e => e.kind === 'eclipse').map(e => Date.parse(e.start))
  return { start: now.toISOString(), end: new Date(end).toISOString(), events: events.filter(e => e.kind !== 'moon' || !eclipseTimes.some(t => Math.abs(t - Date.parse(e.start)) < DAY)).sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title)) }
}
