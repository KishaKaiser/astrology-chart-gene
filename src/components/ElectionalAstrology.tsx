import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { 
  ElectionCriteria, 
  ElectionAnalysis, 
  findOptimalTiming,
  EventType
} from '@/lib/electional-calc'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LocationSearch } from '@/components/LocationSearch'
import { ChartWheel } from '@/components/ChartWheel'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CalendarDots, 
  MapPin, 
  Sparkle, 
  CheckCircle, 
  WarningCircle,
  Clock,
  MoonStars,
  TrendUp,
  ArrowRight,
  ArrowsClockwise
} from '@phosphor-icons/react'

const EVENT_TYPES: { value: EventType; label: string; description: string }[] = [
  { value: 'wedding', label: 'Wedding / Marriage', description: 'Commitment ceremony or marriage' },
  { value: 'business_launch', label: 'Business Launch', description: 'Starting a new business or venture' },
  { value: 'surgery', label: 'Surgery / Medical', description: 'Medical procedures or surgery' },
  { value: 'travel', label: 'Travel', description: 'Important trips or relocations' },
  { value: 'signing_contract', label: 'Contract Signing', description: 'Legal agreements or contracts' },
  { value: 'moving', label: 'Moving / Relocation', description: 'Moving to a new home' },
  { value: 'investment', label: 'Investment', description: 'Financial investments or major purchases' },
  { value: 'interview', label: 'Job Interview', description: 'Job interviews or career opportunities' },
  { value: 'first_date', label: 'First Date', description: 'Beginning a romantic relationship' },
  { value: 'proposal', label: 'Marriage Proposal', description: 'Proposing marriage' },
  { value: 'purchase', label: 'Major Purchase', description: 'Buying property, car, or valuable items' },
  { value: 'creative_project', label: 'Creative Launch', description: 'Launching creative or artistic projects' }
]

export function ElectionalAstrology() {
  const [analyses, setAnalyses] = useKV<ElectionAnalysis[]>('election-analyses', [])
  const [currentAnalysis, setCurrentAnalysis] = useState<ElectionAnalysis | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  
  const [formData, setFormData] = useState<ElectionCriteria>({
    eventType: 'wedding',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    location: '',
    latitude: 0,
    longitude: 0,
    timezone: '+00:00',
    avoidRetrograde: true,
    preferDaylight: true
  })

  const handleLocationSelect = (location: {
    name: string
    latitude: number
    longitude: number
    timezone: string
  }) => {
    setFormData(prev => ({
      ...prev,
      location: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone
    }))
  }

  const handleFindOptimalDates = async () => {
    if (!formData.location) {
      toast.error('Please select a location')
      return
    }

    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)

    if (end <= start) {
      toast.error('End date must be after start date')
      return
    }

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 90) {
      toast.error('Date range cannot exceed 90 days')
      return
    }

    setIsCalculating(true)
    setProgress(0)
    
    try {
      toast.loading('Analyzing planetary positions...', { id: 'electional' })

      const analysis = await findOptimalTiming(formData, (prog, current, total) => {
        setProgress(prog)
        setProgressText(`Analyzing ${current} of ${total} time slots...`)
      })

      setCurrentAnalysis(analysis)
      setAnalyses(prev => [analysis, ...(prev || [])])
      
      toast.success(`Found ${analysis.results.length} optimal dates!`, { id: 'electional' })
    } catch (error) {
      console.error('Electional calculation error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to calculate optimal dates',
        { id: 'electional' }
      )
    } finally {
      setIsCalculating(false)
      setProgress(0)
      setProgressText('')
    }
  }

  const selectedEventType = EVENT_TYPES.find(e => e.value === formData.eventType)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-accent/30 bg-card/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-accent/20">
                <Sparkle weight="fill" className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl text-white">Electional Astrology</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                  Find the most auspicious timing for important life events using planetary alignments
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-type" className="text-white">Event Type</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value as EventType }))}
                >
                  <SelectTrigger id="event-type" className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-white">{type.label}</span>
                          <span className="text-xs text-muted-foreground">{type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedEventType && (
                  <p className="text-sm text-muted-foreground">{selectedEventType.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="text-white">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date" className="text-white">End Date (Max 90 days)</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Event Location</Label>
                <LocationSearch value={formData.location} onLocationSelect={handleLocationSelect} />
                {formData.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin weight="fill" className="w-4 h-4" />
                    <span>{formData.location}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="avoid-retrograde" className="text-white">Avoid Retrograde Periods</Label>
                    <p className="text-xs text-muted-foreground">
                      Filter out dates with major planets in retrograde
                    </p>
                  </div>
                  <Switch
                    id="avoid-retrograde"
                    checked={formData.avoidRetrograde}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, avoidRetrograde: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="prefer-daylight" className="text-white">Prefer Daylight Hours</Label>
                    <p className="text-xs text-muted-foreground">
                      Focus on daytime hours (9 AM - 6 PM)
                    </p>
                  </div>
                  <Switch
                    id="prefer-daylight"
                    checked={formData.preferDaylight}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, preferDaylight: checked }))}
                  />
                </div>
              </div>

              <Button
                onClick={handleFindOptimalDates}
                disabled={isCalculating}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                size="lg"
              >
                {isCalculating ? (
                  <>
                    <ArrowsClockwise className="mr-2 animate-spin" weight="bold" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkle className="mr-2" weight="fill" />
                    Find Optimal Dates
                  </>
                )}
              </Button>

              {isCalculating && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">{progressText}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence mode="wait">
        {currentAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Tabs defaultValue="results" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="results">
                  <TrendUp weight="bold" className="mr-2" />
                  Top Results
                </TabsTrigger>
                <TabsTrigger value="best">
                  <Sparkle weight="fill" className="mr-2" />
                  Best Date
                </TabsTrigger>
              </TabsList>

              <TabsContent value="results" className="space-y-4">
                {currentAnalysis.results.slice(0, 10).map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-accent/20 bg-card/30 backdrop-blur hover:border-accent/40 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                                #{index + 1}
                              </Badge>
                              <CardTitle className="text-lg text-white">
                                {new Date(result.date + 'T12:00:00').toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </CardTitle>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock weight="fill" className="w-4 h-4" />
                                {result.time}
                              </div>
                              <div className="flex items-center gap-1">
                                <MoonStars weight="fill" className="w-4 h-4" />
                                {result.moonPhase}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-accent">{result.score}</div>
                            <div className="text-xs text-muted-foreground">Score</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{result.recommendation}</p>

                        {result.strengths.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-white">
                              <CheckCircle weight="fill" className="w-4 h-4 text-green-500" />
                              Favorable Factors
                            </div>
                            <div className="space-y-1">
                              {result.strengths.map((strength, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground ml-6">
                                  <ArrowRight weight="bold" className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
                                  <span>{strength}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.weaknesses.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-white">
                              <WarningCircle weight="fill" className="w-4 h-4 text-yellow-500" />
                              Challenging Factors
                            </div>
                            <div className="space-y-1">
                              {result.weaknesses.map((weakness, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground ml-6">
                                  <ArrowRight weight="bold" className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-500" />
                                  <span>{weakness}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.retrogradeWarnings.length > 0 && (
                          <div className="space-y-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                              <WarningCircle weight="fill" className="w-4 h-4" />
                              Retrograde Warnings
                            </div>
                            <div className="space-y-1">
                              {result.retrogradeWarnings.map((warning, i) => (
                                <div key={i} className="text-sm text-destructive/90 ml-6">
                                  • {warning}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="best" className="space-y-4">
                {currentAnalysis.bestDate && (
                  <Card className="border-accent bg-card/50 backdrop-blur">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-accent/20">
                          <Sparkle weight="fill" className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl text-white">
                            {new Date(currentAnalysis.bestDate.date + 'T12:00:00').toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </CardTitle>
                          <CardDescription className="text-muted-foreground">
                            Best time: {currentAnalysis.bestDate.time} • {currentAnalysis.bestDate.moonPhase}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl font-bold text-accent mb-2">
                            {currentAnalysis.bestDate.score}
                          </div>
                          <div className="text-sm text-muted-foreground">Optimal Score</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                        <p className="text-white">{currentAnalysis.bestDate.recommendation}</p>
                      </div>

                      {currentAnalysis.bestDate.strengths.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-white">
                            <CheckCircle weight="fill" className="w-5 h-5 text-green-500" />
                            Favorable Planetary Factors
                          </div>
                          <div className="space-y-2">
                            {currentAnalysis.bestDate.strengths.map((strength, i) => (
                              <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground ml-7">
                                <ArrowRight weight="bold" className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
                                <span>{strength}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentAnalysis.bestDate.weaknesses.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-white">
                            <WarningCircle weight="fill" className="w-5 h-5 text-yellow-500" />
                            Challenging Planetary Factors
                          </div>
                          <div className="space-y-2">
                            {currentAnalysis.bestDate.weaknesses.map((weakness, i) => (
                              <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground ml-7">
                                <ArrowRight weight="bold" className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-500" />
                                <span>{weakness}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Separator />

                      <div className="aspect-square max-w-md mx-auto">
                        <ChartWheel chart={currentAnalysis.bestDate.chart} />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="text-muted-foreground">Location</div>
                          <div className="text-white font-medium">{currentAnalysis.criteria.location}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-muted-foreground">Moon Phase</div>
                          <div className="text-white font-medium">{currentAnalysis.bestDate.moonPhase}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-muted-foreground">Event Type</div>
                          <div className="text-white font-medium">
                            {EVENT_TYPES.find(e => e.value === currentAnalysis.criteria.eventType)?.label}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-muted-foreground">Timezone</div>
                          <div className="text-white font-medium">{currentAnalysis.criteria.timezone}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
