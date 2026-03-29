import { useState, useEffect } from 'react'
import { ChartData, TransitData } from '@/lib/astrology-types'
import { calculateCurrentTransits } from '@/lib/astrology-calc'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkle, CalendarBlank, ArrowsClockwise } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface DailyHoroscopeProps {
  chart: ChartData
}

export function DailyHoroscope({ chart }: DailyHoroscopeProps) {
  const [transits, setTransits] = useState<TransitData | null>(null)
  const [horoscope, setHoroscope] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null)

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

  const generateHoroscope = async () => {
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

      const significantAspects = transits.aspects
        .filter(a => ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'].includes(a.transitPlanet))
        .slice(0, 8)

      const aspectsDescription = significantAspects.length > 0
        ? significantAspects.map(a => 
            `${a.transitPlanet} ${a.type} natal ${a.natalPlanet}`
          ).join(', ')
        : 'No major aspects today'

      const promptText = (window.spark.llmPrompt as any)`You are an expert astrologer creating a daily horoscope reading based on current planetary transits.

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

      const response = await (window.spark as any).llm(promptText, 'gpt-4o')
      setHoroscope(response)
      setLastGenerated(new Date())
      toast.success('Daily horoscope generated!')
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

  return (
    <div className="space-y-6">
      <Card className="border-accent/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkle className="text-accent" weight="fill" size={24} />
                Daily Horoscope
              </CardTitle>
              <CardDescription>
                Personalized predictions based on current transits
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
          {transits && (
            <div className="flex flex-wrap gap-2 pb-4">
              <Badge variant="secondary" className="gap-1.5">
                <CalendarBlank weight="bold" size={14} />
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
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

          {!horoscope && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Generate your personalized daily horoscope based on current planetary transits to your natal chart.
              </p>
              <Button
                onClick={generateHoroscope}
                disabled={isGenerating || !transits}
                className="gap-2"
              >
                <Sparkle weight="fill" />
                {isGenerating ? 'Generating...' : 'Generate Daily Horoscope'}
              </Button>
            </div>
          )}

          {horoscope && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="prose prose-sm prose-invert max-w-none">
                {horoscope.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-foreground leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="text-xs text-muted-foreground">
                  {lastGenerated && (
                    <>Generated at {lastGenerated.toLocaleTimeString()}</>
                  )}
                </div>
                <Button
                  onClick={generateHoroscope}
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
