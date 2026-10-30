import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { TransitCalendar, TransitKind, UpcomingTransit } from '@/lib/upcoming-transits'

const labels: Record<TransitKind, string> = { retrograde: 'Retrogrades', ingress: 'Sign changes', aspect: 'Major aspects', moon: 'New / full moons', eclipse: 'Eclipses' }
export function UpcomingTransitList({ busy, onGenerate }: { busy: boolean; onGenerate: (event: UpcomingTransit) => void }) {
  const [calendar, setCalendar] = useState<TransitCalendar | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [filter, setFilter] = useState<TransitKind | 'all'>('all')
  const [limit, setLimit] = useState(30)
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const format = (date: string) => new Date(date).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  useEffect(() => {
    setLoading(true); setError(''); setLimit(30)
    let worker: Worker | undefined
    try {
      worker = new Worker(new URL('../lib/transit-calendar.worker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = event => {
        if (event.data.error) setError(event.data.error)
        else setCalendar(event.data.calendar)
        setLoading(false); worker?.terminate()
      }
      worker.onerror = () => { setError('The transit calculator could not run. Refresh the list to try again.'); setLoading(false); worker?.terminate() }
      worker.postMessage(new Date().toISOString())
    } catch { setError('The transit calculator could not start. Refresh the page and try again.'); setLoading(false) }
    return () => worker?.terminate()
  }, [revision])
  const events = calendar?.events.filter(event => filter === 'all' || event.kind === filter) ?? []
  return <section className="space-y-4" aria-label="Upcoming transits">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h3 className="font-semibold text-white">Now through the next six months</h3>
        {calendar && <p className="text-sm text-muted-foreground">{format(calendar.start)} – {format(calendar.end)} ({zone})</p>}
      </div>
      <Button variant="outline" disabled={loading || busy} onClick={() => setRevision(value => value + 1)}>Refresh transits</Button>
    </div>
    <p className="text-sm text-muted-foreground">General sky transits, not transits to a personal natal chart. Major aspects use a 1° orb. Retrogrades exclude shadow periods. Sign changes, lunar phases, and eclipses show event times. Dates are approximate, calculated locally, and displayed in {zone}; articles use UTC. Fast lunar aspects and daily lunar sign changes are excluded.</p>
    <div className="flex flex-wrap gap-2" aria-label="Filter transit categories">
      {(['all', ...Object.keys(labels)] as Array<TransitKind | 'all'>).map(kind => <Button key={kind} size="sm" variant={filter === kind ? 'default' : 'outline'} onClick={() => { setFilter(kind); setLimit(30) }}>{kind === 'all' ? 'All' : labels[kind]}</Button>)}
    </div>
    {loading ? <p role="status">Calculating planetary positions and dates…</p> : error ? <p role="alert" className="text-red-300">{error}</p> : <>
      <p className="text-sm text-muted-foreground">{events.length} events and active periods found</p>
      {!events.length && <p>No events in this category within the selected six-month window.</p>}
      {events.slice(0, limit).map(event => <article key={event.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="font-semibold text-white">{event.title}</h4>
          <p className="text-sm text-white/90">{event.start === event.end ? format(event.start) : `${event.startsBeforeRange ? 'Already active at ' : ''}${format(event.start)} → ${event.endsAfterRange ? 'continues beyond ' : ''}${format(event.end)}`}</p>
          {event.kind === 'aspect' && <p className="text-xs text-muted-foreground">{event.exact.length ? `Exact: ${event.exact.map(format).join('; ')}` : 'Within orb; no exact contact in this window.'}</p>}
          {(event.startsBeforeRange || event.endsAfterRange) && <p className="text-xs text-muted-foreground">This period extends outside the displayed calendar; the clipped boundary is not its actual start/end.</p>}
        </div>
        <Button disabled={busy} onClick={() => onGenerate(event)}>Generate post</Button>
      </article>)}
      {events.length > limit && <Button variant="outline" onClick={() => setLimit(value => value + 30)}>Show more transits</Button>}
    </>}
  </section>
}
