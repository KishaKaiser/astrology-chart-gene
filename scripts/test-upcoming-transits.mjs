import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { Body, Ecliptic, GeoVector, Seasons } from 'astronomy-engine'

const bundle = await build({ entryPoints: ['src/lib/upcoming-transits.ts'], bundle: true, write: false, format: 'esm', platform: 'node' })
const { calculateUpcomingTransits, sixMonthsFrom, activeIntervals, signedAngle } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
assert.equal(sixMonthsFrom(new Date('2026-08-31T15:00:00Z')).toISOString(), '2027-02-28T15:00:00.000Z')
assert.equal(sixMonthsFrom(new Date('2023-08-31T15:00:00Z')).toISOString(), '2024-02-29T15:00:00.000Z')
assert.equal(signedAngle(359 - 1), -2)
assert.equal(signedAngle(1 - 359), 2)
const hour = 3600000
const intervals = activeIntervals([0, 6*hour, 12*hour, 18*hour, 24*hour], t => t < 4*hour || t > 15*hour)
assert.equal(intervals.length, 2)
assert.ok(intervals[0].startsBeforeRange && !intervals[0].endsAfterRange)
assert.ok(!intervals[1].startsBeforeRange && intervals[1].endsAfterRange)
assert.ok(Math.abs(intervals[0].end - 4*hour) < 60000)
assert.ok(Math.abs(intervals[1].start - 15*hour) < 60000)
const calendar = calculateUpcomingTransits(new Date('2026-10-30T12:00:00Z'))
assert.equal(calendar.end, '2027-04-30T12:00:00.000Z')
assert.equal(new Set(calendar.events.map(e => e.id)).size, calendar.events.length)
assert.ok(calendar.events.length > 50)
for (const kind of ['retrograde','ingress','aspect','moon','eclipse']) assert.ok(calendar.events.some(e => e.kind === kind))
for (const e of calendar.events) {
  assert.ok(e.start >= calendar.start && e.end <= calendar.end && e.start <= e.end)
  assert.ok(e.exact.every(t => t >= e.start && t <= e.end))
  if (e.startsBeforeRange) assert.equal(e.start, calendar.start)
  if (e.endsAfterRange) assert.equal(e.end, calendar.end)
}
const mercury = calendar.events.find(e => e.title === 'Mercury retrograde')
assert.ok(mercury.startsBeforeRange, 'retrogrades already underway must be included')
assert.equal(mercury.end.slice(0, 10), '2026-11-13')
const longitude = (body, t) => Ecliptic(GeoVector(body, new Date(t), true)).elon
for (const e of calendar.events.filter(e => e.kind === 'aspect')) {
  const [a, name, b] = e.title.split(' ')
  const target = {conjunct:0,sextile:60,square:90,trine:120,opposite:180}[name]
  for (const time of e.exact) {
    const separation = Math.abs(signedAngle(longitude(a, time) - longitude(b, time)))
    assert.ok(Math.abs(separation - target) < 0.01, `${e.title} must be at the claimed angle`)
  }
}
const equinox = calendar.events.find(e => e.title === 'Sun enters Aries')
assert.ok(Math.abs(Date.parse(equinox.start) - Seasons(2027).mar_equinox.date.getTime()) < 10*60000)
// NASA catalogs: Feb 6 2027 annular solar and Feb 20 2027 penumbral lunar eclipse.
// Catalog greatest-eclipse times use dynamical time; allow ten minutes vs UTC.
const solar = calendar.events.find(e => e.title === 'annular solar eclipse')
const lunar = calendar.events.find(e => e.title === 'penumbral lunar eclipse')
assert.ok(Math.abs(Date.parse(solar.start) - Date.parse('2027-02-06T16:00:48Z')) < 10*60000)
assert.ok(Math.abs(Date.parse(lunar.start) - Date.parse('2027-02-20T23:14:06Z')) < 10*60000)
assert.ok(!calendar.events.some(e => e.kind === 'moon' && Math.abs(Date.parse(e.start)-Date.parse(solar.start)) < 86400000))
const originalTZ = process.env.TZ
try {
  for (const tz of ['America/New_York', 'Pacific/Auckland']) {
    process.env.TZ = tz
    assert.deepEqual(calculateUpcomingTransits(new Date(calendar.start)), calendar)
  }
} finally { if (originalTZ === undefined) delete process.env.TZ; else process.env.TZ = originalTZ }
assert.throws(() => calculateUpcomingTransits(new Date('invalid')), /Invalid/)
console.log(`PASS: ${calendar.events.length} computed events, date boundaries, ongoing transits, aspect contacts, eclipse references, equinox, and timezone independence`)
