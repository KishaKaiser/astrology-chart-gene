import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Sparkle, CalendarBlank, Calendar, CalendarDots, ArrowsClockwise } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

type ZodiacSign = 
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' 
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces'

type TimeframePeriod = 'daily' | 'weekly' | 'monthly'

const ZODIAC_SIGNS: ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

const ZODIAC_DATES: Record<ZodiacSign, string> = {
  'Aries': 'Mar 21 - Apr 19',
  'Taurus': 'Apr 20 - May 20',
  'Gemini': 'May 21 - Jun 20',
  'Cancer': 'Jun 21 - Jul 22',
  'Leo': 'Jul 23 - Aug 22',
  'Virgo': 'Aug 23 - Sep 22',
  'Libra': 'Sep 23 - Oct 22',
  'Scorpio': 'Oct 23 - Nov 21',
  'Sagittarius': 'Nov 22 - Dec 21',
  'Capricorn': 'Dec 22 - Jan 19',
  'Aquarius': 'Jan 20 - Feb 18',
  'Pisces': 'Feb 19 - Mar 20'
}

const ZODIAC_SYMBOLS: Record<ZodiacSign, string> = {
  'Aries': '♈',
  'Taurus': '♉',
  'Gemini': '♊',
  'Cancer': '♋',
  'Leo': '♌',
  'Virgo': '♍',
  'Libra': '♎',
  'Scorpio': '♏',
  'Sagittarius': '♐',
  'Capricorn': '♑',
  'Aquarius': '♒',
  'Pisces': '♓'
}

export function GeneralHoroscope() {
  const [selectedSign, setSelectedSign] = useState<ZodiacSign>('Aries')
  const [activeTab, setActiveTab] = useState<TimeframePeriod>('daily')
  const [dailyHoroscope, setDailyHoroscope] = useState<Record<ZodiacSign, string>>({} as Record<ZodiacSign, string>)
  const [weeklyHoroscope, setWeeklyHoroscope] = useState<Record<ZodiacSign, string>>({} as Record<ZodiacSign, string>)
  const [monthlyHoroscope, setMonthlyHoroscope] = useState<Record<ZodiacSign, string>>({} as Record<ZodiacSign, string>)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<Record<string, Date>>({})

  const generateHoroscope = async (timeframe: TimeframePeriod, sign: ZodiacSign) => {
    setIsGenerating(true)
    try {
      let promptText: string
      const today = new Date()
      
      if (timeframe === 'daily') {
        promptText = (window.spark.llmPrompt as any)`You are an expert astrologer creating a daily horoscope reading for ${sign}.

TODAY'S DATE: ${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

Create a general daily horoscope reading for ${sign} (${ZODIAC_DATES[sign]}) that:
1. Opens with an overall theme or energy for the day
2. Discusses potential opportunities and challenges in key life areas:
   - Love & Relationships
   - Career & Money
   - Health & Wellness
   - Personal Growth
3. Provides practical advice and actionable guidance
4. Includes a lucky number and lucky color for the day
5. Ends with an inspiring affirmation or motivational message

Write in a warm, encouraging tone that feels both mystical and practical. Keep the reading between 250-350 words. Use clear paragraph breaks for different life areas.`
      } else if (timeframe === 'weekly') {
        const weekEnd = new Date(today)
        weekEnd.setDate(today.getDate() + 7)
        
        promptText = (window.spark.llmPrompt as any)`You are an expert astrologer creating a weekly horoscope reading for ${sign}.

WEEK OF: ${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

Create a general weekly horoscope forecast for ${sign} (${ZODIAC_DATES[sign]}) that:
1. Opens with the major themes and energies for the week
2. Highlights day-by-day energy shifts and important dates
3. Covers key life areas with specific guidance:
   - Love & Relationships: Dating, partnerships, social connections
   - Career & Finances: Work projects, money matters, professional growth
   - Health & Energy: Physical wellness, mental health, self-care
   - Personal Development: Learning, creativity, spiritual growth
4. Identifies the best days for:
   - Starting new projects
   - Important conversations or decisions
   - Rest and reflection
5. Notes any challenges and how to navigate them
6. Concludes with weekly intentions or goals to focus on

Write in an engaging, uplifting tone that provides both cosmic wisdom and practical strategies. Keep the reading between 450-550 words. Use section headings or clear paragraph breaks.`
      } else {
        const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        
        promptText = (window.spark.llmPrompt as any)`You are an expert astrologer creating a monthly horoscope reading for ${sign}.

MONTH: ${monthName}

Create a comprehensive monthly horoscope forecast for ${sign} (${ZODIAC_DATES[sign]}) that:
1. Opens with the overarching themes and major cosmic influences for the month
2. Breaks the month into distinct phases (early, mid, late) with different focuses
3. Provides detailed guidance for all life domains:
   - Love & Relationships: Romance, friendships, family dynamics
   - Career & Finances: Professional opportunities, income, investments
   - Health & Vitality: Physical health, energy levels, wellness practices
   - Personal Growth: Self-discovery, education, spiritual development
   - Social & Creative Life: Community, hobbies, creative expression
4. Highlights important dates or periods for:
   - Major opportunities or breakthroughs
   - Potential challenges or obstacles
   - Rest, reflection, and integration
5. Discusses any significant astrological events (new/full moons, planetary movements) affecting ${sign}
6. Includes reflection questions or intentions to set for the month
7. Concludes with an empowering message about the month's growth potential

Write in a wise, inspiring tone that balances cosmic insight with actionable guidance. Keep the reading between 650-800 words. Use clear section headings for different life areas and time periods.`
      }

      const response = await (window.spark as any).llm(promptText, 'gpt-4o')
      
      if (timeframe === 'daily') {
        setDailyHoroscope(prev => ({ ...prev, [sign]: response }))
      } else if (timeframe === 'weekly') {
        setWeeklyHoroscope(prev => ({ ...prev, [sign]: response }))
      } else {
        setMonthlyHoroscope(prev => ({ ...prev, [sign]: response }))
      }
      
      setLastGenerated(prev => ({
        ...prev,
        [`${timeframe}-${sign}`]: new Date()
      }))
      
      toast.success(`${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} horoscope generated for ${sign}!`)
    } catch (error) {
      console.error('Error generating horoscope:', error)
      toast.error('Failed to generate horoscope. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const getHoroscopeForTab = (tab: TimeframePeriod, sign: ZodiacSign): string | undefined => {
    if (tab === 'daily') return dailyHoroscope[sign]
    if (tab === 'weekly') return weeklyHoroscope[sign]
    return monthlyHoroscope[sign]
  }

  const getLastGeneratedForTab = (tab: TimeframePeriod, sign: ZodiacSign): Date | undefined => {
    return lastGenerated[`${tab}-${sign}`]
  }

  const getTabIcon = (tab: TimeframePeriod) => {
    if (tab === 'daily') return <CalendarBlank weight="bold" size={16} />
    if (tab === 'weekly') return <Calendar weight="bold" size={16} />
    return <CalendarDots weight="bold" size={16} />
  }

  const getTabDescription = (tab: TimeframePeriod) => {
    if (tab === 'daily') return 'Daily guidance for your zodiac sign'
    if (tab === 'weekly') return 'Weekly forecast and themes'
    return 'Monthly overview and opportunities'
  }

  return (
    <div className="space-y-6">
      <Card className="border-accent/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 mb-2">
                <Sparkle className="text-accent" weight="fill" size={24} />
                Zodiac Horoscopes
              </CardTitle>
              <CardDescription>
                General astrological forecasts by zodiac sign
              </CardDescription>
            </div>
            <div className="w-56">
              <Select value={selectedSign} onValueChange={(v) => setSelectedSign(v as ZodiacSign)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZODIAC_SIGNS.map(sign => (
                    <SelectItem key={sign} value={sign}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{ZODIAC_SYMBOLS[sign]}</span>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{sign}</span>
                          <span className="text-xs text-muted-foreground">{ZODIAC_DATES[sign]}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {ZODIAC_SYMBOLS[selectedSign]}
            </Badge>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">{selectedSign}</span>
              <span className="text-xs text-muted-foreground">{ZODIAC_DATES[selectedSign]}</span>
            </div>
          </div>

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
                </div>

                {!getHoroscopeForTab(timeframe, selectedSign) && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">
                      {getTabDescription(timeframe)}
                    </p>
                    <p className="text-sm text-muted-foreground/80 mb-4">
                      Generate your {timeframe} horoscope for {selectedSign}.
                    </p>
                    <Button
                      onClick={() => generateHoroscope(timeframe, selectedSign)}
                      disabled={isGenerating}
                      className="gap-2"
                    >
                      <Sparkle weight="fill" />
                      {isGenerating ? 'Generating...' : `Generate ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Horoscope`}
                    </Button>
                  </div>
                )}

                {getHoroscopeForTab(timeframe, selectedSign) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="prose prose-sm prose-invert max-w-none">
                      {getHoroscopeForTab(timeframe, selectedSign)!.split('\n\n').map((paragraph: string, index: number) => (
                        <p key={index} className="text-foreground leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="text-xs text-muted-foreground">
                        {getLastGeneratedForTab(timeframe, selectedSign) && (
                          <>Generated at {getLastGeneratedForTab(timeframe, selectedSign)!.toLocaleTimeString()}</>
                        )}
                      </div>
                      <Button
                        onClick={() => generateHoroscope(timeframe, selectedSign)}
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

      <Card className="bg-card/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">All Zodiac Signs</CardTitle>
          <CardDescription>
            Quick access to other zodiac horoscopes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {ZODIAC_SIGNS.map(sign => (
              <Button
                key={sign}
                variant={selectedSign === sign ? 'default' : 'outline'}
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => setSelectedSign(sign)}
              >
                <span className="text-2xl">{ZODIAC_SYMBOLS[sign]}</span>
                <span className="text-xs font-medium">{sign}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
