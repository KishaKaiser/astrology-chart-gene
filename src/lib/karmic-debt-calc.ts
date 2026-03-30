import { ChartData, Planet } from './astrology-types'

export interface NumerologyDebt {
  debtNumber: string
  area: string
  description: string
  pastLifePattern: string
  resolution: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface AstrologicalDebt {
  indicator: string
  placement: string
  karmicMeaning: string
  lifeChallenge: string
  pathToBalance: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ResolutionPath {
  area: string
  challenge: string
  actions: string[]
  outcome: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
}

export interface KarmicDebtResult {
  chartId: string
  birthName: string
  totalDebtScore: number
  numerologyDebts: NumerologyDebt[]
  astrologicalDebts: AstrologicalDebt[]
  resolutionPaths: ResolutionPath[]
  aiGuidance?: string
  calculatedAt: number
}

function calculateNameNumber(name: string): number {
  const values: Record<string, number> = {
    'A': 1, 'J': 1, 'S': 1,
    'B': 2, 'K': 2, 'T': 2,
    'C': 3, 'L': 3, 'U': 3,
    'D': 4, 'M': 4, 'V': 4,
    'E': 5, 'N': 5, 'W': 5,
    'F': 6, 'O': 6, 'X': 6,
    'G': 7, 'P': 7, 'Y': 7,
    'H': 8, 'Q': 8, 'Z': 8,
    'I': 9, 'R': 9
  }

  const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '')
  let sum = 0
  
  for (const char of cleanName) {
    sum += values[char] || 0
  }
  
  return sum
}

function reduceToSingleDigit(num: number): { finalDigit: number; karmicNumbers: number[] } {
  const karmicNumbers: number[] = []
  let current = num
  
  while (current > 9 && current !== 11 && current !== 22 && current !== 33) {
    if (current === 13 || current === 14 || current === 16 || current === 19) {
      karmicNumbers.push(current)
    }
    
    const digits = current.toString().split('').map(Number)
    current = digits.reduce((sum, digit) => sum + digit, 0)
  }
  
  return { finalDigit: current, karmicNumbers }
}

function analyzeKarmicDebtNumbers(karmicNumbers: number[]): NumerologyDebt[] {
  const debts: NumerologyDebt[] = []
  
  if (karmicNumbers.includes(13)) {
    debts.push({
      debtNumber: 'Karmic Debt 13',
      area: 'Laziness & Superficiality',
      description: 'The karmic debt 13 represents past life patterns of taking shortcuts, avoiding hard work, and manipulating others to do your work for you.',
      pastLifePattern: 'In previous incarnations, you may have been self-centered, lazy, or unwilling to complete tasks. You sought the easy way out and let others carry your burdens.',
      resolution: 'Focus on discipline, commitment, and completing what you start. Transform obstacles into opportunities for growth. Develop a strong work ethic and reliability.',
      severity: 'high'
    })
  }
  
  if (karmicNumbers.includes(14)) {
    debts.push({
      debtNumber: 'Karmic Debt 14',
      area: 'Freedom & Commitment',
      description: 'The karmic debt 14 indicates past life abuse of freedom, including substance abuse, sexual excess, or reckless behavior that harmed yourself and others.',
      pastLifePattern: 'You may have lived lives focused on immediate gratification, sensory pleasures, and personal freedom at the expense of responsibility and consideration for others.',
      resolution: 'Learn moderation in all things. Develop self-discipline and healthy boundaries. Use your freedom constructively to help others. Balance pleasure with responsibility.',
      severity: 'critical'
    })
  }
  
  if (karmicNumbers.includes(16)) {
    debts.push({
      debtNumber: 'Karmic Debt 16',
      area: 'Ego & Relationships',
      description: 'The karmic debt 16 reflects a fall from grace due to ego, pride, and selfishness in relationships. This is about learning humility through loss.',
      pastLifePattern: 'In past lives, you may have destroyed relationships through arrogance, infidelity, or putting yourself above others. You may have used your charisma or position to manipulate.',
      resolution: 'Cultivate genuine humility and empathy. Rebuild trust through consistent, honest behavior. Accept that losses are teaching tools. Put others\' needs alongside your own.',
      severity: 'critical'
    })
  }
  
  if (karmicNumbers.includes(19)) {
    debts.push({
      debtNumber: 'Karmic Debt 19',
      area: 'Power & Independence',
      description: 'The karmic debt 19 stems from misuse of power and refusing to help others. You may have been a tyrant, oppressor, or someone who abused authority.',
      pastLifePattern: 'Past lives involved wielding power selfishly, refusing assistance to those in need, or demanding others serve you without reciprocity.',
      resolution: 'Learn to serve others selflessly. Share your power and resources. Develop independence without arrogance. Help others without expecting return.',
      severity: 'high'
    })
  }
  
  return debts
}

function getSouthNode(chart: ChartData): Planet | null {
  const northNode = chart.planets.find(p => p.name === 'True Node' || p.name === 'North Node')
  if (!northNode) return null

  const southNodeLongitude = (northNode.longitude + 180) % 360
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
  const signIndex = Math.floor(southNodeLongitude / 30)
  
  let southNodeHouse = 1
  const houses = chart.houses
  for (let i = 0; i < houses.length; i++) {
    const currentCusp = houses[i].cusp
    const nextCusp = houses[(i + 1) % houses.length].cusp
    
    if (nextCusp > currentCusp) {
      if (southNodeLongitude >= currentCusp && southNodeLongitude < nextCusp) {
        southNodeHouse = i + 1
        break
      }
    } else {
      if (southNodeLongitude >= currentCusp || southNodeLongitude < nextCusp) {
        southNodeHouse = i + 1
        break
      }
    }
  }

  return {
    name: 'South Node',
    symbol: '☋',
    longitude: southNodeLongitude,
    sign: signs[signIndex],
    degree: southNodeLongitude % 30,
    house: southNodeHouse
  }
}

function analyzeAstrologicalDebts(chart: ChartData): AstrologicalDebt[] {
  const debts: AstrologicalDebt[] = []
  
  const southNode = getSouthNode(chart)
  if (southNode) {
    const severity = [1, 4, 7, 10].includes(southNode.house) ? 'critical' : 
                     [2, 5, 8, 11].includes(southNode.house) ? 'high' : 'medium'
    
    debts.push({
      indicator: `South Node in ${southNode.sign}`,
      placement: `House ${southNode.house}`,
      karmicMeaning: `Your soul's comfort zone from past lives. In ${southNode.sign}, you mastered certain traits but may have overused them or used them inappropriately.`,
      lifeChallenge: getHouseChallenge(southNode.house, southNode.sign),
      pathToBalance: `Move toward your North Node (opposite sign and house) while releasing over-reliance on ${southNode.sign} patterns.`,
      severity
    })
  }
  
  const saturn = chart.planets.find(p => p.name === 'Saturn')
  if (saturn) {
    const severity = [1, 4, 7, 10].includes(saturn.house) ? 'critical' : 
                     [8, 12].includes(saturn.house) ? 'high' : 'medium'
    
    debts.push({
      indicator: `Saturn in ${saturn.sign}`,
      placement: `House ${saturn.house}`,
      karmicMeaning: 'Saturn represents your greatest karmic lessons and responsibilities. This placement shows where you must develop mastery through discipline and patience.',
      lifeChallenge: getSaturnChallenge(saturn.house, saturn.sign),
      pathToBalance: `Accept Saturn's lessons with maturity. Work consistently in this area without resistance. Time and effort will bring mastery and respect.`,
      severity
    })
  }
  
  const pluto = chart.planets.find(p => p.name === 'Pluto')
  if (pluto) {
    const severity = [8, 12, 4].includes(pluto.house) ? 'critical' : 
                     [1, 7].includes(pluto.house) ? 'high' : 'medium'
    
    debts.push({
      indicator: `Pluto in ${pluto.sign}`,
      placement: `House ${pluto.house}`,
      karmicMeaning: 'Pluto reveals areas requiring deep transformation and where you\'ve experienced power struggles or trauma across lifetimes.',
      lifeChallenge: getPlutoChallenge(pluto.house, pluto.sign),
      pathToBalance: `Embrace transformation in this area. Release control and power struggles. Allow death and rebirth cycles to transform you completely.`,
      severity
    })
  }
  
  const chiron = chart.planets.find(p => p.name === 'Chiron')
  if (chiron) {
    debts.push({
      indicator: `Chiron (Wounded Healer) in ${chiron.sign}`,
      placement: `House ${chiron.house}`,
      karmicMeaning: 'Chiron represents your deepest wound carried from past lives - and paradoxically, your greatest healing gift to offer others.',
      lifeChallenge: getChironChallenge(chiron.house, chiron.sign),
      pathToBalance: `Heal yourself first, then use your experience to help others with similar wounds. Your pain becomes your purpose and gift.`,
      severity: 'medium'
    })
  }
  
  const retrogradeCount = chart.planets.filter(p => 
    ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'].includes(p.name) && 
    (p as any).isRetrograde
  ).length
  
  if (retrogradeCount >= 3) {
    debts.push({
      indicator: `${retrogradeCount} Personal Planets Retrograde`,
      placement: 'Multiple planets moving backward',
      karmicMeaning: 'Multiple retrogrades indicate an old soul with unfinished business from past lives. You\'re here to review and master lessons you didn\'t complete before.',
      lifeChallenge: 'You may feel out of step with your generation, prefer reflection over action, or need to rework things from previous attempts.',
      pathToBalance: 'Honor your need for introspection. You\'re meant to take your time and get things right this time. Trust your internal processing.',
      severity: 'medium'
    })
  }
  
  return debts.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}

function getHouseChallenge(house: number, sign: string): string {
  const challenges: Record<number, string> = {
    1: `Your past life identity in ${sign} may dominate your current life, preventing growth.`,
    2: `You over-relied on ${sign} values and possessions, now must develop new resources.`,
    3: `Communication and learning patterns from ${sign} need updating and refinement.`,
    4: `Family karma and emotional patterns from ${sign} require healing and release.`,
    5: `Creative self-expression in ${sign} was misused; now needs authentic expression.`,
    6: `Service and health patterns from ${sign} were neglected or obsessive.`,
    7: `Relationship patterns from ${sign} were co-dependent or dominating.`,
    8: `Power, intimacy, and transformation in ${sign} involved control or victimhood.`,
    9: `Beliefs and philosophies in ${sign} were dogmatic or caused harm.`,
    10: `Public role and authority in ${sign} was abused or neglected.`,
    11: `Group involvement in ${sign} excluded others or lacked authentic connection.`,
    12: `Spiritual escapism or martyrdom in ${sign} avoided real-world responsibility.`
  }
  return challenges[house] || `Lessons from ${sign} need integration and balance.`
}

function getSaturnChallenge(house: number, sign: string): string {
  const challenges: Record<number, string> = {
    1: `Building authentic self-identity and confidence despite ${sign} restrictions.`,
    2: `Developing financial security and self-worth through ${sign} discipline.`,
    3: `Learning to communicate with authority and clarity in ${sign} expression.`,
    4: `Healing family wounds and creating emotional stability through ${sign} maturity.`,
    5: `Expressing creativity and joy despite ${sign} fears of judgment.`,
    6: `Establishing healthy routines and service through ${sign} responsibility.`,
    7: `Committing to relationships with ${sign} boundaries and maturity.`,
    8: `Transforming through loss and intimacy with ${sign} wisdom.`,
    9: `Building philosophy and faith through ${sign} life experience.`,
    10: `Achieving career mastery and public respect through ${sign} persistence.`,
    11: `Creating lasting friendships and social contributions through ${sign} loyalty.`,
    12: `Developing spiritual maturity and releasing isolation through ${sign} wisdom.`
  }
  return challenges[house] || `Mastering discipline and responsibility in ${sign} qualities.`
}

function getPlutoChallenge(house: number, sign: string): string {
  const challenges: Record<number, string> = {
    1: `Transforming your entire identity and releasing ${sign} control over self-image.`,
    2: `Undergoing financial and value transformation, releasing ${sign} attachment.`,
    3: `Transforming how you think and communicate, releasing ${sign} mental patterns.`,
    4: `Deep family healing and releasing ${sign} emotional inheritance.`,
    5: `Transforming creative expression and romance, releasing ${sign} ego patterns.`,
    6: `Healing through work and health crises, transforming ${sign} service patterns.`,
    7: `Experiencing relationship death-rebirth cycles, transforming ${sign} relating patterns.`,
    8: `Complete transformation through loss, intimacy, and shared resources in ${sign}.`,
    9: `Philosophical and belief transformation, releasing ${sign} dogma.`,
    10: `Career and reputation transformation, releasing ${sign} public masks.`,
    11: `Friendship and social transformation, releasing ${sign} group identity.`,
    12: `Spiritual transformation through surrender, releasing ${sign} ego structures.`
  }
  return challenges[house] || `Deep transformation required in ${sign} expression.`
}

function getChironChallenge(house: number, sign: string): string {
  const challenges: Record<number, string> = {
    1: `Wounded sense of self and identity in ${sign} expression.`,
    2: `Wounded relationship with money, possessions, and ${sign} values.`,
    3: `Wounded communication and learning in ${sign} expression.`,
    4: `Deep family wounds and ${sign} emotional pain from childhood.`,
    5: `Wounded creativity, romance, and ${sign} self-expression.`,
    6: `Health wounds and wounded service in ${sign} work patterns.`,
    7: `Relationship wounds and ${sign} partnership pain.`,
    8: `Wounds around intimacy, loss, and ${sign} transformation.`,
    9: `Wounded beliefs and ${sign} spiritual/philosophical pain.`,
    10: `Career wounds and ${sign} public humiliation or failure.`,
    11: `Friendship wounds and ${sign} social rejection or isolation.`,
    12: `Spiritual wounds and ${sign} connection to the divine.`
  }
  return challenges[house] || `Deep wounding in ${sign} that becomes healing wisdom.`
}

function generateResolutionPaths(
  numerologyDebts: NumerologyDebt[],
  astrologicalDebts: AstrologicalDebt[]
): ResolutionPath[] {
  const paths: ResolutionPath[] = []
  
  const highDebts = [...numerologyDebts, ...astrologicalDebts].filter(d => d.severity === 'critical' || d.severity === 'high')
  
  highDebts.forEach(debt => {
    if ('debtNumber' in debt) {
      const numerologyDebt = debt as NumerologyDebt
      paths.push({
        area: numerologyDebt.area,
        challenge: numerologyDebt.description,
        actions: generateActionsForNumerology(numerologyDebt),
        outcome: `Freedom from ${numerologyDebt.area.toLowerCase()} patterns and soul evolution`,
        priority: numerologyDebt.severity === 'critical' ? 'Critical' : 'High'
      })
    } else {
      const astroDebt = debt as AstrologicalDebt
      paths.push({
        area: astroDebt.indicator,
        challenge: astroDebt.lifeChallenge,
        actions: generateActionsForAstrology(astroDebt),
        outcome: astroDebt.pathToBalance,
        priority: astroDebt.severity === 'critical' ? 'Critical' : 'High'
      })
    }
  })
  
  if (paths.length === 0) {
    paths.push({
      area: 'General Soul Growth',
      challenge: 'Continue developing spiritual awareness and compassion',
      actions: [
        'Practice daily meditation or contemplation',
        'Help others without expectation of return',
        'Study spiritual wisdom from various traditions',
        'Develop intuition and inner guidance'
      ],
      outcome: 'Continued soul evolution and spiritual awakening',
      priority: 'Medium'
    })
  }
  
  return paths.slice(0, 5)
}

function generateActionsForNumerology(debt: NumerologyDebt): string[] {
  const actionMap: Record<string, string[]> = {
    'Laziness & Superficiality': [
      'Complete one task fully before starting another',
      'Keep commitments no matter how small',
      'Face obstacles directly instead of avoiding them',
      'Take responsibility for your own work and decisions'
    ],
    'Freedom & Commitment': [
      'Practice moderation in pleasure-seeking activities',
      'Establish healthy routines and stick to them',
      'Consider consequences before acting on impulses',
      'Balance personal freedom with responsibility to others'
    ],
    'Ego & Relationships': [
      'Practice genuine humility in daily interactions',
      'Apologize sincerely when you\'re wrong',
      'Listen to understand rather than to respond',
      'Put others\' needs on equal footing with your own'
    ],
    'Power & Independence': [
      'Volunteer or help others without seeking recognition',
      'Share your resources and knowledge freely',
      'Ask for help when needed - interdependence is strength',
      'Empower others rather than dominating them'
    ]
  }
  
  return actionMap[debt.area] || [
    'Reflect on this pattern in your life',
    'Seek professional guidance if needed',
    'Practice awareness when the pattern emerges',
    'Make different choices consistently over time'
  ]
}

function generateActionsForAstrology(debt: AstrologicalDebt): string[] {
  if (debt.indicator.includes('South Node')) {
    return [
      'Identify when you\'re falling back into comfortable old patterns',
      'Consciously develop opposite sign qualities (North Node)',
      'Notice what triggers regression to South Node behavior',
      'Celebrate small steps toward your North Node growth'
    ]
  } else if (debt.indicator.includes('Saturn')) {
    return [
      'Accept that mastery takes time in this area',
      'Work consistently without expecting quick results',
      'View restrictions as teachers rather than enemies',
      'Build slowly and solidly rather than seeking shortcuts'
    ]
  } else if (debt.indicator.includes('Pluto')) {
    return [
      'Surrender control and trust the transformation process',
      'Face your shadows and hidden aspects directly',
      'Release attachments that no longer serve growth',
      'Embrace endings as necessary for new beginnings'
    ]
  } else if (debt.indicator.includes('Chiron')) {
    return [
      'Acknowledge your wound without shame',
      'Seek healing through therapy, counseling, or spiritual work',
      'Use your healing journey to help others with similar pain',
      'Transform your wound into your greatest gift to the world'
    ]
  } else {
    return [
      'Study this placement in depth',
      'Journal about how it manifests in your life',
      'Work with an astrologer for personalized guidance',
      'Be patient with karmic timing and lessons'
    ]
  }
}

function calculateTotalScore(
  numerologyDebts: NumerologyDebt[],
  astrologicalDebts: AstrologicalDebt[]
): number {
  const severityPoints = { critical: 25, high: 15, medium: 8, low: 3 }
  
  const numScore = numerologyDebts.reduce((sum, debt) => sum + severityPoints[debt.severity], 0)
  const astroScore = astrologicalDebts.reduce((sum, debt) => sum + severityPoints[debt.severity], 0)
  
  return Math.min(100, numScore + astroScore)
}

export async function calculateKarmicDebt(
  chart: ChartData,
  birthName: string
): Promise<KarmicDebtResult> {
  const nameNumber = calculateNameNumber(birthName)
  const { finalDigit, karmicNumbers } = reduceToSingleDigit(nameNumber)
  
  const numerologyDebts = analyzeKarmicDebtNumbers(karmicNumbers)
  const astrologicalDebts = analyzeAstrologicalDebts(chart)
  const resolutionPaths = generateResolutionPaths(numerologyDebts, astrologicalDebts)
  const totalDebtScore = calculateTotalScore(numerologyDebts, astrologicalDebts)
  
  let aiGuidance: string | undefined
  
  try {
    const debtSummary = [
      `Name: ${birthName}`,
      `Life Path considerations: ${finalDigit}`,
      `Karmic Debt Numbers: ${karmicNumbers.join(', ') || 'None'}`,
      `Numerology Debts: ${numerologyDebts.map(d => d.area).join(', ') || 'None'}`,
      `Key Astrological Indicators: ${astrologicalDebts.slice(0, 3).map(d => d.indicator).join(', ')}`,
      `Total Karmic Score: ${totalDebtScore}/100`
    ].join('\n')
    
    const promptText = `You are a wise karmic counselor combining numerology and astrology. Based on this karmic debt analysis, provide compassionate spiritual guidance (3-4 paragraphs):

${debtSummary}

Focus on:
1. The soul's journey and purpose behind these karmic debts
2. How these challenges are opportunities for spiritual growth
3. Encouragement and practical wisdom for the healing journey
4. The gifts that will emerge from resolving these debts

Write in a warm, encouraging tone. This person is brave for seeking karmic awareness.`
    
    aiGuidance = await window.spark.llm(promptText, 'gpt-4o')
  } catch (error) {
    console.error('Failed to generate AI guidance:', error)
  }
  
  return {
    chartId: chart.id,
    birthName,
    totalDebtScore,
    numerologyDebts,
    astrologicalDebts,
    resolutionPaths,
    aiGuidance,
    calculatedAt: Date.now()
  }
}
