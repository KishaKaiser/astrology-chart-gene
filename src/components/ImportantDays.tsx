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
    if (!selectedChart) {
      toast.error('No chart selected')
      return
    }
    
    setIsGenerating(true)
    try {
      console.log('Generating Important Days for chart:', selectedChart.name)
      
      const sun = selectedChart.planets.find((p: any) => p.name === 'Sun')
      const moon = selectedChart.planets.find((p: any) => p.name === 'Moon')
      const venus = selectedChart.planets.find((p: any) => p.name === 'Venus')
      const mars = selectedChart.planets.find((p: any) => p.name === 'Mars')
      const jupiter = selectedChart.planets.find((p: any) => p.name === 'Jupiter')
      const rising = selectedChart.houses.find((h: any) => h.number === 1)
      
      console.log('Planets found:', { sun: !!sun, moon: !!moon, venus: !!venus, mars: !!mars, jupiter: !!jupiter, rising: !!rising })

      const today = new Date()
      const sixMonthsLater = new Date(today)
      sixMonthsLater.setMonth(today.getMonth() + 6)
      
      console.log('Date range:', {
        today: today.toLocaleDateString(),
        sixMonthsLater: sixMonthsLater.toLocaleDateString()
      })

      const sunSign = sun?.sign || 'Unknown'
      const sunDegree = sun?.degree?.toFixed(1) || 'N/A'
      const moonSign = moon?.sign || 'Unknown'
      const moonDegree = moon?.degree?.toFixed(1) || 'N/A'
      const risingSign = rising?.sign || 'Unknown'
      const venusSign = venus?.sign || 'Unknown'
      const venusDegree = venus?.degree?.toFixed(1) || 'N/A'
      const venusHouse = venus?.house || 'N/A'
      const marsSign = mars?.sign || 'Unknown'
      const marsDegree = mars?.degree?.toFixed(1) || 'N/A'
      const marsHouse = mars?.house || 'N/A'
      const jupiterSign = jupiter?.sign || 'Unknown'
      const jupiterDegree = jupiter?.degree?.toFixed(1) || 'N/A'
      const jupiterHouse = jupiter?.house || 'N/A'
      
      const startDateStr = today.toLocaleDateString()
      const endDateStr = sixMonthsLater.toLocaleDateString()

      console.log('Prompt constructed, calling LLM...')
      const prompt = (window.spark.llmPrompt as any)`You are an expert astrologer creating a 6-month forecast of important days for romance, career, and money opportunities.

NATAL CHART INFORMATION:
- Name: ${selectedChart.name}
- Sun Sign: ${sunSign} at ${sunDegree}°
- Moon Sign: ${moonSign} at ${moonDegree}°
- Rising Sign: ${risingSign}
- Venus (Romance): ${venusSign} at ${venusDegree}° in House ${venusHouse}
- Mars (Action/Career): ${marsSign} at ${marsDegree}° in House ${marsHouse}
- Jupiter (Money/Luck): ${jupiterSign} at ${jupiterDegree}° in House ${jupiterHouse}

FORECAST PERIOD:
- Start Date: ${startDateStr}
- End Date: ${endDateStr}

Generate a forecast of important days over the next 6 months. Include exactly 15 significant dates (5 romance, 5 career, 5 money) distributed evenly across the time period.

For each important day, provide:
- Specific date (use format: YYYY-MM-DD)
- Category (romance, career, or money)
- Intensity level (high, medium, or low)
- Brief description (maximum 60 characters)
- Transit details showing which planets are creating the opportunity

CRITICAL FORMATTING RULES:
1. Descriptions MUST be under 60 characters total
2. Do NOT use apostrophes quotes or special punctuation
3. Use simple words only
4. Keep transit planet names short
5. Ensure valid JSON format

Return ONLY a valid JSON object with a single property "days" containing exactly 15 forecast objects. Each forecast object must have: date (string), category (string: "romance", "career", or "money"), intensity (string: "high", "medium", or "low"), description (string under 60 chars), and transitDetails (object with: transitingPlanet, natalPlanet, aspect, and optional houses).

Example format:
{
  "days": [
    {
      "date": "2024-02-14",
      "category": "romance",
      "intensity": "high",
      "description": "Venus aligns with Sun for magnetic attraction",
      "transitDetails": {
        "transitingPlanet": "Venus",
        "natalPlanet": "Sun",
        "aspect": "conjunction",
        "houses": "5th"
      }
    }
  ]
}`
      const response = await (window.spark as any).llm(prompt, 'gpt-4o-mini', true)
      console.log('LLM response received, length:', response.length)
      console.log('Raw LLM response (first 500 chars):', response.substring(0, 500))
      
      let parsed
      try {
        let cleanedResponse = response.trim()
        
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '')
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/```\n?/g, '')
        }
        
        cleanedResponse = cleanedResponse.trim()
        
        console.log('Cleaned response (first 500 chars):', cleanedResponse.substring(0, 500))
        console.log('Cleaned response (last 100 chars):', cleanedResponse.substring(cleanedResponse.length - 100))
        
        parsed = JSON.parse(cleanedResponse)
      } catch (jsonError) {
        console.error('JSON Parse Error:', jsonError)
        console.error('Response length:', response.length)
        console.error('First 1000 characters:', response.substring(0, 1000))
        console.error('Last 500 characters:', response.substring(response.length - 500))
        
        if (jsonError instanceof Error && jsonError.message.includes('Unterminated string')) {
          throw new Error('The forecast response was incomplete. Please try regenerating - this usually happens due to response length limits.')
        }
        
        throw new Error(`Failed to parse LLM response as JSON: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`)
      }
      
      console.log('Response parsed successfully')
      console.log('Parsed object keys:', Object.keys(parsed))
      console.log('Days count:', parsed.days?.length)
      
      if (!parsed.days || !Array.isArray(parsed.days)) {
        console.error('Invalid response structure:', parsed)
        throw new Error('Invalid response format: missing or invalid "days" array')
      }
      
      if (parsed.days.length === 0) {
        throw new Error('No important days were generated')
      }
      
      console.log('Validating day objects...')
      const invalidDays = parsed.days.filter((day: any, idx: number) => {
        const isValid = day.date && day.category && day.intensity && day.description
        if (!isValid) {
          console.error(`Invalid day at index ${idx}:`, day)
        }
        return !isValid
      })
      
      if (invalidDays.length > 0) {
        throw new Error(`${invalidDays.length} day(s) have invalid format`)
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

      console.log('Important Days forecast generated successfully!')
      toast.success('Important Days forecast generated successfully!')
    } catch (error) {
      console.error('Error generating Important Days:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error details:', errorMessage)
      
      if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack)
      }
      
      toast.error(`Failed to generate forecast: ${errorMessage}`, {
        description: 'Check the browser console (F12) for detailed error information.',
        duration: 8000
      })
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
