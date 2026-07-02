import { useState, useEffect } from 'react'
import { ChartData, TransitData, PLANET_SYMBOLS, ZODIAC_SYMBOLS, ZodiacSign } from '@/lib/astrology-types'
import { calculateCurrentTransits } from '@/lib/astrology-calc'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sparkle, ArrowsClockwise, Clock } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

declare const spark: {
  llmPrompt: (strings: TemplateStringsArray, ...values: any[]) => string
  llm: (prompt: string, model?: string, jsonMode?: boolean) => Promise<string>
}

interface TransitInterpretationProps {
  chart: ChartData
}

interface TransitInterpretationData {
  overview: string
  keyTransits: Array<{
    transit: string
    meaning: string
    advice: string
  }>
  timing: string
}

export function TransitInterpretation({ chart }: TransitInterpretationProps) {
  const [transitData, setTransitData] = useState<TransitData | null>(null)
  const [interpretation, setInterpretation] = useState<TransitInterpretationData | null>(null)
  const [isLoadingTransits, setIsLoadingTransits] = useState(false)
  const [isLoadingInterpretation, setIsLoadingInterpretation] = useState(false)

  useEffect(() => {
    loadTransits()
  }, [chart])

  const loadTransits = async () => {
    try {
      setIsLoadingTransits(true)
      const transits = await calculateCurrentTransits(chart)
      setTransitData(transits)
    } catch (error) {
      console.error('Failed to calculate transits:', error)
      toast.error('Failed to calculate current transits. Please try again.')
    } finally {
      setIsLoadingTransits(false)
    }
  }

  const generateInterpretation = async () => {
    if (!transitData) {
      toast.error('Transit data not available')
      return
    }

    try {
      setIsLoadingInterpretation(true)
      toast.loading('Analyzing current planetary movements...', { id: 'transit-interpretation' })

      const natalPlanetsText = chart.planets
        .map(p => `${p.name} in ${p.sign} (${p.degree.toFixed(1)}°) in House ${p.house}`)
        .join(', ')

      const transitPlanetsText = transitData.planets
        .map(p => `${p.name} in ${p.sign} (${p.degree.toFixed(1)}°)`)
        .join(', ')

      const transitAspectsText = transitData.aspects
        .map(a => `Transit ${a.transitPlanet} ${a.type} Natal ${a.natalPlanet} (orb: ${a.orb.toFixed(1)}°)`)
        .join(', ')

      const prompt = spark.llmPrompt`You are a professional astrologer providing transit interpretations. 

Current date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

NATAL CHART (Birth Chart for ${chart.name}):
${natalPlanetsText}

CURRENT TRANSITS (Current Planetary Positions):
${transitPlanetsText}

TRANSIT ASPECTS TO NATAL CHART:
${transitAspectsText}

Please provide a comprehensive transit interpretation that explains what these current planetary movements mean for ${chart.name}. Focus on the most significant transits and their practical implications.

Return the result as a JSON object with this exact structure:
{
  "overview": "A 2-3 sentence overview of the current cosmic climate and its overall influence on the person",
  "keyTransits": [
    {
      "transit": "Name of the transit (e.g., 'Transit Jupiter Conjunct Natal Sun')",
      "meaning": "What this transit represents and its themes (2-3 sentences)",
      "advice": "Practical advice for working with this energy (1-2 sentences)"
    }
  ],
  "timing": "A brief note about the timing and duration of these influences (1-2 sentences)"
}

Include 3-5 of the most significant transits based on:
1. Exact aspects (smaller orbs are stronger)
2. Major planetary transits (Jupiter, Saturn, Uranus, Neptune, Pluto are long-lasting and significant)
3. Personal planets (Sun, Moon, Mercury, Venus, Mars) to natal planets create immediate, noticeable effects

Be encouraging but realistic. Focus on growth opportunities and practical guidance.`

      const response = await spark.llm(prompt, 'gpt-4o', true)
      const interpretationData = JSON.parse(response) as TransitInterpretationData

      setInterpretation(interpretationData)
      toast.success('Transit interpretation complete!', { id: 'transit-interpretation' })
    } catch (error) {
      console.error('Failed to generate interpretation:', error)
      toast.error('Failed to generate transit interpretation. Please try again.', { id: 'transit-interpretation' })
    } finally {
      setIsLoadingInterpretation(false)
    }
  }

  const refreshTransits = () => {
    setInterpretation(null)
    loadTransits()
  }

  if (isLoadingTransits) {
    return (
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkle weight="fill" className="text-accent" />
            Current Transits
          </CardTitle>
          <CardDescription>Loading current planetary positions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground">Calculating transits...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!transitData) {
    return (
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkle weight="fill" className="text-accent" />
            Current Transits
          </CardTitle>
          <CardDescription>Failed to load transit data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">Unable to calculate current transits.</p>
            <Button onClick={loadTransits} variant="outline">
              <ArrowsClockwise className="mr-2" weight="bold" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkle weight="fill" className="text-accent" />
                Current Transits
              </CardTitle>
              <CardDescription>
                <span className="flex items-center gap-2 mt-2">
                  <Clock weight="bold" className="text-accent" />
                  {transitData.calculatedAt.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={refreshTransits}
                variant="outline"
                size="sm"
                className="border-accent/30 hover:bg-accent hover:text-accent-foreground"
              >
                <ArrowsClockwise className="mr-2" weight="bold" />
                Refresh
              </Button>
              {!interpretation && (
                <Button
                  onClick={generateInterpretation}
                  disabled={isLoadingInterpretation}
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Sparkle className="mr-2" weight="fill" />
                  {isLoadingInterpretation ? 'Analyzing...' : 'Generate Interpretation'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Current Planetary Positions</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {transitData.planets.map((planet) => (
                <motion.div
                  key={planet.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/30 rounded-lg p-3 border border-border/50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{PLANET_SYMBOLS[planet.name]}</span>
                    <span className="font-semibold text-sm text-white">{planet.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span className="text-base">{ZODIAC_SYMBOLS[planet.sign as ZodiacSign]}</span>
                      <span>{planet.sign}</span>
                    </div>
                    <div>{planet.degree.toFixed(1)}°</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {transitData.aspects.length > 0 && (
            <>
              <Separator className="bg-border/50" />
              <div>
                <h3 className="font-semibold text-lg mb-4 text-white">
                  Transit Aspects to Your Natal Chart
                  <Badge variant="secondary" className="ml-3">
                    {transitData.aspects.length} aspects
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {transitData.aspects
                    .sort((a, b) => a.orb - b.orb)
                    .slice(0, 12)
                    .map((aspect, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/30 hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 font-mono text-sm">
                            <span className="text-accent font-semibold">Transit {aspect.transitPlanet}</span>
                            <span className="text-muted-foreground">{aspect.type}</span>
                            <span className="text-white">Natal {aspect.natalPlanet}</span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="font-mono text-xs"
                          style={{ borderColor: aspect.color }}
                        >
                          {aspect.orb.toFixed(1)}° orb
                        </Badge>
                      </motion.div>
                    ))}
                  {transitData.aspects.length > 12 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      Showing 12 of {transitData.aspects.length} aspects (closest aspects shown first)
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {interpretation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Sparkle weight="fill" className="text-accent" />
                    Transit Interpretation
                  </CardTitle>
                  <Button
                    onClick={generateInterpretation}
                    disabled={isLoadingInterpretation}
                    variant="outline"
                    size="sm"
                    className="border-accent/50 hover:bg-accent hover:text-accent-foreground"
                  >
                    <ArrowsClockwise className="mr-2" weight="bold" />
                    Regenerate
                  </Button>
                </div>
                <CardDescription className="text-foreground/80 pt-2 leading-relaxed">
                  {interpretation.overview}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-white">Key Transits</h3>
                  <div className="space-y-4">
                    {interpretation.keyTransits.map((transit, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-card/50 rounded-lg p-4 border border-accent/20 space-y-2"
                      >
                        <h4 className="font-semibold text-accent flex items-center gap-2">
                          <Sparkle weight="fill" size={16} />
                          {transit.transit}
                        </h4>
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          {transit.meaning}
                        </p>
                        <div className="pt-2 border-t border-border/30">
                          <p className="text-sm text-muted-foreground italic">
                            <span className="font-semibold text-accent">Guidance:</span> {transit.advice}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-accent/20" />

                <div className="bg-secondary/20 rounded-lg p-4 border border-accent/20">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Clock weight="bold" className="text-accent" />
                    Timing & Duration
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {interpretation.timing}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!interpretation && transitData.aspects.length === 0 && (
        <Card className="bg-card border-border/50">
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <Sparkle weight="fill" className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                No significant transit aspects detected at this time.
              </p>
              <p className="text-sm text-muted-foreground">
                The planets are currently in a quiet phase relative to your natal chart.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
