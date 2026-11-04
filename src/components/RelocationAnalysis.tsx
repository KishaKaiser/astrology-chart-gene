import { CAREER_THEMES, ENVIRONMENT_LABELS, DEFAULT_RELOCATION_PREFERENCES, sectionOnePreferences, type RelocationPreferences } from '@/lib/relocation-preferences'
import { useEffect, useRef, useState } from 'react'
import type { ChartData } from '@/lib/astrology-types'
import { useKV } from '@/hooks/use-kv'
import { calculateRelocation, findDomesticRelocationPlaces, RELOCATION_COUNTRIES, DEFAULT_RELOCATION_FILTERS, type RelocationFilters, relocationOverview, retainRelocationComparison, type RelocationPriority, currentRelocation, relocationPrompt, relocationSourceKey, validateRelocationPlace, type RelocationAnalysis as Report, type RelocationPlace } from '@/lib/relocation'
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
  const [domesticCountry, setDomesticCountry] = useState(report?.search?.domesticCountry || '')
  const [filters, setFilters] = useState<RelocationFilters>(report?.search?.filters ?? DEFAULT_RELOCATION_FILTERS)
  const [preferences, setPreferences] = useState<RelocationPreferences>(report?.search?.preferences ?? { ...DEFAULT_RELOCATION_PREFERENCES, ...sectionOnePreferences(chart.interpretation || '') })
  const [currentHome, setCurrentHome] = useState<RelocationPlace | undefined>(report?.currentResidence?.place)
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
      return current.map(item => item.id === chart.id ? { ...item, relocationAnalysis: retainRelocationComparison(next, currentRelocation(item)), updatedAt: Date.now() } : item)
    })
  }
  const addPlace = () => {
    try {
      if (places.length >= 10) throw new Error('Compare up to ten places at a time.')
      if (!latitude.trim() || !longitude.trim()) throw new Error('Select a search result or enter latitude and longitude.')
      const place = { name: name.trim(), latitude: Number(latitude), longitude: Number(longitude) }
      validateRelocationPlace(place)
      if (places.some(p => Math.abs(p.latitude - place.latitude) < 0.0001 && Math.abs(p.longitude - place.longitude) < 0.0001)) throw new Error('This location is already in the list.')
      setPlaces(current => [...current, place]); setName(''); setLatitude(''); setLongitude(''); setError('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not add this place') }
  }
  const calculate = () => {
    try { const next = calculateRelocation(chart, places); if (currentHome) next.currentResidence = calculateRelocation(chart, [currentHome]).destinations[0]; persist(next); setError(''); toast.success('Relocation charts calculated. Check shared-library save status.') }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not calculate relocation charts') }
  }
  const findPlaces = () => {
    try {
      const next = findDomesticRelocationPlaces(chart, priority, domesticCountry, filters, currentHome, preferences)
      persist(next)
      setPlaces(next.destinations.map(item => item.place))
      setError('')
      toast.success(`${next.destinations.length} domestic places ranked. Check shared-library save status.`)
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
  const settingsChanged = report?.search && (report.search.method !== 'domestic-preferences-v1' || JSON.stringify(report.search.preferences) !== JSON.stringify(preferences) || report.search.priority !== priority || report.search.domesticCountry !== domesticCountry || JSON.stringify(report.search.filters) !== JSON.stringify(filters) || JSON.stringify(report.currentResidence?.place) !== JSON.stringify(currentHome))
  return <div className="space-y-5 rounded-lg border border-border bg-card p-5 text-foreground">
    <h2 className="text-xl font-semibold">Relocation analysis</h2>
    <p className="text-sm text-muted-foreground">Compare up to ten places at your original birth moment. Find up to ten domestic places based on your career and living-environment preferences, ranked best first, or compare your own choices. Accurate birth time matters.</p>
    {chart.relocationAnalysis && !report && <p role="alert" className="text-amber-300">The saved comparison uses different birth details. Recalculate it before using it in a reading or PDF.</p>}
    <details open={!report} className="rounded border p-4"><summary className="cursor-pointer font-semibold">Search preferences</summary>
    <fieldset disabled={busy} className="mt-3 space-y-3">
      <h3 className="font-semibold">Find your top 10 places to live</h3>
      <Label>Current home city (optional comparison reference)</Label>
      <LocationSearch value={currentHome?.name || ''} onLocationSelect={place => setCurrentHome({name: place.name, latitude: place.latitude, longitude: place.longitude})} />
      {currentHome && <div className="flex items-center gap-3 text-sm"><span>{currentHome.name}</span><Button variant="outline" size="sm" onClick={() => setCurrentHome(undefined)}>Clear current home</Button></div>}
      <p className="text-sm text-muted-foreground">The birthplace keeps the natal chart anchored to the original birth moment. It does not give nearby destinations a ranking bonus. Current home is a separate comparison reference; it does not replace birth details or favor destinations near your home.</p>
      <Label htmlFor="relocation-country">Current home / domestic country</Label>
      <select id="relocation-country" className="block w-full rounded border border-input bg-background p-2 text-foreground" value={domesticCountry} onChange={e => setDomesticCountry(e.target.value)}>
        <option value="">Choose your domestic country</option>
        {RELOCATION_COUNTRIES.map(country => <option key={country} value={country}>{country}</option>)}
      </select>
      <p className="text-sm text-muted-foreground">Choose the country you consider home. All suggestions will be within this country, sorted by the weighted score, best first. If fewer than ten places qualify, only those matches are shown.</p>
      <div className="space-y-3 rounded border p-4">
        <h3 className="font-semibold">Use your section 1 recommendations</h3>
        <Button variant="outline" onClick={() => {
          const notes = sectionOnePreferences(chart.interpretation || '')
          if (!notes.careerNotes && !notes.environmentNotes) { setError('Section 1 recommendations were not found. Generate section 1 or enter your preferences below.'); return }
          setPreferences(current => ({...current,...notes})); setError('')
        }}>Copy recommendations from section 1</Button>
        <Label htmlFor="relocation-career-notes">Careers &amp; Jobs To Explore</Label>
        <textarea id="relocation-career-notes" className="block w-full rounded border border-input bg-background p-2 text-foreground" rows={4} maxLength={6000} value={preferences.careerNotes} onChange={e => setPreferences({...preferences,careerNotes:e.target.value})} />
        <Label htmlFor="relocation-career-theme">Career theme to prioritize</Label>
        <select id="relocation-career-theme" className="block w-full rounded border border-input bg-background p-2 text-foreground" value={preferences.careerTheme} onChange={e => setPreferences({...preferences,careerTheme:e.target.value as RelocationPreferences['careerTheme']})}>
          {Object.entries(CAREER_THEMES).map(([key,theme]) => <option key={key} value={key}>{theme.label}</option>)}
        </select>
        <Label htmlFor="relocation-environment-notes">Places &amp; Living Environments That May Suit You</Label>
        <textarea id="relocation-environment-notes" className="block w-full rounded border border-input bg-background p-2 text-foreground" rows={4} maxLength={6000} value={preferences.environmentNotes} onChange={e => setPreferences({...preferences,environmentNotes:e.target.value})} />
        <Label htmlFor="relocation-environment">Living environment to include</Label>
        <select id="relocation-environment" className="block w-full rounded border border-input bg-background p-2 text-foreground" value={preferences.environment} onChange={e => setPreferences({...preferences,environment:e.target.value as RelocationPreferences['environment']})}>
          {Object.entries(ENVIRONMENT_LABELS).map(([key,label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <p className="text-sm text-muted-foreground">Choose the theme and environment that fit your recommendations. The career theme affects the astrology portion of the score; the environment filters population size and uses the urban-access limits below. Notes guide the optional written comparison. This does not verify local careers, climate, amenities or job openings.</p>
      </div>
      <Label htmlFor="relocation-priority">Ranking priority</Label>
      <select id="relocation-priority" className="block w-full rounded border border-input bg-background p-2 text-foreground" value={priority} onChange={e => setPriority(e.target.value as RelocationPriority)}>
        <option value="balanced">Overall balance</option><option value="career">Career and work</option><option value="home">Home and emotional comfort</option><option value="relationships">Relationships and connection</option>
      </select>
      <div className="grid gap-3 md:grid-cols-2">
        <div><Label htmlFor="relocation-min-pop">Minimum city population estimate</Label><Input id="relocation-min-pop" type="number" min="10000" step="1000" value={filters.minimumPopulation} onChange={e => setFilters({...filters, minimumPopulation: Number(e.target.value)})} /></div>
        <div><Label htmlFor="relocation-max-pop">Maximum population (0 = no limit)</Label><Input id="relocation-max-pop" type="number" min="0" step="1000" value={filters.maximumPopulation} onChange={e => setFilters({...filters, maximumPopulation: Number(e.target.value)})} /></div>
        <div><Label htmlFor="relocation-hub-distance">Maximum distance to a major city (km)</Label><Input id="relocation-hub-distance" type="number" min="1" max="1000" value={filters.maximumHubDistanceKm} onChange={e => setFilters({...filters, maximumHubDistanceKm: Number(e.target.value)})} /></div>
      </div>
      <label className="flex gap-2 items-center"><input type="checkbox" checked={filters.includeNearbyTowns} onChange={e => setFilters({...filters, includeNearbyTowns: e.target.checked})} />Also include smaller places near a major city</label>
      {filters.includeNearbyTowns && <div className="grid gap-3 md:grid-cols-2">
        <div><Label htmlFor="relocation-near-pop">Minimum smaller-place population</Label><Input id="relocation-near-pop" type="number" min="10000" value={filters.nearbyMinimumPopulation} onChange={e => setFilters({...filters, nearbyMinimumPopulation: Number(e.target.value)})} /></div>
        <div><Label htmlFor="relocation-near-km">Smaller-place distance limit (km)</Label><Input id="relocation-near-km" type="number" min="1" max="200" value={filters.nearbyDistanceKm} onChange={e => setFilters({...filters, nearbyDistanceKm: Number(e.target.value)})} /></div>
      </div>}
      <Label htmlFor="relocation-exclude">Exclude domestic states / regions (comma-separated)</Label>
      <Input id="relocation-exclude" placeholder="For example: Alaska, Hawaii" value={filters.excludedRegions.join(',')} onChange={e => setFilters({...filters, excludedRegions: e.target.value.split(',')})} />
      <p className="text-sm text-muted-foreground">Use full region names. Major city means an estimated population of at least 250,000. Distances are straight-line within the same country, not travel distances. Population estimates may describe metropolitan areas and are not current census counts.</p>
      <p className="text-sm text-muted-foreground">Search a built-in worldwide city list using your birth chart. Results replace the saved comparison below. No AI or internet connection is needed for the ranking.</p>
      <Button onClick={findPlaces} disabled={!domesticCountry}>Find my top domestic places</Button>
    </fieldset></details>
    <details className="rounded border p-4"><summary className="cursor-pointer font-semibold">Compare places manually</summary>
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
      <Button onClick={addPlace} disabled={places.length >= 10}>Add place</Button>
      {places.map((place, index) => <div key={`${place.latitude}:${place.longitude}`} className="flex items-center justify-between gap-3 rounded border p-3"><span>{place.name} ({place.latitude.toFixed(4)}, {place.longitude.toFixed(4)})</span><Button variant="outline" size="sm" onClick={() => setPlaces(current => current.filter((_, i) => i !== index))}>Remove</Button></div>)}
      <Button onClick={calculate} disabled={!places.length}>{report ? 'Recalculate selected places' : 'Calculate selected places'}</Button>
    </fieldset></details>
    {error && <p role="alert" className="text-red-300">{error}</p>}
    {settingsChanged && <p className="text-amber-300 text-sm">The saved results use earlier settings or an older search method. Run Find my top domestic places to apply your section 1 preferences and domestic-only search.</p>}
    {changed && <p className="text-amber-300 text-sm">The list has changed. Recalculate to replace the saved comparison below.</p>}
    {report && <>
      {report.interpretation && <section><h3 className="mb-2 text-lg font-semibold">Relocation comparison</h3><div className="whitespace-pre-wrap leading-relaxed">{report.interpretation}</div></section>}
      {!report.search && <section><h3 className="text-lg font-semibold">Your selected places</h3>{report.destinations.map(item => <div key={item.place.name} className="mt-3"><h4 className="font-semibold">{item.place.name}</h4></div>)}</section>}
      {report.search && <section className="space-y-3">
        <h3 className="text-lg font-semibold">Your top {report.destinations.length} suggested places</h3>
        <p className="text-sm text-muted-foreground">{relocationOverview(report)}</p>
        <ol className="space-y-3">{report.destinations.map((item, i) => <li key={item.place.name} className="rounded border p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2"><h4 className="font-semibold">{i + 1}. {item.place.name}</h4>
            {item.ranking && <span className="text-sm">Score {item.ranking.score.toFixed(1)}{item.ranking.components && '/100'}</span>}</div>
        </li>)}</ol>
      </section>}

      <Label htmlFor="relocation-focus">What matters most to you?</Label>
      <Input id="relocation-focus" value={focus} onChange={e => setFocus(e.target.value)} disabled={busy} />
      <InterpretationModelSelector value={model} onChange={setModel} disabled={busy} lastModel={lastModel || report.model || ''} />
      <Button onClick={() => void interpret()} disabled={busy || Boolean(changed) || Boolean(settingsChanged)}>{busy ? 'Comparing places…' : 'Generate plain-language comparison'}</Button>
      <p className="text-sm text-muted-foreground">These are astrological interpretations, not guarantees about a place. Compare real jobs, cost of living, and your support network before deciding. Regenerate section 1 after calculating places to include them in the chart summary.</p>
    </>}
  </div>
}
