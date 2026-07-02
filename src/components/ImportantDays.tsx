import { useState, useEffect } from 'react'
import { useKV } from '@/hooks/use-kv'
import { ChartData } from '@/lib/astrology-types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Calendar, ArrowsClockwise, Heart, Briefcase, CurrencyDollar, Sparkle, CalendarBlank } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { llm, llmPrompt } from "@/lib/llm"

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
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date()
    date.setMonth(date.getMonth() + 6)
    return date
  })
  const [isCustomRange, setIsCustomRange] = useState(false)

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
    
    if (endDate <= startDate) {
      toast.error('End date must be after start date')
      return
    }
    
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff < 7) {
      toast.error('Date range must be at least 7 days')
      return
    }
    if (daysDiff > 730) {
      toast.error('Date range cannot exceed 2 years (730 days)')
      return
    }
    
    setIsGenerating(true)
    try {
      console.log('Generating Important Days for chart:', selectedChart.name)
      console.log('Date range:', { startDate: startDate.toISOString(), endDate: endDate.toISOString(), days: daysDiff })
      
      const sun = selectedChart.planets.find((p: any) => p.name === 'Sun')
      const moon = selectedChart.planets.find((p: any) => p.name === 'Moon')
      const venus = selectedChart.planets.find((p: any) => p.name === 'Venus')
      const mars = selectedChart.planets.find((p: any) => p.name === 'Mars')
      const jupiter = selectedChart.planets.find((p: any) => p.name === 'Jupiter')
      const rising = selectedChart.houses.find((h: any) => h.number === 1)
      
      console.log('Planets found:', { sun: !!sun, moon: !!moon, venus: !!venus, mars: !!mars, jupiter: !!jupiter, rising: !!rising })
      
      const startDateStr = startDate.toLocaleDateString()
      const endDateStr = endDate.toLocaleDateString()

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
      
      const monthsDiff = Math.round(daysDiff / 30)
      const daysPerCategory = Math.max(3, Math.floor(monthsDiff * 1.5))
      const totalDays = daysPerCategory * 3

      console.log('Prompt constructed, calling LLM...')
      const prompt = llmPrompt`You are an expert astrologer. Create a forecast of important days.

NATAL CHART:
Name: ${selectedChart.name}
Sun: ${sunSign} ${sunDegree}°
Moon: ${moonSign} ${moonDegree}°
Rising: ${risingSign}
Venus: ${venusSign} ${venusDegree}° House ${venusHouse}
Mars: ${marsSign} ${marsDegree}° House ${marsHouse}
Jupiter: ${jupiterSign} ${jupiterDegree}° House ${jupiterHouse}

PERIOD: ${startDateStr} to ${endDateStr} (${daysDiff} days, approximately ${monthsDiff} months)

Generate exactly ${totalDays} important dates: ${daysPerCategory} romance, ${daysPerCategory} career, ${daysPerCategory} money. Distribute evenly across the entire period.

RULES:
- Dates: YYYY-MM-DD format only
- Category: romance OR career OR money
- Intensity: high OR medium OR low
- Description: Max 45 characters, no quotes or apostrophes
- Transit planet names: Sun Moon Venus Mars Jupiter Saturn only
- Spread dates naturally across all ${monthsDiff} months

Return valid JSON with "days" array:
{
  "days": [
    {
      "date": "2024-02-14",
      "category": "romance",
      "intensity": "high",
      "description": "Venus conjunct natal Sun brings attraction",
      "transitDetails": {
        "transitingPlanet": "Venus",
        "natalPlanet": "Sun",
        "aspect": "conjunction",
        "houses": "5th"
      }
    }
  ]
}

Return ONLY the JSON object. No extra text.`
      const response = await llm(prompt, true)
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
        
        if (!cleanedResponse.endsWith('}') && !cleanedResponse.endsWith(']')) {
          console.warn('Response appears truncated - attempting to repair JSON')
          
          let lastCompleteObject = cleanedResponse.lastIndexOf('}')
          if (lastCompleteObject > 0) {
            let testJson = cleanedResponse.substring(0, lastCompleteObject + 1)
            
            const openBrackets = (testJson.match(/\[/g) || []).length
            const closeBrackets = (testJson.match(/\]/g) || []).length
            const openBraces = (testJson.match(/\{/g) || []).length
            const closeBraces = (testJson.match(/\}/g) || []).length
            
            if (openBrackets > closeBrackets) {
              testJson += ']'.repeat(openBrackets - closeBrackets)
            }
            if (openBraces > closeBraces) {
              testJson += '}'.repeat(openBraces - closeBraces)
            }
            
            console.log('Attempting to parse repaired JSON')
            cleanedResponse = testJson
          }
        }
        
        parsed = JSON.parse(cleanedResponse)
      } catch (jsonError) {
        console.error('JSON Parse Error:', jsonError)
        console.error('Response length:', response.length)
        console.error('First 1000 characters:', response.substring(0, 1000))
        console.error('Last 500 characters:', response.substring(response.length - 500))
        
        if (jsonError instanceof Error && (jsonError.message.includes('Unterminated string') || jsonError.message.includes('Unexpected end'))) {
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
      
      if (parsed.days.length < totalDays - 3) {
        console.warn(`Only ${parsed.days.length} days generated, expected ${totalDays}`)
        toast.warning(`Generated ${parsed.days.length} days instead of ${totalDays}. You may regenerate for more dates.`, {
          duration: 5000
        })
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
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
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
                <CardTitle className="text-white">Important Days - Custom Forecast</CardTitle>
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

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-3 flex-1">
              <CalendarBlank className="w-5 h-5 text-muted-foreground" weight="bold" />
              <span className="text-sm text-muted-foreground font-medium">Date Range:</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[180px] justify-start text-left font-normal bg-card border-border text-white"
                  >
                    <Calendar className="mr-2 h-4 w-4" weight="bold" />
                    {format(startDate, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date)
                        setIsCustomRange(true)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground">to</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[180px] justify-start text-left font-normal bg-card border-border text-white"
                  >
                    <Calendar className="mr-2 h-4 w-4" weight="bold" />
                    {format(endDate, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      if (date) {
                        setEndDate(date)
                        setIsCustomRange(true)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const today = new Date()
                  const sixMonths = new Date()
                  sixMonths.setMonth(today.getMonth() + 6)
                  setStartDate(today)
                  setEndDate(sixMonths)
                  setIsCustomRange(false)
                }}
                className="text-muted-foreground hover:text-white"
              >
                Reset to 6 months
              </Button>
            </div>
          </div>

          {lastGenerated && selectedChart && currentReading && (
            <p className="text-xs text-muted-foreground mt-2">
              Forecast for <span className="text-white font-medium">{selectedChart.name}</span> • {format(new Date(currentReading.startDate), 'MMM dd, yyyy')} to {format(new Date(currentReading.endDate), 'MMM dd, yyyy')} • Generated: {lastGenerated.toLocaleDateString()} at {lastGenerated.toLocaleTimeString()}
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
              Select your date range above and click "Generate Forecast" to discover your important days
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
