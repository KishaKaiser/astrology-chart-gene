import { ChartData, Planet as PlanetInfo, House, Aspect, TransitData, TransitAspect, ZODIAC_SIGNS, ASPECT_TYPES } from './astrology-types'
import { SwissEphemeris } from '@swisseph/browser'
import { Planet, HouseSystem } from '@swisseph/core'

let swissEph: SwissEphemeris | null = null

async function getSwissEph(): Promise<SwissEphemeris> {
  if (swissEph) return swissEph
  
  swissEph = new SwissEphemeris()
  await swissEph.init()
  
  return swissEph
}

function normalizeAngle(angle: number): number {
  angle = angle % 360
  if (angle < 0) angle += 360
  return angle
}

function getZodiacSign(longitude: number): string {
  const signIndex = Math.floor(longitude / 30)
  return ZODIAC_SIGNS[signIndex]
}

function getDegreeInSign(longitude: number): number {
  return longitude % 30
}

function calculateHouseForPlanet(planetLong: number, houses: House[]): number {
  for (let i = 0; i < houses.length; i++) {
    const currentHouse = houses[i]
    const nextHouse = houses[(i + 1) % 12]
    
    const start = currentHouse.cusp
    let end = nextHouse.cusp
    
    if (end < start) {
      if (planetLong >= start || planetLong < end) {
        return currentHouse.number
      }
    } else {
      if (planetLong >= start && planetLong < end) {
        return currentHouse.number
      }
    }
  }
  
  return 1
}

function calculateAspects(planets: PlanetInfo[]): Aspect[] {
  const aspects: Aspect[] = []
  
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i]
      const planet2 = planets[j]
      
      let angle = Math.abs(planet1.longitude - planet2.longitude)
      if (angle > 180) angle = 360 - angle
      
      for (const [, aspectData] of Object.entries(ASPECT_TYPES)) {
        const diff = Math.abs(angle - aspectData.angle)
        if (diff <= aspectData.orb) {
          aspects.push({
            planet1: planet1.name,
            planet2: planet2.name,
            type: aspectData.name,
            orb: diff,
            angle: aspectData.angle,
            color: aspectData.color
          })
        }
      }
    }
  }
  
  return aspects
}

const PLANET_MAP: Record<string, Planet> = {
  'Sun': Planet.Sun,
  'Moon': Planet.Moon,
  'Mercury': Planet.Mercury,
  'Venus': Planet.Venus,
  'Mars': Planet.Mars,
  'Jupiter': Planet.Jupiter,
  'Saturn': Planet.Saturn,
  'Uranus': Planet.Uranus,
  'Neptune': Planet.Neptune,
  'Pluto': Planet.Pluto
}

export async function generateChartData(
  name: string,
  date: string,
  time: string,
  location: string,
  latitude: number,
  longitude: number,
  timezone: string,
  notes?: string
): Promise<ChartData> {
  const swe = await getSwissEph()
  
  const dateTime = new Date(`${date}T${time}:00${timezone}`)
  const jd = swe.dateToJulianDay(dateTime)
  
  const houseData = swe.calculateHouses(jd, latitude, longitude, HouseSystem.Placidus)
  
  const houses: House[] = houseData.cusps.slice(1, 13).map((cusp: number, index: number) => ({
    number: index + 1,
    cusp: normalizeAngle(cusp),
    sign: getZodiacSign(normalizeAngle(cusp))
  }))
  
  const ascendant = normalizeAngle(houseData.ascendant)
  const midheaven = normalizeAngle(houseData.mc)
  
  const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
  const planets: PlanetInfo[] = []
  
  for (const planetName of planetNames) {
    const planetId = PLANET_MAP[planetName]
    const position = swe.calculatePosition(jd, planetId)
    
    const planetLong = normalizeAngle(position.longitude)
    const sign = getZodiacSign(planetLong)
    const degree = getDegreeInSign(planetLong)
    const house = calculateHouseForPlanet(planetLong, houses)
    
    planets.push({
      name: planetName,
      symbol: planetName,
      longitude: planetLong,
      sign,
      degree,
      house
    })
  }
  
  const aspects = calculateAspects(planets)
  
  return {
    id: `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    date,
    time,
    location,
    latitude,
    longitude,
    timezone,
    notes,
    planets,
    houses,
    aspects,
    ascendant,
    midheaven,
    houseSystem: 'Placidus',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

function calculateTransitAspects(transitPlanets: PlanetInfo[], natalPlanets: PlanetInfo[]): TransitAspect[] {
  const transitAspects: TransitAspect[] = []
  
  for (const transitPlanet of transitPlanets) {
    for (const natalPlanet of natalPlanets) {
      let angle = Math.abs(transitPlanet.longitude - natalPlanet.longitude)
      if (angle > 180) angle = 360 - angle
      
      for (const [, aspectData] of Object.entries(ASPECT_TYPES)) {
        const diff = Math.abs(angle - aspectData.angle)
        if (diff <= aspectData.orb) {
          transitAspects.push({
            transitPlanet: transitPlanet.name,
            natalPlanet: natalPlanet.name,
            type: aspectData.name,
            orb: diff,
            angle: aspectData.angle,
            color: aspectData.color
          })
        }
      }
    }
  }
  
  return transitAspects
}

export async function calculateCurrentTransits(natalChart: ChartData): Promise<TransitData> {
  const swe = await getSwissEph()
  
  const now = new Date()
  const jd = swe.dateToJulianDay(now)
  
  const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
  const transitPlanets: PlanetInfo[] = []
  
  for (const planetName of planetNames) {
    const planetId = PLANET_MAP[planetName]
    const position = swe.calculatePosition(jd, planetId)
    
    const planetLong = normalizeAngle(position.longitude)
    const sign = getZodiacSign(planetLong)
    const degree = getDegreeInSign(planetLong)
    const house = calculateHouseForPlanet(planetLong, natalChart.houses)
    
    transitPlanets.push({
      name: planetName,
      symbol: planetName,
      longitude: planetLong,
      sign,
      degree,
      house
    })
  }
  
  const transitAspects = calculateTransitAspects(transitPlanets, natalChart.planets)
  
  return {
    planets: transitPlanets,
    aspects: transitAspects,
    calculatedAt: now
  }
}
