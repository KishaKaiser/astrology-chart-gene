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
    console.log('Loading Swiss Ephemeris modules...')
    const swissephBrowser = await import('@swisseph/browser')
    SwissEphemeris = swissephBrowser.SwissEphemeris
    
    const swissephCore = await import('@swisseph/core')
    Planet = swissephCore.Planet
    HouseSystem = swissephCore.HouseSystem
    
    console.log('Modules loaded successfully')
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
        throw new Error('SwissEphemeris constructor not available after loading')
      }
      
      console.log('Creating SwissEphemeris instance...')
      swissEph = new SwissEphemeris()
      
      if (!swissEph) {
        throw new Error('Failed to create SwissEphemeris instance')
      }
      
      if (typeof swissEph.init === 'function') {
        console.log('Calling swissEph.init()...')
        await swissEph.init()
        console.log('Swiss Ephemeris init() completed')
      } else {
        console.log('SwissEphemeris instance has no init() method, continuing...')
      }
      
      console.log('Swiss Ephemeris initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Swiss Ephemeris:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      swissEph = null
      isInitializing = false
      initPromise = null
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error'
      throw new Error(`Astrology calculation engine failed to load: ${errorMessage}. Please refresh the page and try again.`)
    } finally {
      isInitializing = false
    }
  })()
  
  await initPromise
  
  if (!swissEph) {
    throw new Error('Swiss Ephemeris is null after initialization attempt')
  }
  
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
  console.log('=== GENERATE CHART DATA - START ===')
  console.log('Input parameters:', { 
    name, 
    date, 
    time, 
    location, 
    latitude, 
    longitude, 
    timezone,
    notesLength: notes?.length || 0
  })
  
  console.log('Step 1: Getting Swiss Ephemeris instance...')
  const swe = await getSwissEph()
  console.log('Swiss Ephemeris instance obtained:', !!swe)
  
  if (!swe) {
    throw new Error('Swiss Ephemeris not initialized properly - instance is null or undefined')
  }
  
  console.log('Step 2: Validating Swiss Ephemeris methods...')
  console.log('Available methods:', Object.keys(swe).filter(k => typeof swe[k] === 'function'))
  
  if (typeof swe.dateToJulianDay !== 'function') {
    throw new Error('Swiss Ephemeris is missing required method: dateToJulianDay')
  }
  console.log('✓ dateToJulianDay method available')
  
  if (typeof swe.calculateHouses !== 'function') {
    throw new Error('Swiss Ephemeris is missing required method: calculateHouses')
  }
  console.log('✓ calculateHouses method available')
  
  if (typeof swe.calculatePosition !== 'function') {
    throw new Error('Swiss Ephemeris is missing required method: calculatePosition')
  }
  console.log('✓ calculatePosition method available')
  
  if (!Planet) {
    throw new Error('Planet enum not loaded from Swiss Ephemeris library')
  }
  console.log('✓ Planet enum available:', Object.keys(Planet).length, 'planets')
  
  if (!HouseSystem) {
    throw new Error('HouseSystem enum not loaded from Swiss Ephemeris library')
  }
  console.log('✓ HouseSystem enum available:', Object.keys(HouseSystem).length, 'systems')
  
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
  console.log('Planet mapping created for:', Object.keys(PLANET_MAP).length, 'bodies')
  
  console.log('Step 3: Parsing date and time...')
  console.log('Raw inputs - date:', date, 'time:', time, 'timezone:', timezone)
  let dateTime: Date
  try {
    const dateTimeStr = `${date}T${time}:00${timezone}`
    console.log('Constructed datetime string:', dateTimeStr)
    dateTime = new Date(dateTimeStr)
    console.log('Parsed Date object:', dateTime)
    console.log('Date object timestamp:', dateTime.getTime())
    
    if (isNaN(dateTime.getTime())) {
      throw new Error(`Invalid date/time format. Input: "${dateTimeStr}" resulted in invalid Date`)
    }
    console.log('✓ Date parsing successful:', dateTime.toISOString())
  } catch (error) {
    console.error('✗ Date parsing failed:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    throw new Error(`Invalid date or time format: ${errorMsg}. Please check your input.`)
  }
  
  console.log('Step 4: Calculating Julian Day...')
  console.log('Calling swe.dateToJulianDay with:', dateTime)
  let jd: number
  try {
    jd = swe.dateToJulianDay(dateTime)
    console.log('✓ Julian Day calculated:', jd)
    
    if (typeof jd !== 'number' || isNaN(jd)) {
      throw new Error(`Invalid Julian Day result: ${jd}`)
    }
  } catch (error) {
    console.error('✗ Julian Day calculation failed:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to calculate Julian Day: ${errorMsg}. Date: ${date}, Time: ${time}`)
  }
  
  console.log('Step 5: Calculating houses...')
  console.log('House calculation inputs - JD:', jd, 'Lat:', latitude, 'Lng:', longitude, 'System: Placidus')
  let houseData: any
  try {
    houseData = swe.calculateHouses(jd, latitude, longitude, HouseSystem.Placidus)
    console.log('✓ Houses calculated successfully')
    console.log('House data structure:', {
      hasCusps: !!houseData?.cusps,
      cuspsLength: houseData?.cusps?.length,
      hasAscendant: !!houseData?.ascendant,
      hasMC: !!houseData?.mc,
      ascendant: houseData?.ascendant,
      mc: houseData?.mc
    })
    
    if (!houseData || !houseData.cusps || houseData.cusps.length < 13) {
      throw new Error(`Invalid house data structure returned. Received: ${JSON.stringify(houseData)}`)
    }
  } catch (error) {
    console.error('✗ House calculation failed:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to calculate houses: ${errorMsg}. Location: ${location} (${latitude}, ${longitude})`)
  }
  
  const houses: House[] = houseData.cusps.slice(1, 13).map((cusp: number, index: number) => ({
    number: index + 1,
    cusp: normalizeAngle(cusp),
    sign: getZodiacSign(normalizeAngle(cusp))
  }))
  console.log('✓ House array created:', houses.length, 'houses')
  
  const ascendant = normalizeAngle(houseData.ascendant)
  const midheaven = normalizeAngle(houseData.mc)
  console.log('✓ Ascendant:', ascendant.toFixed(4), '°')
  console.log('✓ Midheaven:', midheaven.toFixed(4), '°')
  
  console.log('Step 6: Calculating planetary positions...')
  const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
  const planets: PlanetInfo[] = []
  
  for (const planetName of planetNames) {
    try {
      const planetId = PLANET_MAP[planetName]
      console.log(`  → Calculating ${planetName} (ID: ${planetId})...`)
      const position = swe.calculatePosition(jd, planetId)
      console.log(`    Position data:`, {
        longitude: position?.longitude,
        latitude: position?.latitude,
        distance: position?.distance
      })
      
      if (!position || typeof position.longitude !== 'number') {
        throw new Error(`Invalid position data returned for ${planetName}`)
      }
      
      const planetLong = normalizeAngle(position.longitude)
      const sign = getZodiacSign(planetLong)
      const degree = getDegreeInSign(planetLong)
      const house = calculateHouseForPlanet(planetLong, houses)
      
      console.log(`    ✓ ${planetName}: ${degree.toFixed(2)}° ${sign} (House ${house})`)
      
      planets.push({
        name: planetName,
        symbol: planetName,
        longitude: planetLong,
        sign,
        degree,
        house
      })
    } catch (error) {
      console.error(`    ✗ Error calculating ${planetName}:`, error)
      const errorMsg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to calculate position for ${planetName}: ${errorMsg}`)
    }
  }
  
  console.log('✓ All planetary positions calculated successfully')
  console.log('Step 7: Calculating aspects...')
  const aspects = calculateAspects(planets)
  console.log('✓ Aspects calculated:', aspects.length, 'aspects found')
  
  console.log('=== CHART GENERATION COMPLETE ===')
  console.log('Summary:', {
    planets: planets.length,
    houses: houses.length,
    aspects: aspects.length,
    ascendant: ascendant.toFixed(2),
    midheaven: midheaven.toFixed(2)
  })
  
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

export async function calculateTransitsForDate(natalChart: ChartData, date: Date): Promise<TransitData> {
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
  
  const jd = swe.dateToJulianDay(date)
  
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
    calculatedAt: date
  }
}
