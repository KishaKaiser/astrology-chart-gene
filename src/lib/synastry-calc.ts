import { ChartData, Planet, Aspect, ASPECT_TYPES } from './astrology-types'

export interface SynastryAspect {
  person1Planet: string
  person2Planet: string
  type: string
  orb: number
  angle: number
  color: string
  interpretation: 'harmonious' | 'challenging' | 'intense'
}

export interface CompatibilityScore {
  category: string
  score: number
  description: string
  icon: string
}

export interface SynastryData {
  person1: ChartData
  person2: ChartData
  aspects: SynastryAspect[]
  compatibilityScores: CompatibilityScore[]
  overallScore: number
  createdAt: number
}

function normalizeAngle(angle: number): number {
  while (angle < 0) angle += 360
  while (angle >= 360) angle -= 360
  return angle
}

function calculateAspectAngle(long1: number, long2: number): number {
  let diff = Math.abs(long1 - long2)
  if (diff > 180) diff = 360 - diff
  return diff
}

function findAspectType(angle: number): { type: string; orb: number; color: string; name: string } | null {
  for (const [key, aspectInfo] of Object.entries(ASPECT_TYPES)) {
    const diff = Math.abs(angle - aspectInfo.angle)
    if (diff <= aspectInfo.orb) {
      return {
        type: key,
        orb: diff,
        color: aspectInfo.color,
        name: aspectInfo.name
      }
    }
  }
  return null
}

function getAspectInterpretation(type: string): 'harmonious' | 'challenging' | 'intense' {
  if (type === 'trine' || type === 'sextile') return 'harmonious'
  if (type === 'square' || type === 'opposition') return 'challenging'
  return 'intense'
}

export function calculateSynastryAspects(chart1: ChartData, chart2: ChartData): SynastryAspect[] {
  const aspects: SynastryAspect[] = []
  
  const majorPlanets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']
  
  for (const p1 of chart1.planets) {
    if (!majorPlanets.includes(p1.name)) continue
    
    for (const p2 of chart2.planets) {
      if (!majorPlanets.includes(p2.name)) continue
      
      const angle = calculateAspectAngle(p1.longitude, p2.longitude)
      const aspectType = findAspectType(angle)
      
      if (aspectType) {
        aspects.push({
          person1Planet: p1.name,
          person2Planet: p2.name,
          type: aspectType.name,
          orb: aspectType.orb,
          angle: angle,
          color: aspectType.color,
          interpretation: getAspectInterpretation(aspectType.type)
        })
      }
    }
  }
  
  return aspects.sort((a, b) => a.orb - b.orb)
}

export function calculateCompatibilityScores(chart1: ChartData, chart2: ChartData, aspects: SynastryAspect[]): CompatibilityScore[] {
  const scores: CompatibilityScore[] = []
  
  const sunAspects = aspects.filter(a => 
    (a.person1Planet === 'Sun' && a.person2Planet === 'Sun') ||
    (a.person1Planet === 'Sun' && a.person2Planet === 'Moon') ||
    (a.person2Planet === 'Sun' && a.person1Planet === 'Moon')
  )
  const harmonious = sunAspects.filter(a => a.interpretation === 'harmonious').length
  const challenging = sunAspects.filter(a => a.interpretation === 'challenging').length
  const coreScore = Math.min(100, (harmonious * 25) - (challenging * 10) + 50)
  
  scores.push({
    category: 'Core Connection',
    score: Math.max(0, coreScore),
    description: coreScore > 70 ? 'Strong fundamental compatibility' : coreScore > 40 ? 'Moderate core connection' : 'Challenging foundation',
    icon: '☉'
  })
  
  const venusAspects = aspects.filter(a => 
    a.person1Planet === 'Venus' || a.person2Planet === 'Venus'
  )
  const venusHarmonious = venusAspects.filter(a => a.interpretation === 'harmonious').length
  const venusChallenging = venusAspects.filter(a => a.interpretation === 'challenging').length
  const romanticScore = Math.min(100, (venusHarmonious * 20) - (venusChallenging * 8) + 50)
  
  scores.push({
    category: 'Romantic Attraction',
    score: Math.max(0, romanticScore),
    description: romanticScore > 70 ? 'Powerful romantic chemistry' : romanticScore > 40 ? 'Decent attraction' : 'Limited romantic spark',
    icon: '♀'
  })
  
  const mercuryAspects = aspects.filter(a => 
    a.person1Planet === 'Mercury' || a.person2Planet === 'Mercury'
  )
  const mercuryHarmonious = mercuryAspects.filter(a => a.interpretation === 'harmonious').length
  const mercuryChallenging = mercuryAspects.filter(a => a.interpretation === 'challenging').length
  const commScore = Math.min(100, (mercuryHarmonious * 20) - (mercuryChallenging * 10) + 50)
  
  scores.push({
    category: 'Communication',
    score: Math.max(0, commScore),
    description: commScore > 70 ? 'Excellent mental rapport' : commScore > 40 ? 'Fair communication' : 'Misunderstandings likely',
    icon: '☿'
  })
  
  const marsAspects = aspects.filter(a => 
    a.person1Planet === 'Mars' || a.person2Planet === 'Mars'
  )
  const marsIntense = marsAspects.filter(a => a.interpretation === 'intense').length
  const marsHarmonious = marsAspects.filter(a => a.interpretation === 'harmonious').length
  const passionScore = Math.min(100, (marsIntense * 15) + (marsHarmonious * 15) + 40)
  
  scores.push({
    category: 'Passion & Energy',
    score: Math.max(0, passionScore),
    description: passionScore > 70 ? 'Intense physical chemistry' : passionScore > 40 ? 'Moderate passion' : 'Low energy exchange',
    icon: '♂'
  })
  
  const jupiterSaturnAspects = aspects.filter(a => 
    a.person1Planet === 'Jupiter' || a.person2Planet === 'Jupiter' ||
    a.person1Planet === 'Saturn' || a.person2Planet === 'Saturn'
  )
  const longTermHarmonious = jupiterSaturnAspects.filter(a => a.interpretation === 'harmonious').length
  const longTermScore = Math.min(100, (longTermHarmonious * 15) + 40)
  
  scores.push({
    category: 'Long-term Potential',
    score: Math.max(0, longTermScore),
    description: longTermScore > 70 ? 'Strong commitment indicators' : longTermScore > 40 ? 'Moderate stability' : 'Uncertain longevity',
    icon: '♄'
  })
  
  return scores
}

export function calculateOverallCompatibility(scores: CompatibilityScore[]): number {
  const weights = {
    'Core Connection': 0.25,
    'Romantic Attraction': 0.25,
    'Communication': 0.20,
    'Passion & Energy': 0.15,
    'Long-term Potential': 0.15
  }
  
  let totalScore = 0
  for (const score of scores) {
    const weight = weights[score.category as keyof typeof weights] || 0.20
    totalScore += score.score * weight
  }
  
  return Math.round(totalScore)
}

export function generateSynastryData(chart1: ChartData, chart2: ChartData): SynastryData {
  const aspects = calculateSynastryAspects(chart1, chart2)
  const compatibilityScores = calculateCompatibilityScores(chart1, chart2, aspects)
  const overallScore = calculateOverallCompatibility(compatibilityScores)
  
  return {
    person1: chart1,
    person2: chart2,
    aspects,
    compatibilityScores,
    overallScore,
    createdAt: Date.now()
  }
}
