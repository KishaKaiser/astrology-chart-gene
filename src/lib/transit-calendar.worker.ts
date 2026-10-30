import { calculateUpcomingTransits } from './upcoming-transits'
self.onmessage = (event: MessageEvent<string>) => {
  try { self.postMessage({ calendar: calculateUpcomingTransits(new Date(event.data)) }) }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : 'Could not calculate upcoming transits' }) }
}
