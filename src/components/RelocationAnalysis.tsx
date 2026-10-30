import { useEffect, useRef, useState } from 'react'
import type { ChartData } from '@/lib/astrology-types'
import { useKV } from '@/hooks/use-kv'
import { calculateRelocation, findTopRelocationPlaces, type RelocationPriority, currentRelocation, relocationPrompt, relocationSourceKey, validateRelocationPlace, zodiacPosition, type RelocationAnalysis as Report, type RelocationPlace } from '@/lib/relocation'
import { LocationSearch } from './LocationSearch'
import { InterpretationModelSelector, readInterpretationModel } from './InterpretationModelSelector'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { llm } from '@/lib/llm'
import { toast } from 'sonner'

export function RelocationAnalysis({ chart }: { chart: ChartData }) {
  const [, setCharts] = useKV<ChartData[]>('astrology-charts', [])
  const report = currentRelocation(chart)
  const [places, setPlaces] = useState<RelocationPlace[]>(report?.destinations.map(d => d.place) ?? [])
  const [name, setName] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [priority, setPriority] = useState<RelocationPriority>(report?.search?.priority ?? 'balanced')
  const [focus, setFocus] = useState('Career, home life, and relationships')
  const [model, setModel] = useState(readInterpretationModel)
  const [lastModel, setLastModel] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  useEffect(() => { setPlaces(report?.destinations.map(d => d.place) ?? []); setError('') }, [chart.id, report?.calculatedAt])
  const persist = (next: Report, expectedCalculation?: number) => {
    setCharts(current => {
      const saved = current.find(item => item.id === chart.id)
      if (!saved || relocationSourceKey(saved) !== next.sourceKey) throw new Error('The birth details changed. Recalculate the comparison before saving.')
      if (expectedCalculation !== undefined && saved.relocationAnalysis?.calculatedAt !== expectedCalculation) throw new Error('The compared places changed. Generate the comparison again using the current results.')
      return current.map(item => item.id === chart.id ? { ...item, relocationAnalysis: next, updatedAt: Date.now() } : item)
    })
  }
  const addPlace = () => {
    try {
      if (places.length >= 5) throw new Error('Compare up to five places at a time.')
      if (!latitude.trim() || !longitude.trim()) throw new Error('Select a search result or enter latitude and longitude.')
      const place = { name: name.trim(), latitude: Number(latitude), longitude: Number(longitude) }
      validateRelocationPlace(place)
      if (places.some(p => Math.abs(p.latitude - place.latitude) < 0.0001 && Math.abs(p.longitude - place.longitude) < 0.0001)) throw new Error('This location is already in the list.')
      setPlaces(current => [...current, place]); setName(''); setLatitude(''); setLongitude(''); setError('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not add this place') }
  }
  const calculate = () => {
    try { persist(calculateRelocation(chart, places)); setError(''); toast.success('Relocation charts calculated. Check shared-library save status.') }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not calculate relocation charts') }
  }
  const findPlaces = () => {
    try {
      const next = findTopRelocationPlaces(chart, priority)
      persist(next)
      setPlaces(next.destinations.map(item => item.place))
      setError('')
      toast.success('Top five places calculated. Check shared-library save status.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not find suggested places') }
  }
  const interpret = async () => {
    if (!report || lock.current) return
    lock.current = true; setBusy(true); setError('')
    try {
      let used = ''
      const interpretation = (await llm(relocationPrompt(report, chart.name, focus), false, { model, onModelUsed: value => { used = value; setLastModel(value) } })).trim()
      if (interpretation.length < 100) throw new Error('The AI returned an incomplete comparison. Try again.')
      persist({ ...report, interpretation, model: used }, report.calculatedAt)
      toast.success('Relocation comparison generated. Regenerate section 1 to include these places in the summary.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not generate comparison') }
    finally { lock.current = false; setBusy(false) }
  }
  const changed = report && JSON.stringify(places) !== JSON.stringify(report.destinations.map(d => d.place))
  return <div className="space-y-5 rounded-lg border border-border bg-card p-5 text-foreground">
    <h2 className="text-xl font-semibold">Relocation analysis</h2>
    <p className="text-sm text-muted-foreground">Compare up to five places at your original birth moment. This independent tropical, whole-sign comparison recalculates positions consistently and leaves your natal chart unchanged. Find your top five from a worldwide city list, including international destinations, or compare your own choices. Accurate birth time matters.</p>
    {chart.relocationAnalysis && !report && <p role="alert" className="text-amber-300">The saved comparison uses different birth details. Recalculate it before using it in a reading or PDF.</p>}
    <fieldset disabled={busy} className="space-y-3 rounded border p-4">
      <h3 className="font-semibold">Find your top 5 places to live</h3>
      <Label htmlFor="relocation-priority">Ranking priority</Label>
      <select id="relocation-priority" className="block w-full rounded border border-input bg-background p-2 text-foreground" value={priority} onChange={e => setPriority(e.target.value as RelocationPriority)}>
        <option value="balanced">Overall balance</option><option value="career">Career and work</option><option value="home">Home and emotional comfort</option><option value="relationships">Relationships and connection</option>
      </select>
      <p className="text-sm text-muted-foreground">Search a built-in worldwide city list using your birth chart. Results replace the saved comparison below. No AI or internet connection is needed for the ranking.</p>
      <Button onClick={findPlaces}>Find my top 5 worldwide</Button>
    </fieldset>
    <fieldset disabled={busy} className="space-y-3">
      <h3 className="font-semibold">Or compare your own places</h3>
      <Label>Search for a city (internet required)</Label>
      <LocationSearch value={name} onLocationSelect={place => { setName(place.name); setLatitude(String(place.latitude)); setLongitude(String(place.longitude)) }} />
      <p className="text-xs text-muted-foreground">Or enter a place and coordinates manually for offline use. No destination timezone is needed.</p>
      <div className="grid gap-3 md:grid-cols-3">
        <div><Label htmlFor="relocation-name">Place name</Label><Input id="relocation-name" value={name} onChange={e => setName(e.target.value)} /></div>
        <div><Label htmlFor="relocation-lat">Latitude (north + / south −)</Label><Input id="relocation-lat" type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} /></div>
        <div><Label htmlFor="relocation-lon">Longitude (east + / west −)</Label><Input id="relocation-lon" type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} /></div>
      </div>
      <Button onClick={addPlace} disabled={places.length >= 5}>Add place</Button>
      {places.map((place, index) => <div key={`${place.latitude}:${place.longitude}`} className="flex items-center justify-between gap-3 rounded border p-3"><span>{place.name} ({place.latitude.toFixed(4)}, {place.longitude.toFixed(4)})</span><Button variant="outline" size="sm" onClick={() => setPlaces(current => current.filter((_, i) => i !== index))}>Remove</Button></div>)}
      <Button onClick={calculate} disabled={!places.length}>{report ? 'Recalculate selected places' : 'Calculate selected places'}</Button>
    </fieldset>
    {error && <p role="alert" className="text-red-300">{error}</p>}
    {changed && <p className="text-amber-300 text-sm">The list has changed. Recalculate to replace the saved comparison below.</p>}
    {report && <>
      {report.search && <section className="space-y-3">
        <h3 className="text-lg font-semibold">Your top 5 suggested places</h3>
        <p className="text-sm text-muted-foreground">Top five of {report.search.candidateCount} worldwide cities for {report.search.priority === 'balanced' ? 'overall balance' : report.search.priority}. These are chart-based suggestions within this city list, not a measured quality-of-life ranking. Changing the priority requires running the search again.</p>
        <ol className="space-y-3">{report.destinations.map((item, i) => <li key={item.place.name} className="rounded border p-4">
          <h4 className="font-semibold">{i + 1}. {item.place.name}</h4>
          <ul className="mt-2 list-disc pl-5 text-sm">{item.ranking?.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
          <p className="mt-2 text-sm text-muted-foreground">Tradeoffs: {item.ranking?.tradeoffs.join(' ') || 'No close challenging angular factors in this method. This does not mean the location is free of difficulties.'}</p>
        </li>)}</ol>
        <details className="text-sm text-muted-foreground"><summary className="cursor-pointer">How the ranking works</summary><p className="mt-2">We rank the same birth moment at each city using whole-sign houses and angular placements. Sun, Moon, Mercury, Venus and Jupiter add supportive weight; close Mars, Saturn, Uranus, Neptune and Pluto angular placements reduce the ease score. Strength fades to zero at 12 degrees from an angle. Your chosen priority doubles its corresponding angular weight and selects relevant house bonuses. This is an interpretive method, not a scientific prediction. It does not check visas, safety, cost, climate or job availability. City coordinates: Natural Earth.</p></details>
      </section>}

      <p className="text-sm text-muted-foreground">Birth instant: {report.birthUTC}. All locations use this same instant. Angle contacts use a 5° ecliptic conjunction orb. MC and IC are separate angles, not necessarily the whole-sign 10th/4th cusps.</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Place</th><th className="p-2">Ascendant</th><th className="p-2">Midheaven / career</th><th className="p-2">IC / home</th></tr></thead><tbody>{[report.natal, ...report.destinations].map((item, i) => <tr key={i} className="border-t"><td className="p-2">{item.place.name}{i === 0 ? ' (birthplace)' : ''}</td><td className="p-2">{zodiacPosition(item.ascendant)}</td><td className="p-2">{zodiacPosition(item.midheaven)}</td><td className="p-2">{zodiacPosition(item.ic)}</td></tr>)}</tbody></table></div>
      {report.destinations.map((destination, i) => <details key={i} className="rounded border p-3"><summary className="cursor-pointer font-medium">{destination.place.name}: house changes and angle contacts</summary><ul className="mt-3 space-y-1 text-sm">{destination.planets.map(p => <li key={p.name}>{p.name}: {zodiacPosition(p.longitude)}, birthplace house {report.natal.planets.find(n => n.name === p.name)?.house} → relocated house {p.house}</li>)}</ul><p className="mt-3 text-sm">{destination.angularContacts.map(c => `${c.planet} near ${c.angle} (${c.orb.toFixed(2)}°)`).join('; ') || 'No planets within 5° of an angle.'}</p></details>)}
      <Label htmlFor="relocation-focus">What matters most to you?</Label>
      <Input id="relocation-focus" value={focus} onChange={e => setFocus(e.target.value)} disabled={busy} />
      <InterpretationModelSelector value={model} onChange={setModel} disabled={busy} lastModel={lastModel || report.model || ''} />
      <Button onClick={() => void interpret()} disabled={busy || Boolean(changed)}>{busy ? 'Comparing places…' : 'Generate plain-language comparison'}</Button>
      {report.interpretation && <div className="whitespace-pre-wrap leading-relaxed">{report.interpretation}</div>}
      <p className="text-sm text-muted-foreground">These are astrological interpretations, not guarantees about a place. Compare real jobs, cost of living, and your support network before deciding. Regenerate section 1 after calculating places to include them in the chart summary.</p>
    </>}
  </div>
}
