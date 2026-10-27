import assert from 'node:assert/strict'
import { build } from 'esbuild'

// Bundle the production TypeScript modules without creating build artifacts.
const bundle = await build({
  stdin: {
    contents: `export { birthTimeToUTC } from './src/lib/birth-time';
      export { generateChartData } from './src/lib/astrology-calc';
      export { TEST_LOCATIONS } from './src/lib/timezone-test-cases';`,
    resolveDir: process.cwd(), loader: 'ts'
  },
  bundle: true, platform: 'node', format: 'esm', write: false
})
const { birthTimeToUTC, generateChartData, TEST_LOCATIONS } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
)

for (const zone of ['UTC', 'America/New_York', 'Asia/Tokyo']) {
  process.env.TZ = zone
  for (const test of TEST_LOCATIONS) {
    assert.equal(birthTimeToUTC(test.date, test.time, test.timezone).toISOString(), test.expectedUTC, test.name)
  }
}

for (const [date, time, zone, expected] of [
  ['1977-09-01', '17:00', 'America/Indiana/Indianapolis', '1977-09-01T22:00:00.000Z'],
  ['2024-01-01', '00:15', '+05:30', '2023-12-31T18:45:00.000Z'],
  ['2024-02-29', '23:45', '-05:00', '2024-03-01T04:45:00.000Z'],
  ['2024-03-10', '01:30', 'America/New_York', '2024-03-10T06:30:00.000Z'],
  ['2024-03-10', '03:30', 'America/New_York', '2024-03-10T07:30:00.000Z'],
  ['2024-11-03', '01:30', '-04:00', '2024-11-03T05:30:00.000Z'],
  ['2024-11-03', '01:30', '-05:00', '2024-11-03T06:30:00.000Z']
]) {
  assert.equal(birthTimeToUTC(date, time, zone).toISOString(), expected)
}
assert.throws(() => birthTimeToUTC('2024-03-10', '02:30', 'America/New_York'), /does not exist/)
assert.throws(() => birthTimeToUTC('2024-11-03', '01:30', 'America/New_York'), /occurs twice/)
assert.throws(() => birthTimeToUTC('2023-02-29', '12:00', '+00:00'), /Invalid calendar/)
assert.throws(() => birthTimeToUTC('2024-01-01', '12:00', '+05:99'), /Invalid timezone/)
assert.throws(() => birthTimeToUTC('2024-01-01', '12:00', 'Invalid/Zone'), RangeError)

const originalLog = console.log
try {
  console.log = () => {}
  for (const test of TEST_LOCATIONS) {
    const chart = await generateChartData(test.name, test.date, test.time, test.location, test.latitude, test.longitude, test.timezone)
    assert.equal(chart.planets.length, 10, test.name)
    assert.equal(chart.houses.length, 12, test.name)
    assert.ok(chart.planets.every(p => Number.isFinite(p.longitude)), test.name)
    originalLog(`PASS: ${test.name} UTC conversion and chart generation`)
  }
} finally {
  console.log = originalLog
}
console.log('Passed all 10 chart tests, 30 cross-timezone checks, and 12 boundary/validation checks.')
