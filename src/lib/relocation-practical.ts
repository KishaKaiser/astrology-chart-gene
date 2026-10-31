import type { PlaceRanking, RelocationPlace } from './relocation'

export interface RelocationFilters {
  minimumPopulation: number
  includeNearbyTowns: boolean
  nearbyMinimumPopulation: number
  nearbyDistanceKm: number
  maximumHubDistanceKm: number
  maximumPopulation: number // zero means no upper limit
  excludedRegions: string[] // exact region names within the domestic country
}
export const DEFAULT_RELOCATION_FILTERS: RelocationFilters = {
  minimumPopulation: 100000, includeNearbyTowns: true, nearbyMinimumPopulation: 25000,
  nearbyDistanceKm: 50, maximumHubDistanceKm: 100, maximumPopulation: 0, excludedRegions: [],
}
export function distanceKm(a: RelocationPlace, b: RelocationPlace): number {
  const radians = Math.PI / 180
  const lat = (b.latitude - a.latitude) * radians
  const lon = (b.longitude - a.longitude) * radians
  const h = Math.sin(lat / 2) ** 2 + Math.cos(a.latitude * radians) * Math.cos(b.latitude * radians) * Math.sin(lon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))))
}
const accessCache = new WeakMap<RelocationPlace[], Map<string, { nearestHubKm: number; nearbyCenters: number }>>()
export function urbanAccess(place: RelocationPlace, cities: RelocationPlace[]) {
  let cache = accessCache.get(cities)
  if (!cache) { cache = new Map(); accessCache.set(cities, cache) }
  const key = JSON.stringify([place.name, place.country, place.latitude, place.longitude])
  const cached = cache.get(key)
  if (cached) return cached
  let nearestHubKm = Infinity
  let nearbyCenters = 0
  // Same-country straight-line distances do not establish road/ferry access.
  for (const city of cities) {
    if (!place.country || city.country !== place.country || (city.population ?? 0) < 50000) continue
    const distance = distanceKm(place, city)
    if ((city.population ?? 0) >= 250000) nearestHubKm = Math.min(nearestHubKm, distance)
    if (distance <= 100 && distance > 1) nearbyCenters++
  }
  const result = { nearestHubKm, nearbyCenters }
  cache.set(key, result)
  return result
}
export function validateFilters(filters: RelocationFilters) {
  const numbers = [filters.minimumPopulation, filters.nearbyMinimumPopulation, filters.nearbyDistanceKm, filters.maximumHubDistanceKm, filters.maximumPopulation]
  if (numbers.some(n => !Number.isFinite(n) || n < 0) || filters.minimumPopulation < 10000 || filters.nearbyMinimumPopulation < 10000 || filters.nearbyMinimumPopulation > filters.minimumPopulation || filters.nearbyDistanceKm < 1 || filters.nearbyDistanceKm > 200 || filters.maximumHubDistanceKm < 1 || filters.maximumHubDistanceKm > 1000 || (filters.maximumPopulation > 0 && filters.maximumPopulation < filters.minimumPopulation) || typeof filters.includeNearbyTowns !== 'boolean' || !Array.isArray(filters.excludedRegions) || filters.excludedRegions.some(r => typeof r !== 'string')) {
    throw new Error('Check the population and distance filters. Nearby-town minimum must not exceed the city minimum; distances must be 1–200 km for towns and 1–1,000 km for urban access.')
  }
}
export function practicalCandidates(cities: RelocationPlace[], domesticCountry: string, filters: RelocationFilters): RelocationPlace[] {
  validateFilters(filters)
  const excluded = new Set(filters.excludedRegions.map(r => r.trim().toLowerCase()).filter(Boolean))
  const knownRegions = new Set(cities.filter(place => place.country === domesticCountry).map(place => place.region?.toLowerCase()))
  for (const region of excluded) if (!knownRegions.has(region)) throw new Error(`Region "${region}" was not found in ${domesticCountry}. Use a full region name from the city list.`)
  return cities.filter(place => {
    const population = place.population
    if (!Number.isFinite(population) || !population || population < Math.min(filters.minimumPopulation, filters.nearbyMinimumPopulation)) return false
    if (filters.maximumPopulation && population > filters.maximumPopulation) return false
    if (place.country === domesticCountry && excluded.has((place.region || '').toLowerCase())) return false
    const access = urbanAccess(place, cities)
    if (access.nearestHubKm > filters.maximumHubDistanceKm) return false
    return population >= filters.minimumPopulation || (filters.includeNearbyTowns && population >= filters.nearbyMinimumPopulation && access.nearestHubKm <= filters.nearbyDistanceKm)
  })
}
const clamp = (value: number) => Math.max(0, Math.min(100, value))
export function weightedRanking(place: RelocationPlace, astrology: PlaceRanking, cities: RelocationPlace[]): PlaceRanking {
  const access = urbanAccess(place, cities)
  const components = {
    astrology: clamp(50 + 50 * Math.tanh(astrology.score / 12)),
    // Proxy only: 70% proximity to a 250k urban hub, 30% nearby 50k centers.
    livability: clamp(70 * Math.max(0, 1 - access.nearestHubKm / 200) + 30 * Math.min(1, access.nearbyCenters / 4)),
    regionalImportance: place.worldCity || place.regionalRole === 'national' ? 100 : place.regionalRole === 'regional' ? 75 : 25,
    population: clamp(100 * Math.log10(Math.max(10000, place.population ?? 0) / 10000) / Math.log10(500)),
  }
  return { ...astrology, score: components.astrology * .60 + components.livability * .25 + components.regionalImportance * .10 + components.population * .05, components, urbanAccess: access,
    reasons: [...astrology.reasons, `Urban-access estimate: ${Math.round(access.nearestHubKm)} km straight-line to a same-country urban hub of at least 250,000 people; ${access.nearbyCenters} other urban centers within 100 km. Population estimate: ${place.population?.toLocaleString('en-US')}.`],
    tradeoffs: [...astrology.tradeoffs, 'Population and urban proximity are historical geographic proxies, not verified hospitals, transport routes, housing affordability, safety, or available jobs.'],
  }
}
