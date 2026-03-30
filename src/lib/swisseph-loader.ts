const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

function julianDay(date: Date): number {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  const hour = date.getUTCHours()
  const minute = date.getUTCMinutes()
  const second = date.getUTCSeconds()
  
  let y = year
  let m = month
  
  if (m <= 2) {
    y -= 1
    m += 12
  }
  
  const a = Math.floor(y / 100)
  const b = 2 - a + Math.floor(a / 4)
  
  const jd = Math.floor(365.25 * (y + 4716)) + 
             Math.floor(30.6001 * (m + 1)) + 
             day + b - 1524.5 +
             (hour + minute / 60 + second / 3600) / 24
  
  return jd
}

function calculatePlanetPosition(jd: number, planet: number): { longitude: number; latitude: number; distance: number } {
  const T = (jd - 2451545.0) / 36525
  
  const planetData: Record<number, { L: number[]; P: number[]; e: number[]; a: number; i: number; N: number[] }> = {
    0: { L: [280.4665, 36000.7698], P: [0, 0], e: [0, 0], a: 0, i: 0, N: [0, 0] },
    1: { L: [218.3164, 481267.8813], P: [83.3532, 4069.0137], e: [0.0549, -0.0001], a: 384400, i: 5.145, N: [125.0445, -1934.1363] },
    2: { L: [252.2509, 149472.6746], P: [77.4561, 1.5550], e: [0.2056, -0.0006], a: 0.3871, i: 7.005, N: [48.3313, 1.1861] },
    3: { L: [181.9798, 58517.8156], P: [131.5637, 1.4022], e: [0.0068, -0.0005], a: 0.7233, i: 3.395, N: [76.6799, 0.9011] },
    4: { L: [355.4330, 19140.2993], P: [336.0602, 1.8495], e: [0.0934, 0.0009], a: 1.5237, i: 1.850, N: [49.5574, 0.7720] },
    5: { L: [34.3515, 3034.9056], P: [14.3312, 1.6126], e: [0.0484, 0.0001], a: 5.2026, i: 1.303, N: [100.4644, 1.0209] },
    6: { L: [50.0774, 1222.1138], P: [93.0568, 1.9637], e: [0.0542, -0.0003], a: 9.5549, i: 2.489, N: [113.6655, 0.8771] },
    7: { L: [314.0550, 428.4677], P: [173.0051, 1.4863], e: [0.0472, -0.0001], a: 19.2184, i: 0.773, N: [74.0060, 0.5212] },
    8: { L: [304.3487, 218.4862], P: [48.1237, 1.4262], e: [0.0086, 0.0001], a: 30.1104, i: 1.770, N: [131.7840, 1.1022] },
    9: { L: [238.9290, 145.1879], P: [224.0670, 1.3971], e: [0.2488, 0.0000], a: 39.4821, i: 17.142, N: [110.3034, 0.0000] }
  }
  
  const data = planetData[planet]
  if (!data) {
    return { longitude: 0, latitude: 0, distance: 1 }
  }
  
  const L = (data.L[0] + data.L[1] * T) % 360
  const P = data.P[0] + data.P[1] * T
  const e = data.e[0] + data.e[1] * T
  const N = data.N[0] + data.N[1] * T
  
  const M = (L - P) % 360
  const M_rad = M * DEG_TO_RAD
  
  const E = M + (e * RAD_TO_DEG * Math.sin(M_rad) * (1 + e * Math.cos(M_rad)))
  const E_rad = E * DEG_TO_RAD
  
  const xv = data.a * (Math.cos(E_rad) - e)
  const yv = data.a * (Math.sqrt(1 - e * e) * Math.sin(E_rad))
  
  const v = Math.atan2(yv, xv) * RAD_TO_DEG
  const r = Math.sqrt(xv * xv + yv * yv)
  
  let longitude = (v + P) % 360
  if (longitude < 0) longitude += 360
  
  return {
    longitude,
    latitude: planet === 1 ? data.i : 0,
    distance: r
  }
}

function calculatePlacidusHouses(jd: number, lat: number, lon: number): { cusps: number[]; ascendant: number; mc: number } {
  const T = (jd - 2451545.0) / 36525
  
  const theta0 = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + T * T * (0.000387933 - T / 38710000)
  const lst = ((theta0 + lon) % 360 + 360) % 360
  
  const epsilon = 23.439292 - 0.0130125 * T
  const eps_rad = epsilon * DEG_TO_RAD
  const lst_rad = lst * DEG_TO_RAD
  
  const mc = Math.atan2(Math.sin(lst_rad), Math.cos(lst_rad) * Math.cos(eps_rad)) * RAD_TO_DEG
  const mcNorm = ((mc % 360) + 360) % 360
  
  const lat_rad = lat * DEG_TO_RAD
  const ramc_rad = lst_rad
  
  const ascNum = -Math.sin(ramc_rad) * Math.cos(eps_rad)
  const ascDen = Math.cos(ramc_rad) * Math.cos(lat_rad) - Math.sin(eps_rad) * Math.sin(lat_rad)
  const asc = Math.atan2(ascNum, ascDen) * RAD_TO_DEG
  const ascNorm = ((asc % 360) + 360) % 360
  
  const cusps = [0]
  for (let i = 1; i <= 12; i++) {
    const houseAngle = mcNorm + (i - 10) * 30
    cusps.push(((houseAngle % 360) + 360) % 360)
  }
  
  cusps[1] = ascNorm
  cusps[10] = mcNorm
  cusps[4] = ((cusps[10] + 180) % 360)
  cusps[7] = ((cusps[1] + 180) % 360)
  
  const mcTo11 = ((cusps[11] - cusps[10]) % 360 + 360) % 360
  cusps[11] = ((cusps[10] + mcTo11 / 3) % 360)
  cusps[12] = ((cusps[10] + 2 * mcTo11 / 3) % 360)
  
  const ascTo2 = ((cusps[2] - cusps[1]) % 360 + 360) % 360
  cusps[2] = ((cusps[1] + ascTo2 / 3) % 360)
  cusps[3] = ((cusps[1] + 2 * ascTo2 / 3) % 360)
  
  const icTo5 = ((cusps[5] - cusps[4]) % 360 + 360) % 360
  cusps[5] = ((cusps[4] + icTo5 / 3) % 360)
  cusps[6] = ((cusps[4] + 2 * icTo5 / 3) % 360)
  
  const descTo8 = ((cusps[8] - cusps[7]) % 360 + 360) % 360
  cusps[8] = ((cusps[7] + descTo8 / 3) % 360)
  cusps[9] = ((cusps[7] + 2 * descTo8 / 3) % 360)
  
  return { cusps, ascendant: ascNorm, mc: mcNorm }
}

export const Planet = {
  Sun: 0,
  Moon: 1,
  Mercury: 2,
  Venus: 3,
  Mars: 4,
  Jupiter: 5,
  Saturn: 6,
  Uranus: 7,
  Neptune: 8,
  Pluto: 9
}

export const HouseSystem = {
  Placidus: 'P'
}

export class SwissEphemeris {
  dateToJulianDay(date: Date): number {
    return julianDay(date)
  }
  
  calculatePosition(jd: number, planet: number): { longitude: number; latitude: number; distance: number } {
    return calculatePlanetPosition(jd, planet)
  }
  
  calculateHouses(jd: number, lat: number, lon: number, _system: string): { cusps: number[]; ascendant: number; mc: number } {
    return calculatePlacidusHouses(jd, lat, lon)
  }
}

export async function loadSwissEphemeris() {
  console.log('[SwissEph Loader] Using built-in astrology calculation engine')
  
  return {
    SwissEphemeris,
    Planet,
    HouseSystem
  }
}
