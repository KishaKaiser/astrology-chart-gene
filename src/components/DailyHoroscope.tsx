import { useState, useEffect } from 'react'
import { useKV } from '@/hooks/use-kv'
import { ChartData, TransitData } from '@/lib/astrology-types'
import { calculateCurrentTransits } from '@/lib/astrology-calc'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkle, CalendarBlank, ArrowsClockwise, Calendar, CalendarDots } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { llm, llmPrompt } from "@/lib/llm"

interface DailyHoroscopeProps {
  chart: ChartData
}

type TimeframePeriod = 'daily' | 'weekly' | 'monthly'

interface HoroscopeReading {
  content: string
  generatedAt: number
  transitData?: TransitData
}

export function DailyHoroscope({ chart }: DailyHoroscopeProps) {
  const [transits, setTransits] = useState<TransitData | null>(null)
  const [savedHoroscopes, setSavedHoroscopes] = useKV<Record<string, HoroscopeReading>>('personal-horoscopes', {})
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<TimeframePeriod>('daily')

  const getHoroscopeKey = (timeframe: TimeframePeriod) => `${chart.id}-${timeframe}`

  const dailyHoroscope = savedHoroscopes?.[getHoroscopeKey('daily')]?.content || ''
  const weeklyHoroscope = savedHoroscopes?.[getHoroscopeKey('weekly')]?.content || ''
  const monthlyHoroscope = savedHoroscopes?.[getHoroscopeKey('monthly')]?.content || ''
  
  const lastGeneratedDaily = savedHoroscopes?.[getHoroscopeKey('daily')]?.generatedAt 
    ? new Date(savedHoroscopes[getHoroscopeKey('daily')].generatedAt) 
    : null
  const lastGeneratedWeekly = savedHoroscopes?.[getHoroscopeKey('weekly')]?.generatedAt 
    ? new Date(savedHoroscopes[getHoroscopeKey('weekly')].generatedAt) 
    : null
  const lastGeneratedMonthly = savedHoroscopes?.[getHoroscopeKey('monthly')]?.generatedAt 
    ? new Date(savedHoroscopes[getHoroscopeKey('monthly')].generatedAt) 
    : null

  useEffect(() => {
    loadTransits()
  }, [chart])

  const loadTransits = async () => {
    try {
      const currentTransits = await calculateCurrentTransits(chart)
      setTransits(currentTransits)
    } catch (error) {
      console.error('Error calculating transits:', error)
      toast.error('Failed to calculate current transits')
    }
  }

  const generateHoroscope = async (timeframe: TimeframePeriod) => {
    if (!transits) {
      toast.error('Transits not available')
      return
    }

    setIsGenerating(true)
    try {
      const sun = chart.planets.find(p => p.name === 'Sun')
      const moon = chart.planets.find(p => p.name === 'Moon')
      const rising = chart.houses.find(h => h.number === 1)

      const transitSun = transits.planets.find(p => p.name === 'Sun')
      const transitMoon = transits.planets.find(p => p.name === 'Moon')
      const transitMercury = transits.planets.find(p => p.name === 'Mercury')
      const transitVenus = transits.planets.find(p => p.name === 'Venus')
      const transitMars = transits.planets.find(p => p.name === 'Mars')

      const significantAspects = transits.aspects
        .filter(a => ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'].includes(a.transitPlanet))
        .slice(0, timeframe === 'daily' ? 8 : 12)

      const aspectsDescription = significantAspects.length > 0
        ? significantAspects.map(a => 
            `${a.transitPlanet} ${a.type} natal ${a.natalPlanet}`
          ).join(', ')
        : 'No major aspects'

      let promptText: string
      
      if (timeframe === 'daily') {
        promptText = llmPrompt`You are an expert astrologer creating a daily horoscope reading based on current planetary transits.

NATAL CHART INFORMATION:
- Name: ${chart.name}
- Sun Sign: ${sun?.sign || 'Unknown'}
- Moon Sign: ${moon?.sign || 'Unknown'}
- Rising Sign: ${rising?.sign || 'Unknown'}

CURRENT TRANSITS (${new Date().toLocaleDateString()}):
- Transiting Sun: ${transitSun?.sign || 'Unknown'} in House ${transitSun?.house || 'Unknown'}
- Transiting Moon: ${transitMoon?.sign || 'Unknown'} in House ${transitMoon?.house || 'Unknown'}

SIGNIFICANT ASPECTS TODAY:
${aspectsDescription}

Create a personalized daily horoscope reading that:
1. Opens with an overall theme for the day based on the current transits
2. Discusses how the transiting planets are activating specific areas of their natal chart
3. Provides practical guidance for the day ahead in the areas of: emotions/mood, relationships, work/productivity, and personal growth
4. Highlights any particularly powerful transits or aspects
5. Ends with an inspiring affirmation or key takeaway

Write in a warm, professional tone that balances mystical insight with practical advice. Keep the reading between 300-400 words. Structure it with clear paragraphs for readability.`
      } else if (timeframe === 'weekly') {
        const today = new Date()
        const weekEnd = new Date(today)
        weekEnd.setDate(today.getDate() + 7)
        
        promptText = llmPrompt`You are an expert astrologer creating a weekly horoscope reading based on planetary transits and movements.

NATAL CHART INFORMATION:
- Name: ${chart.name}
- Sun Sign: ${sun?.sign || 'Unknown'}
- Moon Sign: ${moon?.sign || 'Unknown'}
- Rising Sign: ${rising?.sign || 'Unknown'}

WEEKLY PERIOD: ${today.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}

CURRENT PLANETARY POSITIONS:
- Sun: ${transitSun?.sign || 'Unknown'} in House ${transitSun?.house || 'Unknown'}
- Moon: ${transitMoon?.sign || 'Unknown'} in House ${transitMoon?.house || 'Unknown'}
- Mercury: ${transitMercury?.sign || 'Unknown'}
- Venus: ${transitVenus?.sign || 'Unknown'}
- Mars: ${transitMars?.sign || 'Unknown'}

SIGNIFICANT ASPECTS THIS WEEK:
${aspectsDescription}

Create a personalized weekly horoscope forecast that:
1. Opens with an overview and major themes for the week
2. Highlights the most important planetary movements and how they'll affect different life areas
3. Provides day-by-day guidance noting when energy shifts occur
4. Focuses on key areas: Career & Goals, Relationships & Social Life, Health & Wellness, Personal Growth & Spirituality
5. Identifies the best days for specific activities (starting projects, important conversations, rest/reflection)
6. Notes any challenges to be aware of and how to navigate them
7. Concludes with an empowering message and action steps for the week

Write in an engaging, professional tone that provides both inspiration and practical wisdom. Keep the reading between 500-600 words. Use clear section headings or paragraph breaks for easy reading.`
      } else {
        const today = new Date()
        const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        
        promptText = llmPrompt`You are an expert astrologer creating a monthly horoscope reading based on major planetary transits and cycles.

NATAL CHART INFORMATION:
- Name: ${chart.name}
- Sun Sign: ${sun?.sign || 'Unknown'}
- Moon Sign: ${moon?.sign || 'Unknown'}
- Rising Sign: ${rising?.sign || 'Unknown'}

MONTH: ${monthName}

CURRENT PLANETARY POSITIONS:
- Sun: ${transitSun?.sign || 'Unknown'} in House ${transitSun?.house || 'Unknown'}
- Moon: ${transitMoon?.sign || 'Unknown'} in House ${transitMoon?.house || 'Unknown'}
- Mercury: ${transitMercury?.sign || 'Unknown'}
- Venus: ${transitVenus?.sign || 'Unknown'}
- Mars: ${transitMars?.sign || 'Unknown'}

SIGNIFICANT ASPECTS:
${aspectsDescription}

Create a comprehensive monthly horoscope forecast that:
1. Opens with the overarching themes and energies for the month
2. Breaks down the month into distinct phases (early, mid, late) with different focuses
3. Discusses major planetary transits and their impact on key life areas
4. Provides specific timing for important astrological events (new/full moons, retrogrades, major aspects)
5. Covers all life domains: Career & Finance, Love & Relationships, Health & Vitality, Personal Development, Social & Creative Life
6. Identifies the most auspicious periods for important decisions, launches, or new beginnings
7. Notes potential obstacles or challenging periods and strategies to navigate them
8. Includes reflection questions or intentions to set for the month
9. Concludes with a powerful message about the month's growth opportunities

Write in a wise, insightful tone that weaves together cosmic timing with personal empowerment. Keep the reading between 700-900 words. Use clear section headings for different life areas and time periods within the month.`
      }

      const response = await llm(promptText)
      
      const horoscopeKey = getHoroscopeKey(timeframe)
      setSavedHoroscopes((current) => ({
        ...current,
        [horoscopeKey]: {
          content: response,
          generatedAt: Date.now(),
          transitData: transits
        }
      }))
      
      toast.success(`${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} horoscope generated!`)
    } catch (error) {
      console.error('Error generating horoscope:', error)
      toast.error('Failed to generate horoscope. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const refreshTransits = async () => {
    await loadTransits()
    toast.success('Transits refreshed')
  }

  const getHoroscopeForTab = (tab: TimeframePeriod) => {
    if (tab === 'daily') return dailyHoroscope
    if (tab === 'weekly') return weeklyHoroscope
    return monthlyHoroscope
  }

  const getLastGeneratedForTab = (tab: TimeframePeriod) => {
    if (tab === 'daily') return lastGeneratedDaily
    if (tab === 'weekly') return lastGeneratedWeekly
    return lastGeneratedMonthly
  }

  const getTabLabel = (tab: TimeframePeriod) => {
    if (tab === 'daily') return 'Daily'
    if (tab === 'weekly') return 'Weekly'
    return 'Monthly'
  }

  const getTabIcon = (tab: TimeframePeriod) => {
    if (tab === 'daily') return <CalendarBlank weight="bold" size={16} />
    if (tab === 'weekly') return <Calendar weight="bold" size={16} />
    return <CalendarDots weight="bold" size={16} />
  }

  const getTabDescription = (tab: TimeframePeriod) => {
    if (tab === 'daily') return 'Daily guidance based on current transits'
    if (tab === 'weekly') return 'Weekly forecast and major themes'
    return 'Monthly overview and key periods'
  }

  return (
    <div className="space-y-6">
      <Card className="border-accent/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkle className="text-accent" weight="fill" size={24} />
                Horoscope Forecasts
              </CardTitle>
              <CardDescription>
                Personalized predictions based on planetary transits
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshTransits}
              disabled={isGenerating}
            >
              <ArrowsClockwise weight="bold" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TimeframePeriod)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily" className="gap-2">
                {getTabIcon('daily')}
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly" className="gap-2">
                {getTabIcon('weekly')}
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="gap-2">
                {getTabIcon('monthly')}
                Monthly
              </TabsTrigger>
            </TabsList>

            {(['daily', 'weekly', 'monthly'] as TimeframePeriod[]).map((timeframe) => (
              <TabsContent key={timeframe} value={timeframe} className="space-y-4 mt-6">
                {transits && (
                  <div className="flex flex-wrap gap-2 pb-4">
                    <Badge variant="secondary" className="gap-1.5">
                      {getTabIcon(timeframe)}
                      {timeframe === 'daily' && new Date().toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {timeframe === 'weekly' && `Week of ${new Date().toLocaleDateString('en-US', { 
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}`}
                      {timeframe === 'monthly' && new Date().toLocaleDateString('en-US', { 
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Badge>
                    <Badge variant="outline">
                      ☉ {transits.planets.find(p => p.name === 'Sun')?.sign || 'Unknown'}
                    </Badge>
                    <Badge variant="outline">
                      ☽ {transits.planets.find(p => p.name === 'Moon')?.sign || 'Unknown'}
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground">
                      {transits.aspects.length} active aspects
                    </Badge>
                  </div>
                )}

                {!getHoroscopeForTab(timeframe) && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">
                      {getTabDescription(timeframe)}
                    </p>
                    <p className="text-sm text-muted-foreground/80 mb-4">
                      Generate your personalized {timeframe} horoscope based on planetary transits to your natal chart.
                    </p>
                    <Button
                      onClick={() => generateHoroscope(timeframe)}
                      disabled={isGenerating || !transits}
                      className="gap-2"
                    >
                      <Sparkle weight="fill" />
                      {isGenerating ? 'Generating...' : `Generate ${getTabLabel(timeframe)} Horoscope`}
                    </Button>
                  </div>
                )}

                {getHoroscopeForTab(timeframe) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="prose prose-sm prose-invert max-w-none">
                      {getHoroscopeForTab(timeframe)!.split('\n\n').map((paragraph: string, index: number) => (
                        <p key={index} className="text-foreground leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="text-xs text-muted-foreground">
                        {getLastGeneratedForTab(timeframe) && (
                          <>Generated at {getLastGeneratedForTab(timeframe)!.toLocaleTimeString()}</>
                        )}
                      </div>
                      <Button
                        onClick={() => generateHoroscope(timeframe)}
                        disabled={isGenerating}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <ArrowsClockwise weight="bold" />
                        Regenerate
                      </Button>
                    </div>
                  </motion.div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {transits && transits.aspects.length > 0 && (
        <Card className="bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Active Transit Aspects</CardTitle>
            <CardDescription>
              Current planetary aspects affecting your natal chart
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transits.aspects.slice(0, 10).map((aspect, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 font-mono text-sm">
                      <span className="text-accent font-medium">
                        {aspect.transitPlanet}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-foreground/80">
                        {aspect.natalPlanet}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="font-normal"
                      style={{ borderColor: aspect.color }}
                    >
                      {aspect.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {aspect.orb.toFixed(1)}°
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
