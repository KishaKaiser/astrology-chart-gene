import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { jsPDF } from 'jspdf'
import { writeFile } from 'node:fs/promises'
import { EquatorFromVector, RotateVector, Rotation_ECT_EQD, VectorFromSphere, Observer, Horizon, SiderealTime } from 'astronomy-engine'
const bundle = await build({ entryPoints: ['src/lib/relocation.ts'], bundle: true, write: false, format: 'esm', platform: 'node' })
const { findDomesticRelocationPlaces, defaultDomesticCountry, relocationCategory, findTopRelocationPlaces, scoreRelocation, calculateRelocation, currentRelocation, relocationAngles, angularDistance, wholeSignHouse, relocationFacts, relocationPrompt, relocationExportText, retainRelocationComparison, generateRelocationComparison, comparisonText } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
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
assert.ok(prompt.includes('London') && !prompt.includes(facts) && prompt.includes('Do not invent planetary lines'))
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
assert.ok(relocationExportText(top).includes('1. '+top.destinations[0].place.name))
assert.ok(!relocationExportText(top).includes('Generate a plain-language comparison'))
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
  const combined = findDomesticRelocationPlaces(chart, 'balanced', country)
  assert.equal(combined.destinations.length,10)
  assert.equal(combined.destinations.filter(d => d.place.country === country).length,10)
  assert.equal(combined.destinations.filter(d => d.place.country !== country).length,0)
  assert.equal(new Set(combined.destinations.map(d=>d.place.name)).size,10)
  assert.equal(combined.search.method,'domestic-preferences-v1')
  assert.ok(combined.destinations.every(d=>d.place.population>=25000 && d.ranking.components && d.ranking.score>=0 && d.ranking.score<=100))
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
assert.throws(()=>findDomesticRelocationPlaces(chart,'balanced',''),/Choose the country/)
assert.throws(()=>findDomesticRelocationPlaces(chart,'balanced','United States of America',{minimumPopulation:999999999,nearbyMinimumPopulation:999999999,includeNearbyTowns:false,nearbyDistanceKm:50,maximumHubDistanceKm:100,maximumPopulation:0,excludedRegions:[]}),/No domestic places match/)
console.log('PASS: domestic-only results, sorted 1–10, selectable country, insufficient coverage, manual comparison, saved metadata, prompts and PDF bounds')

const practicalBundle = await build({entryPoints:['src/lib/relocation-practical.ts'],bundle:true,write:false,format:'esm',platform:'node'})
const {practicalCandidates,weightedRanking,urbanAccess,DEFAULT_RELOCATION_FILTERS:defaults,distanceKm} = await import(`data:text/javascript;base64,${Buffer.from(practicalBundle.outputFiles[0].text).toString('base64')}`)
const hub={name:'Hub',country:'Test',region:'Central',latitude:0,longitude:0,population:500000,regionalRole:'regional'}
const suburb={...hub,name:'Nearby town',longitude:0.2,population:30000,regionalRole:'other'}
const village={...suburb,name:'Village',population:2000}
const remote={...suburb,name:'Remote town',longitude:10,population:40000}
const unknown={...hub,name:'Missing population',population:undefined}
const sample=[hub,suburb,village,remote,unknown]
assert.deepEqual(practicalCandidates(sample,'Test',defaults).map(p=>p.name),['Hub','Nearby town'])
assert.deepEqual(practicalCandidates(sample,'Test',{...defaults,includeNearbyTowns:false}).map(p=>p.name),['Hub'])
assert.equal(practicalCandidates(sample,'Test',{...defaults,excludedRegions:['Central']}).length,0)
assert.throws(()=>practicalCandidates(sample,'Test',{...defaults,excludedRegions:['Typo']}),/not found/)
assert.throws(()=>practicalCandidates(sample,'Test',{...defaults,minimumPopulation:NaN}),/Check the population/)
assert.throws(()=>practicalCandidates(sample,'Test',{...defaults,maximumPopulation:50000}),/Check the population/)
assert.ok(distanceKm(hub,suburb)>20 && distanceKm(hub,suburb)<25)
assert.equal(urbanAccess(suburb,[{...hub,country:'Other'},suburb]).nearestHubKm,Infinity,'foreign hub cannot satisfy domestic urban access')
const scored=weightedRanking(hub,{score:0,reasons:[],tradeoffs:[]},sample)
assert.equal(scored.components.astrology,50)
assert.equal(scored.components.regionalImportance,75)
assert.equal(scored.score,.6*scored.components.astrology+.25*scored.components.livability+.1*scored.components.regionalImportance+.05*scored.components.population)
assert.ok(weightedRanking(hub,{score:10,reasons:[],tradeoffs:[]},sample).score>scored.score)
const candidates=practicalCandidates(RELOCATION_CITIES,'United States of America',defaults)
const oracle=[]
for(let i=0;i<candidates.length;i+=10) for(const item of calculateRelocation(chart,candidates.slice(i,i+10)).destinations) oracle.push({...item,ranking:weightedRanking(item.place,scoreRelocation(item,'balanced'),RELOCATION_CITIES)})
const sort=(a,b)=>b.ranking.score-a.ranking.score || a.place.name.localeCompare(b.place.name,'en') || a.place.latitude-b.place.latitude || a.place.longitude-b.place.longitude
oracle.sort(sort)
const expected=oracle.filter(d=>d.place.country==='United States of America').slice(0,10)
const practical=findDomesticRelocationPlaces(chart,'balanced','United States of America',defaults)
assert.deepEqual(practical.destinations.map(d=>d.place.name),expected.map(d=>d.place.name))
const home={name:'Current home',latitude:33.75,longitude:-84.39}
const withHome=findDomesticRelocationPlaces(chart,'balanced','United States of America',defaults,home)
assert.deepEqual(withHome.destinations,practical.destinations,'current home is a reference, not a birth-data change or geographic ranking bias')
assert.deepEqual(withHome.natal,practical.natal)
assert.equal(withHome.currentResidence.place.name,home.name)
assert.ok(relocationFacts(withHome).includes('Current residence comparison: Current home'))
assert.ok(!relocationExportText(withHome).includes('60% astrology'))
const noAlaska=findDomesticRelocationPlaces(chart,'balanced','United States of America',{...defaults,excludedRegions:['Alaska']})
assert.ok(noAlaska.destinations.every(d=>d.place.country!=='United States of America'||d.place.region!=='Alaska'))
assert.equal(JSON.parse(JSON.stringify(withHome)).search.filters.includeNearbyTowns,true)
console.log('PASS: weighted formula, normalized components, city + nearby-town filters, remote/missing-data exclusions, region exclusions, independent weighted top-ten oracle and current-home reference')

const preferencesBundle=await build({entryPoints:['src/lib/relocation-preferences.ts'],bundle:true,write:false,format:'esm',platform:'node'})
const {sectionOnePreferences,DEFAULT_RELOCATION_PREFERENCES:prefDefaults,careerThemeBonus,matchesEnvironment}=await import(`data:text/javascript;base64,${Buffer.from(preferencesBundle.outputFiles[0].text).toString('base64')}`)
const sectionText='## 1. PRACTICAL GUIDANCE & INTEGRATION\n### Careers & Jobs To Explore\nTeaching and writing.\n\n### Places & Living Environments That May Suit You\nA mid-sized city.\n\nWith warmth and best wishes,\nThe Psychic Link\n\n## 2. CHART OVERVIEW & DOMINANT THEMES\nNot part of preferences.'
assert.deepEqual(sectionOnePreferences(sectionText),{careerNotes:'Teaching and writing.',environmentNotes:'A mid-sized city.'})
assert.deepEqual(sectionOnePreferences(sectionText.replaceAll(' & ',' and ')),sectionOnePreferences(sectionText))
assert.deepEqual(sectionOnePreferences(''),{careerNotes:'',environmentNotes:''})
const pref={...prefDefaults,...sectionOnePreferences(sectionText),careerTheme:'communication',environment:'mid-sized'}
const preferred=findDomesticRelocationPlaces(chart,'balanced','United States of America',defaults,home,pref)
assert.ok(preferred.destinations.every(d=>d.place.country==='United States of America' && d.place.population>=100000 && d.place.population<500000))
assert.ok(preferred.destinations.every(d=>d.ranking.reasons[0].includes('Teaching, writing')))
assert.deepEqual(preferred.search.preferences,pref)
assert.ok(relocationPrompt(preferred,chart.name,'').includes('Teaching and writing.'))
assert.ok(relocationExportText(preferred).includes('Living-environment filter: Mid-sized'))
assert.ok(!relocationExportText(preferred).includes('(International)'))
const themeFixture={...report.natal,midheaven:90,planets:[{name:'Mercury',longitude:90,house:10},{name:'Jupiter',longitude:90,house:10}]}
assert.equal(careerThemeBonus(themeFixture,'communication'),4)
assert.equal(careerThemeBonus(themeFixture,'general'),0)
assert.ok(!matchesEnvironment(99999,'mid-sized') && matchesEnvironment(100000,'mid-sized') && !matchesEnvironment(500000,'mid-sized'))
assert.throws(()=>findDomesticRelocationPlaces(chart,'balanced','United States of America',defaults,home,{...pref,careerTheme:'unknown'}),/Choose valid/)
const fewCountries=[...new Set(RELOCATION_CITIES.map(c=>c.country))]
const fewCountry=fewCountries.find(country=>{const count=practicalCandidates(RELOCATION_CITIES,country,defaults).filter(c=>c.country===country).length;return count>0&&count<10})
const few=findDomesticRelocationPlaces(chart,'balanced',fewCountry,defaults)
assert.ok(few.destinations.length>0&&few.destinations.length<10)
assert.ok(few.destinations.every(d=>d.place.country===fewCountry),'short domestic list is never filled with international cities')
console.log('PASS: section 1 extraction, editable preference snapshots, career-theme weighting, environment boundaries, domestic-only exports and fewer-than-ten behavior')

const spiritual=findDomesticRelocationPlaces(chart,'balanced','United States of America',defaults,home,{...prefDefaults,careerTheme:'spiritual'})
assert.equal(spiritual.search.preferences.careerTheme,'spiritual')
assert.ok(spiritual.destinations.every(d=>d.ranking.reasons[0].includes('Spiritual, intuitive and psychic services')))
assert.ok(relocationExportText(spiritual).includes('Spiritual, intuitive and psychic services'))
assert.ok(relocationPrompt(spiritual,chart.name,'').includes('not confirmed psychic abilities'))
console.log('PASS: spiritual-career option persists and carries through ranking, prompt and export')

const readable=relocationExportText(withHome)
assert.equal((readable.match(/historical metro-area estimates/g)||[]).length,0)
assert.ok(!readable.includes('Components (0–100)') && !readable.includes('Tradeoffs:') && !readable.includes('Coordinates:'))
assert.ok(relocationFacts(withHome).includes('Components (0–100)'), 'technical facts are retained for generation')
console.log('PASS: score-only list and no generation instructions in the exported report')

const written = '## 2. Home life\nThe generated home paragraph.\n\n## 1. Work\nThe generated work paragraph.'
const generated = {...withHome, interpretation:written, model:'example'}
const repeated = retainRelocationComparison({...withHome,calculatedAt:withHome.calculatedAt+1},generated)
assert.equal(repeated.interpretation,written)
assert.equal(retainRelocationComparison(noAlaska,generated).interpretation,undefined)
const savedReport=currentRelocation(JSON.parse(JSON.stringify({...chart,relocationAnalysis:repeated})))
const rendered=renderInterpretation(new jsPDF(),relocationExportText(savedReport),25,'relocation').placements.map(p=>p.text).join('\n')
assert.ok(rendered.includes('The generated home paragraph.') && rendered.includes('The generated work paragraph.'))
assert.ok(rendered.indexOf('2. Home life')<rendered.indexOf('1. Work'))
assert.ok(rendered.includes(savedReport.destinations[0].ranking.score.toFixed(1)+'/100'))
assert.doesNotMatch(rendered,/Ascendant|Final score =|Generate a plain-language comparison/)
console.log('PASS: saved AI comparison survives identical search, stays in original order and appears with city scores in the PDF renderer')

let checkpoint=withHome
const calls=[]
const makeCityText=i=>`Generated paragraph for place ${i+1}. This paragraph compares home and work themes in ordinary language.`
const saveCheckpoint=async (next,previous)=>{assert.deepEqual(previous,checkpoint); checkpoint=JSON.parse(JSON.stringify(next))}
await assert.rejects(generateRelocationComparison(checkpoint,chart.name,'Work','test-model',async prompt=>{
  const i=calls.length;calls.push(prompt);if(i===2)throw new TypeError('Failed to fetch');return {text:makeCityText(i),model:'test-model'}
},saveCheckpoint,()=>{}),/Failed to fetch/)
assert.equal(checkpoint.comparisonDraft.paragraphs.length,2)
assert.ok(relocationExportText(checkpoint).includes('Partial comparison (2 of 10 places)'))
await generateRelocationComparison(checkpoint,chart.name,'Work','test-model',async prompt=>{
  const i=calls.length-1;assert.ok(prompt.includes(`about ${withHome.destinations[i].place.name} for`));calls.push(prompt);return {text:makeCityText(i),model:'test-model'}
},saveCheckpoint,()=>{})
assert.equal(checkpoint.comparisonDraft,undefined)
assert.equal(checkpoint.model,'test-model')
assert.ok(calls.every(prompt=>prompt.length<4000),'short prompts exclude the full ten-city report')
const resumedPDF=renderInterpretation(new jsPDF(),relocationExportText(checkpoint),25,'relocation').placements.map(p=>p.text).join(' ')
for(let i=0;i<10;i++) assert.ok(resumedPDF.includes(`Generated paragraph for place ${i+1}.`))
assert.equal(comparisonText({...checkpoint,comparisonDraft:{focus:'new',requestedModel:'new',paragraphs:['partial replacement']}}),checkpoint.interpretation)
console.log('PASS: failed request preserves partial export, restart resumes at the failed city, final PDF contains all generated paragraphs')

// Using the birthplace in the calculations must never give it a recommendation slot.
const firstPlace=practical.destinations[0].place
const bornInWinner={...chart,location:firstPlace.name,latitude:firstPlace.latitude+0.01,longitude:firstPlace.longitude}
const withoutBirthplace=findDomesticRelocationPlaces(bornInWinner,'balanced','United States of America',defaults,firstPlace)
assert.equal(withoutBirthplace.destinations.length,10)
assert.ok(!withoutBirthplace.destinations.some(d=>d.place.name===firstPlace.name))
assert.deepEqual(withoutBirthplace.destinations.map(d=>d.place.name),oracle.filter(d=>d.place.country==='United States of America' && d.place.name!==firstPlace.name).slice(0,10).map(d=>d.place.name))
assert.equal(withoutBirthplace.natal.place.name,firstPlace.name)
assert.ok(!relocationPrompt(withoutBirthplace,chart.name,'').includes(firstPlace.name))
assert.ok(!relocationExportText(withoutBirthplace).includes(firstPlace.name))
console.log('PASS: birthplace excluded before ranking, ten replacement candidates, reference city excluded from generated city headings and PDF list')
