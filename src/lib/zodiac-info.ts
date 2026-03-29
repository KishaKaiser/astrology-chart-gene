import { ZodiacSign } from './astrology-types'

export interface ZodiacInfo {
  element: 'Fire' | 'Earth' | 'Air' | 'Water'
  modality: 'Cardinal' | 'Fixed' | 'Mutable'
  ruler: string
  keywords: string[]
  description: string
}

export interface PlanetaryDignity {
  domicile: ZodiacSign[]
  exaltation?: ZodiacSign
  detriment?: ZodiacSign[]
  fall?: ZodiacSign
}

export const ZODIAC_INFO: Record<ZodiacSign, ZodiacInfo> = {
  'Aries': {
    element: 'Fire',
    modality: 'Cardinal',
    ruler: 'Mars',
    keywords: ['Initiative', 'Courage', 'Leadership', 'Pioneering', 'Independence'],
    description: 'The Ram - First sign of the zodiac, representing new beginnings, assertiveness, and dynamic action. Aries energy is bold, impulsive, and always ready to take the lead.'
  },
  'Taurus': {
    element: 'Earth',
    modality: 'Fixed',
    ruler: 'Venus',
    keywords: ['Stability', 'Sensuality', 'Persistence', 'Security', 'Pleasure'],
    description: 'The Bull - Grounded and steadfast, Taurus values material security, sensory experiences, and lasting foundations. Patient yet determined, this sign builds for permanence.'
  },
  'Gemini': {
    element: 'Air',
    modality: 'Mutable',
    ruler: 'Mercury',
    keywords: ['Communication', 'Curiosity', 'Versatility', 'Intellect', 'Adaptability'],
    description: 'The Twins - Quick-witted and curious, Gemini thrives on information exchange and mental stimulation. This sign represents duality, connection, and the power of words.'
  },
  'Cancer': {
    element: 'Water',
    modality: 'Cardinal',
    ruler: 'Moon',
    keywords: ['Nurturing', 'Emotion', 'Protection', 'Intuition', 'Home'],
    description: 'The Crab - Deeply feeling and protective, Cancer represents emotional depth, family bonds, and the need for security. This sign creates safe spaces and nurtures with devotion.'
  },
  'Leo': {
    element: 'Fire',
    modality: 'Fixed',
    ruler: 'Sun',
    keywords: ['Creativity', 'Expression', 'Generosity', 'Confidence', 'Drama'],
    description: 'The Lion - Radiant and expressive, Leo embodies creative self-expression, warmth, and natural authority. This sign shines brightly and inspires others through genuine heart-centered leadership.'
  },
  'Virgo': {
    element: 'Earth',
    modality: 'Mutable',
    ruler: 'Mercury',
    keywords: ['Analysis', 'Service', 'Precision', 'Health', 'Improvement'],
    description: 'The Virgin - Detail-oriented and discerning, Virgo seeks perfection through refinement and practical service. This sign excels at analysis, organization, and healing.'
  },
  'Libra': {
    element: 'Air',
    modality: 'Cardinal',
    ruler: 'Venus',
    keywords: ['Balance', 'Harmony', 'Partnership', 'Justice', 'Aesthetics'],
    description: 'The Scales - Seeking equilibrium and beauty, Libra represents partnership, diplomacy, and refined taste. This sign strives for fairness and creates harmony through relationship.'
  },
  'Scorpio': {
    element: 'Water',
    modality: 'Fixed',
    ruler: 'Pluto',
    keywords: ['Transformation', 'Intensity', 'Power', 'Depth', 'Regeneration'],
    description: 'The Scorpion - Powerful and penetrating, Scorpio delves into hidden depths and embraces transformation. This sign represents psychological insight, passion, and rebirth through crisis.'
  },
  'Sagittarius': {
    element: 'Fire',
    modality: 'Mutable',
    ruler: 'Jupiter',
    keywords: ['Expansion', 'Philosophy', 'Adventure', 'Optimism', 'Wisdom'],
    description: 'The Archer - Freedom-loving and philosophical, Sagittarius seeks meaning through exploration and higher learning. This sign represents faith, truth-seeking, and boundless enthusiasm.'
  },
  'Capricorn': {
    element: 'Earth',
    modality: 'Cardinal',
    ruler: 'Saturn',
    keywords: ['Ambition', 'Structure', 'Discipline', 'Authority', 'Achievement'],
    description: 'The Goat - Ambitious and responsible, Capricorn builds lasting structures through disciplined effort. This sign represents mastery, tradition, and the achievement of long-term goals.'
  },
  'Aquarius': {
    element: 'Air',
    modality: 'Fixed',
    ruler: 'Uranus',
    keywords: ['Innovation', 'Humanity', 'Independence', 'Progress', 'Originality'],
    description: 'The Water Bearer - Visionary and unconventional, Aquarius represents collective consciousness and progressive ideals. This sign champions individuality while working for the greater good.'
  },
  'Pisces': {
    element: 'Water',
    modality: 'Mutable',
    ruler: 'Neptune',
    keywords: ['Compassion', 'Imagination', 'Spirituality', 'Empathy', 'Transcendence'],
    description: 'The Fish - Deeply sensitive and boundless, Pisces dissolves boundaries through compassion and creative imagination. This sign represents universal love, mysticism, and artistic inspiration.'
  }
}

export const PLANETARY_DIGNITIES: Record<string, PlanetaryDignity> = {
  'Sun': {
    domicile: ['Leo'],
    exaltation: 'Aries',
    detriment: ['Aquarius'],
    fall: 'Libra'
  },
  'Moon': {
    domicile: ['Cancer'],
    exaltation: 'Taurus',
    detriment: ['Capricorn'],
    fall: 'Scorpio'
  },
  'Mercury': {
    domicile: ['Gemini', 'Virgo'],
    exaltation: 'Virgo',
    detriment: ['Sagittarius', 'Pisces'],
    fall: 'Pisces'
  },
  'Venus': {
    domicile: ['Taurus', 'Libra'],
    exaltation: 'Pisces',
    detriment: ['Scorpio', 'Aries'],
    fall: 'Virgo'
  },
  'Mars': {
    domicile: ['Aries', 'Scorpio'],
    exaltation: 'Capricorn',
    detriment: ['Libra', 'Taurus'],
    fall: 'Cancer'
  },
  'Jupiter': {
    domicile: ['Sagittarius', 'Pisces'],
    exaltation: 'Cancer',
    detriment: ['Gemini', 'Virgo'],
    fall: 'Capricorn'
  },
  'Saturn': {
    domicile: ['Capricorn', 'Aquarius'],
    exaltation: 'Libra',
    detriment: ['Cancer', 'Leo'],
    fall: 'Aries'
  },
  'Uranus': {
    domicile: ['Aquarius'],
    exaltation: 'Scorpio',
    detriment: ['Leo'],
    fall: 'Taurus'
  },
  'Neptune': {
    domicile: ['Pisces'],
    exaltation: 'Cancer',
    detriment: ['Virgo'],
    fall: 'Capricorn'
  },
  'Pluto': {
    domicile: ['Scorpio'],
    exaltation: 'Aries',
    detriment: ['Taurus'],
    fall: 'Libra'
  }
}

export function getPlanetaryDignity(planetName: string, sign: ZodiacSign): string | null {
  const dignity = PLANETARY_DIGNITIES[planetName]
  if (!dignity) return null

  if (dignity.domicile.includes(sign)) {
    return 'Domicile'
  }
  if (dignity.exaltation === sign) {
    return 'Exaltation'
  }
  if (dignity.detriment && dignity.detriment.includes(sign)) {
    return 'Detriment'
  }
  if (dignity.fall === sign) {
    return 'Fall'
  }
  return null
}

export function getDignityDescription(dignityType: string): string {
  const descriptions: Record<string, string> = {
    'Domicile': 'At home - Planet functions naturally and powerfully',
    'Exaltation': 'Honored guest - Planet expresses its highest qualities',
    'Detriment': 'In opposition - Planet faces challenges in expression',
    'Fall': 'Weakened - Planet struggles to manifest its nature'
  }
  return descriptions[dignityType] || ''
}

export function getDignityColor(dignityType: string): string {
  const colors: Record<string, string> = {
    'Domicile': 'oklch(0.70 0.20 150)',
    'Exaltation': 'oklch(0.78 0.15 85)',
    'Detriment': 'oklch(0.60 0.22 40)',
    'Fall': 'oklch(0.55 0.22 25)'
  }
  return colors[dignityType] || 'oklch(0.70 0.02 270)'
}
