import { ChartData, Planet as PlanetInfo, House, Aspect, TransitData, TransitAspect, ZODIAC_SIGNS, ASPECT_TYPES } from './astrology-types'

let swissEph: any = null
let SwissEphemeris: any = null
let Planet: any = null
let HouseSystem: any = null
let isInitializing = false
let initPromise: Promise<void> | null = null

async function loadSwissEph() {
  if (SwissEphemeris && Planet && HouseSystem) {
    return
  }

  try {
    const swissephBrowser = await import('@swisseph/browser')
    SwissEphemeris = swissephBrowser.SwissEphemeris
    
    const swissephCore = await import('@swisseph/core')
    Planet = swissephCore.Planet
    HouseSystem = swissephCore.HouseSystem
  } catch (error) {
    console.error('Failed to load Swiss Ephemeris modules:', error)
    throw new Error('Swiss Ephemeris library failed to load. Please refresh and try again.')
  }
}

async function getSwissEph(): Promise<any> {
  if (swissEph) return swissEph
  
  if (isInitializing && initPromise) {
    await initPromise
    return swissEph
  }
  
  isInitializing = true
  initPromise = (async () => {
    try {
      console.log('Starting Swiss Ephemeris initialization...')
      await loadSwissEph()
      
      if (!SwissEphemeris) {
        throw new Error('SwissEphemeris constructor not available')
      }
      
      console.log('Creating SwissEphemeris instance...')
      swissEph = new SwissEphemeris()
      
      if (typeof swissEph.init === 'function') {
        console.log('Calling swissEph.init()...')
        await swissEph.init()
      }
      
      console.log('Swiss Ephemeris initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Swiss Ephemeris:', error)
      swissEph = null
      isInitializing = false
      initPromise = null
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Astrology calculation engine failed: ${errorMessage}. Please refresh and try again.`)
    } finally {
      isInitializing = false
    }
  })()
  
  await initPromise
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
  console.log('generateChartData called with:', { name, date, time, location, latitude, longitude, timezone })
  
  const swe = await getSwissEph()
  
  if (!swe) {
    throw new Error('Swiss Ephemeris not initialized')
  }
  
  const PLANET_MAP: Record<string, any> = {
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
  
  let dateTime: Date
  try {
    const dateTimeStr = `${date}T${time}:00${timezone}`
    console.log('Parsing datetime:', dateTimeStr)
    dateTime = new Date(dateTimeStr)
    
    if (isNaN(dateTime.getTime())) {
      throw new Error('Invalid date/time format')
    }
  } catch (error) {
    console.error('Date parsing error:', error)
    throw new Error('Invalid date or time format. Please check your input.')
  }
  
  console.log('Calculating Julian Day for:', dateTime)
  let jd: number
  try {
    jd = swe.dateToJulianDay(dateTime)
    console.log('Julian Day:', jd)
  } catch (error) {
    console.error('Julian Day calculation error:', error)
    throw new Error('Failed to calculate Julian Day. Please check your date/time input.')
  }
  
  console.log('Calculating houses...')
  let houseData: any
  try {
    houseData = swe.calculateHouses(jd, latitude, longitude, HouseSystem.Placidus)
    console.log('House data calculated:', houseData)
  } catch (error) {
    console.error('House calculation error:', error)
    throw new Error('Failed to calculate houses. Please check your location coordinates.')
  }
  
  const houses: House[] = houseData.cusps.slice(1, 13).map((cusp: number, index: number) => ({
    number: index + 1,
    cusp: normalizeAngle(cusp),
    sign: getZodiacSign(normalizeAngle(cusp))
  }))
  
  const ascendant = normalizeAngle(houseData.ascendant)
  const midheaven = normalizeAngle(houseData.mc)
  
  console.log('Calculating planetary positions...')
  const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
  const planets: PlanetInfo[] = []
  
  for (const planetName of planetNames) {
    try {
      const planetId = PLANET_MAP[planetName]
      console.log(`Calculating position for ${planetName}...`)
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
    } catch (error) {
      console.error(`Error calculating ${planetName}:`, error)
      throw new Error(`Failed to calculate position for ${planetName}.`)
    }
  }
  
  console.log('Calculating aspects...')
  const aspects = calculateAspects(planets)
  console.log('Chart generation complete!')
  
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
  
  const PLANET_MAP: Record<string, any> = {
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
