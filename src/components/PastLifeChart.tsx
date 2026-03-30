import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { ChartData } from '@/lib/astrology-types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sparkle, Moon, Eye, ClockCounterClockwise, MagicWand } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface PastLifeReading {
  southNodeSign: string
  southNodeHouse: number
  saturnsSign: string
  saturnsHouse: number
  plutosSign: string
  plutosHouse: number
  primaryLifeTheme: string
  lifeEra: string
  occupation: string
  challenges: string[]
  karmaLessons: string[]
  talents: string[]
  interpretation: string
}

export function PastLifeChart() {
  const [charts] = useKV<ChartData[]>('astrology-charts', [])
  const [selectedChartId, setSelectedChartId] = useState<string>('')
  const [pastLifeReading, setPastLifeReading] = useState<PastLifeReading | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const calculatePastLifeIndicators = (chart: ChartData) => {
    const southNode = chart.planets.find(p => p.name === 'South Node' || p.name === 'True Node')
    const saturn = chart.planets.find(p => p.name === 'Saturn')
    const pluto = chart.planets.find(p => p.name === 'Pluto')

    let southNodeSign = 'Unknown'
    let southNodeHouse = 1

    if (southNode) {
      const northNodeLongitude = southNode.longitude
      let southNodeLongitude = (northNodeLongitude + 180) % 360
      
      const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
      const signIndex = Math.floor(southNodeLongitude / 30)
      southNodeSign = signs[signIndex]

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
    }

    return {
      southNodeSign,
      southNodeHouse,
      saturnsSign: saturn?.sign || 'Unknown',
      saturnsHouse: saturn?.house || 1,
      plutosSign: pluto?.sign || 'Unknown',
      plutosHouse: pluto?.house || 1,
    }
  }

  const handleGeneratePastLife = async () => {
    if (!selectedChartId) {
      toast.error('Please select a natal chart')
      return
    }

    const chart = charts?.find(c => c.id === selectedChartId)
    if (!chart) {
      toast.error('Could not find selected chart')
      return
    }

    setIsGenerating(true)
    setPastLifeReading(null)

    try {
      const indicators = calculatePastLifeIndicators(chart)

      const prompt = (window.spark.llmPrompt as any)`You are an expert astrologer specializing in karmic astrology and past life regression analysis.

Analyze this person's natal chart to reveal insights about their past life experiences:

Name: ${chart.name}
Birth: ${chart.date} at ${chart.time} in ${chart.location}

Karmic Indicators:
- South Node (past life point): ${indicators.southNodeSign} in House ${indicators.southNodeHouse}
- Saturn (karmic teacher): ${indicators.saturnsSign} in House ${indicators.saturnsHouse}
- Pluto (transformation): ${indicators.plutosSign} in House ${indicators.plutosHouse}

Sun Sign: ${chart.planets.find(p => p.name === 'Sun')?.sign || 'Unknown'}
Moon Sign: ${chart.planets.find(p => p.name === 'Moon')?.sign || 'Unknown'}

Based on these karmic indicators, provide a detailed past life reading in the following JSON format:
{
  "primaryLifeTheme": "A concise 2-4 word theme describing the main focus of the past life",
  "lifeEra": "The historical era or time period (e.g., 'Medieval Europe', 'Ancient Egypt', 'Victorian Era', etc.)",
  "occupation": "The likely profession or social role they held",
  "challenges": ["3-5 specific challenges or difficulties they faced"],
  "karmaLessons": ["3-5 karmic lessons they need to integrate in this lifetime"],
  "talents": ["3-5 natural talents or abilities carried forward from the past life"],
  "interpretation": "A detailed 4-6 paragraph narrative interpretation that weaves together all the karmic indicators. Describe their past life story, relationships, accomplishments, unfinished business, and how it relates to their current life purpose. Make it vivid, specific, and personally resonant."
}

Important: Ensure the interpretation is deeply personal, evocative, and connects past life themes to current life challenges and gifts.`

      const response = await window.spark.llm(prompt, 'gpt-4o', true)
      const parsedResponse = JSON.parse(response)

      const reading: PastLifeReading = {
        ...indicators,
        ...parsedResponse
      }

      setPastLifeReading(reading)
      toast.success('Past life reading complete!')
    } catch (error) {
      console.error('Past life reading error:', error)
      toast.error('Failed to generate past life reading')
    } finally {
      setIsGenerating(false)
    }
  }

  const getSignColor = (sign: string) => {
    const element = {
      'Aries': 'fire', 'Leo': 'fire', 'Sagittarius': 'fire',
      'Taurus': 'earth', 'Virgo': 'earth', 'Capricorn': 'earth',
      'Gemini': 'air', 'Libra': 'air', 'Aquarius': 'air',
      'Cancer': 'water', 'Scorpio': 'water', 'Pisces': 'water',
    }[sign] || 'air'

    return {
      'fire': 'bg-red-500/20 text-red-300 border-red-500/40',
      'earth': 'bg-green-500/20 text-green-300 border-green-500/40',
      'air': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      'water': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    }[element]
  }

  if (!charts || charts.length === 0) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockCounterClockwise className="w-6 h-6" weight="fill" />
            Past Life Reading
          </CardTitle>
          <CardDescription>
            Explore karmic patterns and past life influences through your natal chart
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Moon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" weight="fill" />
            <p className="text-muted-foreground mb-4">
              You need to create a natal chart first to access past life readings.
            </p>
            <p className="text-sm text-muted-foreground">
              Switch to the Chart Library tab and generate your first chart.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ClockCounterClockwise className="w-6 h-6" weight="fill" />
            Past Life Reading
          </CardTitle>
          <CardDescription className="text-white">
            Discover your karmic patterns and past life influences through astrological analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Select Your Natal Chart</label>
              <Select value={selectedChartId} onValueChange={setSelectedChartId}>
                <SelectTrigger className="text-white">
                  <SelectValue placeholder="Choose a chart..." />
                </SelectTrigger>
                <SelectContent>
                  {charts.map(chart => (
                    <SelectItem key={chart.id} value={chart.id}>
                      {chart.name} ({new Date(chart.createdAt).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGeneratePastLife}
              disabled={!selectedChartId || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <MagicWand className="mr-2 animate-spin" weight="fill" />
                  Accessing Akashic Records...
                </>
              ) : (
                <>
                  <Eye className="mr-2" weight="fill" />
                  Reveal Past Life
                </>
              )}
            </Button>
          </div>

          {isGenerating && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <Separator />
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          )}

          {pastLifeReading && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-card/50 border-accent/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-white">
                      <Sparkle weight="fill" />
                      Life Theme
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-accent">{pastLifeReading.primaryLifeTheme}</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-accent/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-white">
                      <ClockCounterClockwise weight="fill" />
                      Era
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-accent">{pastLifeReading.lifeEra}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card/50 border-accent/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white">Past Life Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl text-white">{pastLifeReading.occupation}</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-6">
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-white">Karmic Indicators</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">South Node (Past Life Point)</span>
                      <Badge className={getSignColor(pastLifeReading.southNodeSign)}>
                        {pastLifeReading.southNodeSign} in House {pastLifeReading.southNodeHouse}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Saturn (Karmic Teacher)</span>
                      <Badge className={getSignColor(pastLifeReading.saturnsSign)}>
                        {pastLifeReading.saturnsSign} in House {pastLifeReading.saturnsHouse}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Pluto (Transformation)</span>
                      <Badge className={getSignColor(pastLifeReading.plutosSign)}>
                        {pastLifeReading.plutosSign} in House {pastLifeReading.plutosHouse}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-white">Challenges Faced</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {pastLifeReading.challenges.map((challenge, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-accent mt-1">•</span>
                          <span className="text-white">{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-white">Karmic Lessons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {pastLifeReading.karmaLessons.map((lesson, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-accent mt-1">✦</span>
                          <span className="text-white">{lesson}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-white">Gifts & Talents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {pastLifeReading.talents.map((talent, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-accent mt-1">★</span>
                          <span className="text-white">{talent}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-br from-accent/10 via-card/50 to-primary/10 border-accent/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Moon weight="fill" />
                    Your Past Life Story
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    {pastLifeReading.interpretation.split('\n\n').map((paragraph, i) => (
                      <p key={i} className="text-white leading-relaxed mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
