import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { ChartData } from '@/lib/astrology-types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, ArrowsClockwise, Heart, Briefcase, CurrencyDollar, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface ImportantDaysProps {
  charts: ChartData[]
}

interface DayForecast {
  date: string
  category: 'romance' | 'career' | 'money'
  intensity: 'low' | 'medium' | 'high'
  description: string
  transitDetails?: {
    transitingPlanet: string
    natalPlanet: string
    aspect: string
    houses?: string
  }
}

interface ImportantDaysReading {
  content: DayForecast[]
  generatedAt: number
  startDate: string
  endDate: string
}

export function ImportantDays({ charts }: ImportantDaysProps) {
  const [savedReadings, setSavedReadings] = useKV<Record<string, ImportantDaysReading>>('important-days-readings', {})
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedChartId, setSelectedChartId] = useState<string>(charts[0]?.id || '')

  useEffect(() => {
    if (!selectedChartId && charts.length > 0) {
      setSelectedChartId(charts[0].id)
    }
    if (selectedChartId && !charts.find(c => c.id === selectedChartId)) {
      setSelectedChartId(charts[0]?.id || '')
    }
  }, [charts, selectedChartId])

  const selectedChart = charts.find(c => c.id === selectedChartId) || charts[0]
  const readingKey = `${selectedChart?.id}-important-days`
  const currentReading = savedReadings?.[readingKey]
  
  const lastGenerated = currentReading?.generatedAt 
    ? new Date(currentReading.generatedAt) 
    : null

  const generateReading = async () => {
    if (!selectedChart) return
    
    setIsGenerating(true)
    try {
      const sun = selectedChart.planets.find((p: any) => p.name === 'Sun')
      const moon = selectedChart.planets.find((p: any) => p.name === 'Moon')
      const venus = selectedChart.planets.find((p: any) => p.name === 'Venus')
      const mars = selectedChart.planets.find((p: any) => p.name === 'Mars')
      const jupiter = selectedChart.planets.find((p: any) => p.name === 'Jupiter')
      const rising = selectedChart.houses.find((h: any) => h.number === 1)

      const today = new Date()
      const sixMonthsLater = new Date(today)
      sixMonthsLater.setMonth(today.getMonth() + 6)

      const promptText = (window.spark.llmPrompt as any)`You are an expert astrologer creating a 6-month forecast of important days for romance, career, and money opportunities.

NATAL CHART INFORMATION:
- Name: ${selectedChart.name}
- Sun Sign: ${sun?.sign || 'Unknown'} at ${sun?.degree.toFixed(1)}°
- Moon Sign: ${moon?.sign || 'Unknown'} at ${moon?.degree.toFixed(1)}°
- Rising Sign: ${rising?.sign || 'Unknown'}
- Venus (Romance): ${venus?.sign || 'Unknown'} at ${venus?.degree.toFixed(1)}° in House ${venus?.house}
- Mars (Action/Career): ${mars?.sign || 'Unknown'} at ${mars?.degree.toFixed(1)}° in House ${mars?.house}
- Jupiter (Money/Luck): ${jupiter?.sign || 'Unknown'} at ${jupiter?.degree.toFixed(1)}° in House ${jupiter?.house}

FORECAST PERIOD:
- Start Date: ${today.toLocaleDateString()}
- End Date: ${sixMonthsLater.toLocaleDateString()}

Generate a forecast of important days over the next 6 months. Include approximately 30-40 significant dates distributed across three categories:
1. ROMANCE opportunities (Venus transits, 5th/7th house activations)
2. CAREER/JOB opportunities (10th house, Mars, Saturn transits)
3. MONEY opportunities (2nd/8th house, Jupiter transits)

For each important day, provide:
- Specific date (use format: YYYY-MM-DD)
- Category (romance, career, or money)
- Intensity level (high, medium, or low)
- Brief description (1-2 sentences explaining why this day is significant)
- Transit details showing which planets are creating the opportunity

IMPORTANT: You MUST include specific transit details for each forecast showing:
- transitingPlanet: Which planet is currently moving (e.g., "Venus", "Jupiter", "Mars")
- natalPlanet: Which natal planet it's aspecting (e.g., "Sun", "Moon", "Venus")
- aspect: The type of aspect being formed (e.g., "conjunction", "trine", "sextile", "square", "opposition")
- houses: Relevant houses involved (optional, e.g., "7th house", "10th and 2nd houses")

Consider:
- New Moons and Full Moons in relevant houses
- Venus, Mars, and Jupiter transits to natal planets
- Lucky aspects to natal planets (trines, sextiles, conjunctions)
- Mercury retrograde periods (caution for career decisions)
- Eclipses
- Personal planetary returns
- Saturn and Uranus transits for major opportunities

Return ONLY a valid JSON object with a single property "days" containing an array of forecast objects. Each forecast object must have: date (string), category (string: "romance", "career", or "money"), intensity (string: "high", "medium", or "low"), description (string), and transitDetails (object with: transitingPlanet, natalPlanet, aspect, and optional houses).

Example format:
{
  "days": [
    {
      "date": "2024-02-14",
      "category": "romance",
      "intensity": "high",
      "description": "Venus aligns with your natal Sun, creating magnetic attraction and romantic opportunities.",
      "transitDetails": {
        "transitingPlanet": "Venus",
        "natalPlanet": "Sun",
        "aspect": "conjunction",
        "houses": "5th house"
      }
    }
  ]
}`

      const response = await window.spark.llm(promptText, 'gpt-4o', true)
      const parsed = JSON.parse(response)
      
      if (!parsed.days || !Array.isArray(parsed.days)) {
        throw new Error('Invalid response format')
      }

      const reading: ImportantDaysReading = {
        content: parsed.days,
        generatedAt: Date.now(),
        startDate: today.toISOString(),
        endDate: sixMonthsLater.toISOString()
      }

      setSavedReadings((current) => ({
        ...current,
        [readingKey]: reading
      }))

      toast.success('Important Days forecast generated successfully!')
    } catch (error) {
      console.error('Error generating Important Days:', error)
      toast.error('Failed to generate forecast. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'romance':
        return <Heart weight="fill" className="text-pink-400" />
      case 'career':
        return <Briefcase weight="fill" className="text-blue-400" />
      case 'money':
        return <CurrencyDollar weight="fill" className="text-green-400" />
      default:
        return <Sparkle weight="fill" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'romance':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/30'
      case 'career':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'money':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      default:
        return 'bg-accent/20 text-accent-foreground border-accent/30'
    }
  }

  const getIntensityBadge = (intensity: string) => {
    switch (intensity) {
      case 'high':
        return <Badge variant="default" className="bg-accent text-accent-foreground">High Impact</Badge>
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>
      case 'low':
        return <Badge variant="outline">Low</Badge>
      default:
        return null
    }
  }

  const groupedByMonth = currentReading?.content.reduce((acc, day) => {
    const date = new Date(day.date)
    const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!acc[monthKey]) {
      acc[monthKey] = []
    }
    acc[monthKey].push(day)
    return acc
  }, {} as Record<string, DayForecast[]>)

  const sortedMonths = groupedByMonth ? Object.keys(groupedByMonth).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime()
  }) : []

  return (
    <div className="space-y-6">
      <Card className="border-accent/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Calendar className="w-8 h-8 text-accent flex-shrink-0" weight="fill" />
              <div className="flex-1">
                <CardTitle className="text-white">Important Days - 6 Month Forecast</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Key dates for romance, career, and financial opportunities
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {charts.length > 1 && (
                <Select value={selectedChartId} onValueChange={setSelectedChartId}>
                  <SelectTrigger className="w-[240px] bg-card border-border text-white">
                    <SelectValue placeholder="Select a chart" />
                  </SelectTrigger>
                  <SelectContent>
                    {charts.map((chart) => (
                      <SelectItem key={chart.id} value={chart.id}>
                        {chart.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                onClick={generateReading}
                disabled={isGenerating || !selectedChart}
                variant="default"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {isGenerating ? (
                  <>
                    <ArrowsClockwise className="mr-2 animate-spin" weight="bold" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkle className="mr-2" weight="fill" />
                    {currentReading ? 'Regenerate Forecast' : 'Generate Forecast'}
                  </>
                )}
              </Button>
            </div>
          </div>
          {lastGenerated && selectedChart && (
            <p className="text-xs text-muted-foreground mt-2">
              Forecast for <span className="text-white font-medium">{selectedChart.name}</span> • Last generated: {lastGenerated.toLocaleDateString()} at {lastGenerated.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>
      </Card>

      {!currentReading && !isGenerating && (
        <Card className="border-border/50">
          <CardContent className="py-20 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" weight="duotone" />
            <p className="text-muted-foreground mb-2">No forecast generated yet</p>
            <p className="text-sm text-muted-foreground">
              Click "Generate Forecast" to discover your important days over the next 6 months
            </p>
          </CardContent>
        </Card>
      )}

      {currentReading && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-pink-500/30 bg-pink-500/10">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Heart weight="fill" className="text-pink-400 w-5 h-5" />
                  <CardTitle className="text-sm text-white">Romance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-pink-300">
                  {currentReading.content.filter(d => d.category === 'romance').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Opportunities</p>
              </CardContent>
            </Card>

            <Card className="border-blue-500/30 bg-blue-500/10">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase weight="fill" className="text-blue-400 w-5 h-5" />
                  <CardTitle className="text-sm text-white">Career</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-300">
                  {currentReading.content.filter(d => d.category === 'career').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Opportunities</p>
              </CardContent>
            </Card>

            <Card className="border-green-500/30 bg-green-500/10">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CurrencyDollar weight="fill" className="text-green-400 w-5 h-5" />
                  <CardTitle className="text-sm text-white">Money</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-300">
                  {currentReading.content.filter(d => d.category === 'money').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Opportunities</p>
              </CardContent>
            </Card>
          </div>

          {sortedMonths.map((monthKey, monthIdx) => {
            const monthDays = groupedByMonth![monthKey].sort((a, b) => 
              new Date(a.date).getTime() - new Date(b.date).getTime()
            )

            return (
              <motion.div
                key={monthKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: monthIdx * 0.1 }}
              >
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <Calendar weight="duotone" className="text-accent" />
                      {monthKey}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {monthDays.map((day, dayIdx) => {
                      const date = new Date(day.date)
                      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
                      const dayOfMonth = date.getDate()
                      const month = date.toLocaleDateString('en-US', { month: 'short' })

                      return (
                        <motion.div
                          key={`${day.date}-${dayIdx}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: dayIdx * 0.05 }}
                          className={`border rounded-lg p-4 ${getCategoryColor(day.category)}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 text-center min-w-[60px]">
                              <div className="text-2xl font-bold text-white">{dayOfMonth}</div>
                              <div className="text-xs text-muted-foreground uppercase">{month}</div>
                              <div className="text-xs text-muted-foreground">{dayOfWeek}</div>
                            </div>

                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  {getCategoryIcon(day.category)}
                                  <span className="text-sm font-medium text-white capitalize">
                                    {day.category}
                                  </span>
                                </div>
                                {getIntensityBadge(day.intensity)}
                              </div>
                              <p className="text-sm text-foreground leading-relaxed">
                                {day.description}
                              </p>
                              {day.transitDetails && (
                                <div className="mt-3 pt-3 border-t border-current/20">
                                  <div className="flex items-start gap-2">
                                    <Sparkle className="w-4 h-4 mt-0.5 text-accent flex-shrink-0" weight="fill" />
                                    <div className="text-xs space-y-1">
                                      <p className="text-muted-foreground font-medium">Transit Details:</p>
                                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-foreground/80">
                                        <span className="inline-flex items-center gap-1">
                                          <span className="font-medium text-accent">{day.transitDetails.transitingPlanet}</span>
                                          <span className="text-muted-foreground text-[10px]">{day.transitDetails.aspect}</span>
                                          <span className="font-medium text-accent">{day.transitDetails.natalPlanet}</span>
                                        </span>
                                        {day.transitDetails.houses && (
                                          <span className="text-muted-foreground">
                                            • {day.transitDetails.houses}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
