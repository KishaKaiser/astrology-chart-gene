import { ChartData, Planet, House, Aspect, TransitData, ZODIAC_SIGNS, ASPECT_TYPES } from './astrology-types'

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

function julianDate(date: Date): number {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  
  let a = Math.floor((14 - month) / 12)
  let y = year + 4800 - a
  let m = month + 12 * a - 3
  
  let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
  
  return jdn + (hour - 12) / 24
}

function calculateSunPosition(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0
  
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T
  
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * Math.PI / 180) +
            (0.019993 - 0.000101 * T) * Math.sin(2 * M * Math.PI / 180) +
            0.000289 * Math.sin(3 * M * Math.PI / 180)
  
  const sunLong = L0 + C
  
  return normalizeAngle(sunLong)
}

function calculateMoonPosition(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0
  
  const L = 218.3164477 + 481267.88123421 * T
  const D = 297.8501921 + 445267.1114034 * T
  const M = 357.5291092 + 35999.0502909 * T
  const F = 93.2720950 + 483202.0175233 * T
  
  let moonLong = L + 6.288774 * Math.sin(D * Math.PI / 180)
  moonLong += 1.274027 * Math.sin((2 * D - M) * Math.PI / 180)
  moonLong += 0.658314 * Math.sin(2 * D * Math.PI / 180)
  moonLong += 0.213618 * Math.sin(M * Math.PI / 180)
  
  return normalizeAngle(moonLong)
}

function calculatePlanetPosition(planet: string, jd: number): number {
  const T = (jd - 2451545.0) / 36525.0
  
  const orbitalElements: Record<string, { L: number[], a: number, e: number, i: number, omega: number, pi: number }> = {
    'Mercury': { 
      L: [252.250906, 149472.6746358, 0.00030350, 0.000000018],
      a: 0.38709831, e: 0.20563175, i: 7.00498625,
      omega: 48.33089304, pi: 77.45611904
    },
    'Venus': {
      L: [181.979801, 58517.8156760, 0.00031014, 0.000000015],
      a: 0.72332982, e: 0.00677192, i: 3.39466189,
      omega: 76.67992019, pi: 131.56370300
    },
    'Mars': {
      L: [355.433000, 19140.2993039, 0.00031052, 0.000000016],
      a: 1.52371034, e: 0.09339410, i: 1.84969142,
      omega: 49.55809321, pi: 336.06023395
    },
    'Jupiter': {
      L: [34.351519, 3034.9056606, 0.00022374, 0.000000025],
      a: 5.20288700, e: 0.04838624, i: 1.30326966,
      omega: 100.46444702, pi: 14.33130924
    },
    'Saturn': {
      L: [50.077444, 1222.1138488, 0.00021004, 0.000000019],
      a: 9.53667594, e: 0.05386179, i: 2.48599187,
      omega: 113.66550252, pi: 93.05678728
    }
  }
  
  const elem = orbitalElements[planet]
  if (!elem) return 0
  
  const L = elem.L[0] + elem.L[1] * T + elem.L[2] * T * T + elem.L[3] * T * T * T
  const M = normalizeAngle(L - elem.pi)
  
  let E = M
  for (let i = 0; i < 10; i++) {
    const dE = (M + elem.e * 180 / Math.PI * Math.sin(E * Math.PI / 180) - E) / 
               (1 - elem.e * Math.cos(E * Math.PI / 180))
    E += dE
    if (Math.abs(dE) < 1e-6) break
  }
  
  const v = 2 * Math.atan(Math.sqrt((1 + elem.e) / (1 - elem.e)) * Math.tan(E * Math.PI / 360)) * 180 / Math.PI
  
  return normalizeAngle(v + elem.pi)
}

function calculateOuterPlanet(planet: string, jd: number): number {
  const T = (jd - 2451545.0) / 36525.0
  
  const approximations: Record<string, number[]> = {
    'Uranus': [314.055005, 428.466998, T],
    'Neptune': [304.348665, 218.486200, T],
    'Pluto': [238.928980, 145.186150, T]
  }
  
  const data = approximations[planet]
  if (!data) return 0
  
  return normalizeAngle(data[0] + data[1] * data[2])
}

function calculateAscendant(jd: number, latitude: number, longitude: number): number {
  const T = (jd - 2451545.0) / 36525.0
  
  const LST = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + longitude
  const theta = normalizeAngle(LST)
  
  const sunLong = calculateSunPosition(jd)
  const epsilon = 23.439291 - 0.0130042 * T
  
  const y = Math.sin(theta * Math.PI / 180) * Math.cos(epsilon * Math.PI / 180)
  const x = Math.cos(theta * Math.PI / 180)
  
  let asc = Math.atan2(y, x) * 180 / Math.PI
  asc = normalizeAngle(asc)
  
  const latCorrection = Math.atan(Math.tan(latitude * Math.PI / 180)) * 180 / Math.PI
  asc = normalizeAngle(asc + latCorrection * 0.1)
  
  return asc
}

function calculateMidheaven(jd: number, longitude: number): number {
  const LST = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + longitude
  return normalizeAngle(LST)
}

function calculateHouses(asc: number, mc: number): House[] {
  const houses: House[] = []
  
  for (let i = 1; i <= 12; i++) {
    let cusp: number
    
    if (i === 1) {
      cusp = asc
    } else if (i === 10) {
      cusp = mc
    } else if (i === 4) {
      cusp = normalizeAngle(mc + 180)
    } else if (i === 7) {
      cusp = normalizeAngle(asc + 180)
    } else if (i < 4) {
      const segment = (normalizeAngle(mc - asc + 360)) / 3
      cusp = normalizeAngle(asc + segment * (i - 1))
    } else if (i < 7) {
      const ic = normalizeAngle(mc + 180)
      const segment = (normalizeAngle(asc + 180 - ic + 360)) / 3
      cusp = normalizeAngle(ic + segment * (i - 4))
    } else if (i < 10) {
      const dsc = normalizeAngle(asc + 180)
      const segment = (normalizeAngle(mc - dsc + 360)) / 3
      cusp = normalizeAngle(dsc + segment * (i - 7))
    } else {
      const segment = (normalizeAngle(asc - mc + 360)) / 3
      cusp = normalizeAngle(mc + segment * (i - 10))
    }
    
    houses.push({
      number: i,
      cusp: normalizeAngle(cusp),
      sign: getZodiacSign(normalizeAngle(cusp))
    })
  }
  
  return houses
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

function calculateAspects(planets: Planet[]): Aspect[] {
  const aspects: Aspect[] = []
  
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i]
      const planet2 = planets[j]
      
      let angle = Math.abs(planet1.longitude - planet2.longitude)
      if (angle > 180) angle = 360 - angle
      
      for (const [aspectType, aspectData] of Object.entries(ASPECT_TYPES)) {
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

export function generateChartData(
  name: string,
  date: string,
  time: string,
  location: string,
  latitude: number,
  longitude: number,
  timezone: string,
  notes?: string
): ChartData {
  const dateTime = new Date(`${date}T${time}:00${timezone}`)
  const jd = julianDate(dateTime)
  
  const asc = calculateAscendant(jd, latitude, longitude)
  const mc = calculateMidheaven(jd, longitude)
  const houses = calculateHouses(asc, mc)
  
  const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
  const planets: Planet[] = []
  
  for (const planetName of planetNames) {
    let planetLong: number
    
    if (planetName === 'Sun') {
      planetLong = calculateSunPosition(jd)
    } else if (planetName === 'Moon') {
      planetLong = calculateMoonPosition(jd)
    } else if (['Uranus', 'Neptune', 'Pluto'].includes(planetName)) {
      planetLong = calculateOuterPlanet(planetName, jd)
    } else {
      planetLong = calculatePlanetPosition(planetName, jd)
    }
    
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
    ascendant: asc,
    midheaven: mc,
    houseSystem: 'Placidus',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

export function calculateCurrentTransits(natalChart: ChartData): TransitData {
  const now = new Date()
  const jd = julianDate(now)
  
  const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
  const transitPlanets: Planet[] = []
  
  for (const planetName of planetNames) {
    let planetLong: number
    
    if (planetName === 'Sun') {
      planetLong = calculateSunPosition(jd)
    } else if (planetName === 'Moon') {
      planetLong = calculateMoonPosition(jd)
    } else if (['Uranus', 'Neptune', 'Pluto'].includes(planetName)) {
      planetLong = calculateOuterPlanet(planetName, jd)
    } else {
      planetLong = calculatePlanetPosition(planetName, jd)
    }
    
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
  
  return {
    planets: transitPlanets,
    calculatedAt: now
  }
}
