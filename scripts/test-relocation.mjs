import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { jsPDF } from 'jspdf'
import { writeFile } from 'node:fs/promises'
import { EquatorFromVector, RotateVector, Rotation_ECT_EQD, VectorFromSphere, Observer, Horizon, SiderealTime } from 'astronomy-engine'
const bundle = await build({ entryPoints: ['src/lib/relocation.ts'], bundle: true, write: false, format: 'esm', platform: 'node' })
const { calculateRelocation, currentRelocation, relocationAngles, angularDistance, wholeSignHouse, relocationFacts, relocationPrompt, relocationExportText } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const chart = { id:'fixture', name:'Sample', date:'1998-08-04', time:'12:00', timezone:'America/New_York', latitude:40.7128, longitude:-74.006, location:'New York', planets:[], houses:[], aspects:[], createdAt:0, updatedAt:0 }
const places = [{ name:'London', latitude:51.5074, longitude:-0.1278 }, { name:'Sydney', latitude:-33.8688, longitude:151.2093 }, { name:'New York', latitude:40.7128, longitude:-74.006 }]
const before = JSON.stringify(chart)
const report = calculateRelocation(chart, places)
assert.equal(report.birthUTC, '1998-08-04T16:00:00.000Z')
assert.equal(JSON.stringify(chart), before, 'calculations must not modify the natal chart')
assert.deepEqual(report.destinations[2], report.natal, 'same birthplace must give the same angles and houses')
for (const item of report.destinations) {
  assert.deepEqual(item.planets.map(p => p.longitude), report.natal.planets.map(p => p.longitude))
  assert.ok(item.planets.every(p => p.house >= 1 && p.house <= 12))
  assert.ok(item.angularContacts.every(c => c.orb <= 5 && c.orb >= 0))
  assert.ok(Math.abs(angularDistance(item.ascendant, item.descendant) - 180) < 1e-8)
  assert.ok(Math.abs(angularDistance(item.midheaven, item.ic) - 180) < 1e-8)
  const date = new Date(report.birthUTC)
  // Independently transform the claimed Ascendant from ecliptic coordinates
  // into equatorial/horizon coordinates using Astronomy Engine's rotations.
  const vector = VectorFromSphere({ lat:0, lon:item.ascendant, dist:1 }, date)
  const eq = EquatorFromVector(RotateVector(Rotation_ECT_EQD(date), vector))
  const horizon = Horizon(date, new Observer(item.place.latitude, item.place.longitude, 0), eq.ra, eq.dec)
  assert.ok(Math.abs(horizon.altitude) < 0.001, `${item.place.name}: Ascendant lies on horizon`)
  assert.ok(horizon.azimuth > 0 && horizon.azimuth < 180, `${item.place.name}: Ascendant is rising in the east`)
  const mc = EquatorFromVector(RotateVector(Rotation_ECT_EQD(date), VectorFromSphere({lat:0,lon:item.midheaven,dist:1},date)))
  assert.ok(angularDistance(mc.ra*15, SiderealTime(date)*15+item.place.longitude) < 0.001, 'MC lies on upper meridian')
}
assert.notEqual(report.destinations[0].ascendant, report.destinations[1].ascendant)
assert.equal(wholeSignHouse(359, 0), 12)
assert.equal(wholeSignHouse(0, 359), 2)
assert.equal(wholeSignHouse(15, 29), 1)
assert.throws(() => calculateRelocation(chart, []), /one and five/)
assert.throws(() => calculateRelocation(chart, Array(6).fill(places[0])), /one and five/)
assert.throws(() => relocationAngles(new Date(), {name:'Invalid',latitude:NaN,longitude:0}), /latitude/)
assert.throws(() => relocationAngles(new Date(), {name:'Polar',latitude:70,longitude:0}), /Polar/)
assert.throws(() => calculateRelocation(chart, [{name:'Bad',latitude:0,longitude:181}]), /Longitude/)
assert.throws(() => calculateRelocation({...chart,date:'2024-11-03',time:'01:30'},places), /occurs twice/)
assert.throws(() => calculateRelocation({...chart,date:'2024-03-10',time:'02:30'},places), /does not exist/)
const saved = {...chart,relocationAnalysis:report}
assert.equal(currentRelocation(saved), report)
assert.equal(currentRelocation({...saved,time:'12:01'}), undefined)
assert.equal(currentRelocation({...saved,latitude:41}), undefined)
assert.equal(currentRelocation({...saved,interpretation:'New reading'}), report)
const originalTZ = process.env.TZ
try {
  process.env.TZ = 'Pacific/Auckland'
  const elsewhere = calculateRelocation(chart,places)
  assert.deepEqual(elsewhere.destinations,report.destinations)
  assert.equal(elsewhere.birthUTC,report.birthUTC)
} finally { if(originalTZ === undefined) delete process.env.TZ; else process.env.TZ=originalTZ }
const facts = relocationFacts(report)
assert.ok(facts.includes('London') && facts.includes(report.birthUTC) && facts.includes('Whole-sign'))
const prompt = relocationPrompt(report,chart.name,'Career')
assert.ok(prompt.includes(facts) && prompt.includes('Do not invent planetary lines'))
const exported = relocationExportText({...report,interpretation:'Saved comparison'})
assert.ok(exported.includes('London') && exported.includes('Sydney') && exported.includes('Saved comparison'))
const pdfBundle = await build({ entryPoints: ['src/lib/pdf-interpretation.ts'], bundle: true, write: false, format: 'esm', platform: 'node', define: { 'import.meta.env.BASE_URL': '"/"' } })
const { renderInterpretation } = await import(`data:text/javascript;base64,${Buffer.from(pdfBundle.outputFiles[0].text).toString('base64')}`)
const pdf = new jsPDF()
const pdfReport = { ...report, destinations: report.destinations.slice(0, 2), interpretation: 'Layout sample: compare the calculated house placements and angle contacts above. This text is for export testing, not a personalized recommendation.' }
const layout = renderInterpretation(pdf, relocationExportText(pdfReport), 25)
assert.equal(pdf.getNumberOfPages(), 5, 'report introduction, birthplace, two places, and comparison each begin on their own page')
assert.ok(layout.placements.every(line => line.y >= 25 && line.y < 273))
assert.equal(currentRelocation(JSON.parse(JSON.stringify(saved))).birthUTC, report.birthUTC, 'saved report survives serialization')
if (process.argv[2]) {
  const pages = pdf.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i); pdf.setFillColor(245,245,250); pdf.rect(0,282,210,15,'F')
    pdf.setFont('helvetica','normal'); pdf.setFontSize(8); pdf.setTextColor(100,100,100)
    pdf.text('Relocation layout test - sample birth details',20,289)
    pdf.text(`Page ${i} of ${pages}`,190,289,{align:'right'})
  }
  await writeFile(process.argv[2], new Uint8Array(pdf.output('arraybuffer')))
}
console.log('PASS: fixed birth instant, independent horizon/meridian checks, identical-location result, constant planetary positions, house wrapping, input validation, stale data, timezone independence, and report facts')
