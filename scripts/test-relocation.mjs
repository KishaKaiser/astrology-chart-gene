import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { jsPDF } from 'jspdf'
import { writeFile } from 'node:fs/promises'
import { EquatorFromVector, RotateVector, Rotation_ECT_EQD, VectorFromSphere, Observer, Horizon, SiderealTime } from 'astronomy-engine'
const bundle = await build({ entryPoints: ['src/lib/relocation.ts'], bundle: true, write: false, format: 'esm', platform: 'node' })
const { findCombinedRelocationPlaces, defaultDomesticCountry, relocationCategory, findTopRelocationPlaces, scoreRelocation, calculateRelocation, currentRelocation, relocationAngles, angularDistance, wholeSignHouse, relocationFacts, relocationPrompt, relocationExportText } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
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
assert.throws(() => calculateRelocation(chart, []), /one and ten/)
assert.throws(() => calculateRelocation(chart, Array(11).fill(places[0])), /one and ten/)
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
assert.equal(pdf.getNumberOfPages(), 1, 'analysis-only export excludes separate birthplace and destination chart pages')
assert.ok(!exported.includes('Birthplace baseline') && !exported.includes('Coordinates:') && !exported.includes('whole-sign house'))
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

const citiesBundle = await build({ entryPoints: ['src/lib/relocation-cities.ts'], bundle: true, write: false, format: 'esm', platform: 'node' })
const { RELOCATION_CITIES } = await import(`data:text/javascript;base64,${Buffer.from(citiesBundle.outputFiles[0].text).toString('base64')}`)
assert.ok(RELOCATION_CITIES.length > 200)
assert.equal(new Set(RELOCATION_CITIES.map(p => p.name)).size, RELOCATION_CITIES.length)
for (const city of ['Tokyo', 'London', 'New York', 'Sydney', 'Cape Town', 'Buenos Aires']) assert.ok(RELOCATION_CITIES.some(p => p.name.startsWith(city)), city)
const top = findTopRelocationPlaces(chart)
assert.equal(top.destinations.length, 5)
assert.equal(top.search.candidateCount, RELOCATION_CITIES.length)
assert.equal(top.search.priority, 'balanced')
assert.deepEqual(findTopRelocationPlaces(chart).destinations, top.destinations)
const exhaustive = []
for (let i=0;i<RELOCATION_CITIES.length;i+=10) {
  for (const item of calculateRelocation(chart, RELOCATION_CITIES.slice(i,i+10)).destinations) exhaustive.push({ name:item.place.name, score:scoreRelocation(item,'balanced').score })
}
exhaustive.sort((a,b) => b.score-a.score || a.name.localeCompare(b.name,'en'))
assert.deepEqual(top.destinations.map(d => d.place.name), exhaustive.slice(0,5).map(d => d.name))
for (const item of top.destinations) {
  assert.ok(Number.isFinite(item.ranking.score))
  assert.ok(item.ranking.reasons.length)
  assert.deepEqual(item.planets.map(p => p.longitude), report.natal.planets.map(p => p.longitude))
}
assert.notDeepEqual(findTopRelocationPlaces({...chart,time:'00:00'}).destinations.map(d => d.place.name), top.destinations.map(d => d.place.name))
assert.notDeepEqual(findTopRelocationPlaces(chart,'home').destinations.map(d => d.place.name), findTopRelocationPlaces(chart,'career').destinations.map(d => d.place.name))
assert.equal(calculateRelocation(chart,places).search, undefined)
assert.equal(currentRelocation({...chart,relocationAnalysis:JSON.parse(JSON.stringify(top))}).search.method,'worldwide-v1')
assert.ok(relocationFacts(top).includes('Top five from'))
assert.ok(relocationExportText(top).includes(top.destinations[0].ranking.reasons[0]))
const synthetic = {...report.natal, ascendant:0, midheaven:90, ic:270, descendant:180, planets:[{name:'Venus',longitude:90,house:10}]}
assert.equal(scoreRelocation(synthetic,'balanced').score, 4.75)
assert.equal(scoreRelocation(synthetic,'career').score, 8.75)
assert.equal(scoreRelocation({...synthetic,planets:[{name:'Saturn',longitude:90,house:10}]},'career').score,-6)
assert.equal(JSON.stringify(chart),before)
console.log('PASS: worldwide coverage, exhaustive top-five ranking, birth-time/priority sensitivity, score factors, persistence and export facts')


const rankedPDF = new jsPDF()
const rankedLayout = renderInterpretation(rankedPDF, relocationExportText(top), 25)
assert.ok(rankedLayout.placements.every(line => line.y >= 25 && line.y < 273), 'ranked report stays above the footer')
for (const destination of top.destinations) assert.ok(rankedLayout.placements.some(line => line.text.includes(destination.place.name)))
console.log('PASS: top-five PDF report includes every destination and respects page boundaries')

for (const country of ['United States of America', 'United Kingdom', 'Australia']) {
  const combined = findCombinedRelocationPlaces(chart, 'balanced', country)
  assert.equal(combined.destinations.length,10)
  assert.equal(combined.destinations.filter(d => d.place.country === country).length,5)
  assert.equal(combined.destinations.filter(d => d.place.country !== country).length,5)
  assert.equal(new Set(combined.destinations.map(d=>d.place.name)).size,10)
  const countryByName = new Map(RELOCATION_CITIES.map(p=>[p.name,p.country]))
  const expected = [...exhaustive.filter(d=>countryByName.get(d.name)===country).slice(0,5), ...exhaustive.filter(d=>countryByName.get(d.name)!==country).slice(0,5)].sort((a,b)=>b.score-a.score || a.name.localeCompare(b.name,'en'))
  assert.deepEqual(combined.destinations.map(d=>d.place.name),expected.map(d=>d.name),'five best per category, then sorted together')
  assert.ok(combined.destinations.every((d,i,all)=>i===0 || all[i-1].ranking.score>=d.ranking.score))
  assert.equal(currentRelocation(JSON.parse(JSON.stringify({...chart,relocationAnalysis:combined}))).search.domesticCountry,country)
  assert.ok(relocationFacts(combined).includes(`10. ${combined.destinations[9].place.name}`))
  assert.ok(relocationPrompt(combined,chart.name,'').includes('keep its order'))
  assert.equal(relocationCategory(combined,combined.destinations.find(d=>d.place.country===country).place),'Domestic')
  assert.equal(calculateRelocation(chart,combined.destinations.map(d=>d.place)).destinations.length,10)
  const combinedPDF = new jsPDF()
  const combinedLayout = renderInterpretation(combinedPDF, relocationExportText(combined),25)
  assert.ok(combinedLayout.placements.every(line=>line.y>=25 && line.y<273))
  for (const d of combined.destinations) assert.ok(relocationExportText(combined).includes(d.place.name))
}
assert.equal(defaultDomesticCountry({...chart,location:'New York, USA'}),'United States of America')
assert.equal(defaultDomesticCountry({...chart,location:'London, United Kingdom'}),'United Kingdom')
assert.equal(defaultDomesticCountry(chart),'','do not guess a country from incomplete location text')
assert.throws(()=>findCombinedRelocationPlaces(chart,'balanced',''),/Choose the country/)
const smallCountry = RELOCATION_CITIES.find(p=>RELOCATION_CITIES.filter(q=>q.country===p.country).length<5).country
assert.throws(()=>findCombinedRelocationPlaces(chart,'balanced',smallCountry),/Five domestic suggestions are not available/)
console.log('PASS: five domestic plus five international, globally sorted 1–10, selectable country, insufficient coverage, manual comparison, saved metadata, prompts and PDF bounds')
