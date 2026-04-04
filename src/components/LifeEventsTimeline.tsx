import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { ChartData, PLANET_SYMBOLS, ZODIAC_SYMBOLS, ZodiacSign } from '@/lib/astrology-types'
import { calculateTransitsForDate } from '@/lib/astrology-calc'
import { LifeEvent, detectRecurringPatterns, AstrologicalPattern } from '@/lib/pattern-detection'
import { PatternVisualization } from '@/components/PatternVisualization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash, Sparkle, CalendarBlank, Graph, TrendUp } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORY_COLORS = {
  career: 'oklch(0.70 0.20 150)',
  relationship: 'oklch(0.75 0.25 0)',
  health: 'oklch(0.65 0.18 140)',
  spiritual: 'oklch(0.70 0.22 285)',
  family: 'oklch(0.72 0.20 50)',
  education: 'oklch(0.68 0.22 240)',
  travel: 'oklch(0.75 0.20 200)',
  other: 'oklch(0.60 0.15 270)'
}

const CATEGORY_LABELS = {
  career: 'Career',
  relationship: 'Relationship',
  health: 'Health',
  spiritual: 'Spiritual',
  family: 'Family',
  education: 'Education',
  travel: 'Travel',
  other: 'Other'
}

interface LifeEventsTimelineProps {
  chart: ChartData
}

export function LifeEventsTimeline({ chart }: LifeEventsTimelineProps) {
  const [events, setEvents] = useKV<LifeEvent[]>('life-events', [])
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false)
  const [selectedPattern, setSelectedPattern] = useState<AstrologicalPattern | null>(null)
  const [newEvent, setNewEvent] = useState({
    date: '',
    title: '',
    description: '',
    category: 'other' as LifeEvent['category']
  })

  const chartEvents = (events || []).filter(e => e.chartId === chart.id).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const patterns = detectRecurringPatterns(chartEvents, chart)

  const handleAddEvent = async () => {
    if (!newEvent.date || !newEvent.title) {
      toast.error('Please fill in date and title')
      return
    }

    try {
      const [year, month, day] = newEvent.date.split('-').map(Number)
      const eventDate = new Date(year, month - 1, day, 12, 0, 0)
      
      const transitData = await calculateTransitsForDate(chart, eventDate)
      
      const significantTransits: string[] = []
      
      transitData.planets.forEach(transitPlanet => {
        chart.planets.forEach(natalPlanet => {
          const angle = Math.abs(transitPlanet.longitude - natalPlanet.longitude) % 360
          const normalizedAngle = angle > 180 ? 360 - angle : angle
          
          if (normalizedAngle < 2) {
            significantTransits.push(`${transitPlanet.name} conjunct natal ${natalPlanet.name}`)
          } else if (Math.abs(normalizedAngle - 180) < 2) {
            significantTransits.push(`${transitPlanet.name} opposite natal ${natalPlanet.name}`)
          } else if (Math.abs(normalizedAngle - 90) < 2) {
            significantTransits.push(`${transitPlanet.name} square natal ${natalPlanet.name}`)
          } else if (Math.abs(normalizedAngle - 120) < 2) {
            significantTransits.push(`${transitPlanet.name} trine natal ${natalPlanet.name}`)
          }
        })
      })

      const event: LifeEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        chartId: chart.id,
        date: newEvent.date,
        title: newEvent.title,
        description: newEvent.description,
        category: newEvent.category,
        transitData: {
          planets: transitData.planets.map(p => ({
            name: p.name,
            sign: p.sign,
            degree: p.degree,
            house: p.house
          })),
          significantTransits
        },
        createdAt: Date.now()
      }

      setEvents((current) => [...(current || []), event])
      setNewEvent({ date: '', title: '', description: '', category: 'other' })
      setIsAddingEvent(false)
      toast.success('Life event added successfully!')
    } catch (error) {
      console.error('Error adding event:', error)
      toast.error('Failed to calculate transits for this date')
    }
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents((current) => (current || []).filter(e => e.id !== eventId))
    toast.success('Event deleted')
  }

  const generateEventAnalysis = async (event: LifeEvent) => {
    if (!event.transitData) return

    setIsGeneratingAnalysis(true)
    try {
      const transitList = event.transitData.planets.map(p => 
        `${p.name} in ${p.sign} (House ${p.house}, ${p.degree.toFixed(2)}°)`
      ).join('\n')

      const significantTransitsList = event.transitData.significantTransits.length > 0
        ? event.transitData.significantTransits.join('\n')
        : 'No exact major aspects found'

      const prompt = (window.spark.llmPrompt as any)`You are an expert astrologer analyzing the astrological conditions during a significant life event.

=== NATAL CHART DATA ===
Person: ${chart.name}
Birth Date: ${chart.date}
Birth Time: ${chart.time}
Birth Location: ${chart.location}

Natal Planets:
${chart.planets.map(p => `${p.name} in ${p.sign} (House ${p.house}, ${p.degree.toFixed(2)}°)`).join('\n')}

=== LIFE EVENT ===
Date: ${event.date}
Event: ${event.title}
Category: ${CATEGORY_LABELS[event.category]}
${event.description ? `Description: ${event.description}` : ''}

=== TRANSITING PLANETS ON EVENT DATE ===
${transitList}

=== SIGNIFICANT TRANSIT-TO-NATAL ASPECTS ===
${significantTransitsList}

Provide a comprehensive astrological analysis of this life event. Include:

1. **Astrological Context**: What were the major transiting planetary energies active during this time?

2. **Transit-to-Natal Connections**: Analyze the significant aspects between transiting planets and natal planets. How did these transits activate the natal chart?

3. **House Activations**: Which houses were being activated by transits? What life areas were emphasized?

4. **Timing Significance**: Why was this particular time astrologically significant for this event to occur? Consider both the transits and the person's natal chart.

5. **Psychological & Spiritual Dimensions**: What was the deeper meaning or life lesson associated with this astrological moment?

6. **Growth Opportunities**: How could this person have worked consciously with these planetary energies?

Write in a warm, insightful, and professional tone. Be specific about how the transiting planets interacted with the natal chart. Help the person understand the cosmic timing and deeper meaning behind this life event.`

      const analysis = await window.spark.llm(prompt, 'gpt-4o')
      
      setEvents((current) =>
        (current || []).map(e =>
          e.id === event.id
            ? { ...e, description: e.description + '\n\n--- ASTROLOGICAL ANALYSIS ---\n\n' + analysis }
            : e
        )
      )
      
      toast.success('Analysis generated!')
    } catch (error) {
      console.error('Error generating analysis:', error)
      toast.error('Failed to generate analysis')
    } finally {
      setIsGeneratingAnalysis(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarBlank size={24} weight="bold" />
              Life Events Timeline
            </CardTitle>
            <CardDescription>
              Track significant life events and discover recurring astrological patterns
            </CardDescription>
          </div>
          <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={18} weight="bold" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Life Event</DialogTitle>
                <DialogDescription>
                  Record a significant life event and we'll calculate the planetary transits at that time
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="event-date">Date</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-title">Event Title</Label>
                  <Input
                    id="event-title"
                    placeholder="e.g., Started new job"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-category">Category</Label>
                  <Select
                    value={newEvent.category}
                    onValueChange={(value) => setNewEvent({ ...newEvent, category: value as LifeEvent['category'] })}
                  >
                    <SelectTrigger id="event-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-description">Description (Optional)</Label>
                  <Textarea
                    id="event-description"
                    placeholder="Add details about this event..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingEvent(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEvent}>
                  Add Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {chartEvents.length === 0 ? (
          <div className="text-center py-12">
            <CalendarBlank size={48} weight="thin" className="text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No life events recorded yet</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Start tracking significant moments in your life and discover the planetary transits that were active at those times.
            </p>
            <Button onClick={() => setIsAddingEvent(true)} className="gap-2">
              <Plus size={18} weight="bold" />
              Add Your First Event
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
              <TabsTrigger value="timeline" className="gap-2">
                <CalendarBlank size={18} weight="bold" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="patterns" className="gap-2">
                <Graph size={18} weight="bold" />
                Patterns
                {patterns.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {patterns.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-0">
              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent via-accent/50 to-transparent" />
            
            <div className="space-y-6">
              {chartEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-16"
                >
                  <div
                    className="absolute left-5 top-6 w-6 h-6 rounded-full border-4 border-background z-10"
                    style={{ backgroundColor: CATEGORY_COLORS[event.category] }}
                  />
                  
                  <Card className="border-l-4" style={{ borderLeftColor: CATEGORY_COLORS[event.category] }}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: CATEGORY_COLORS[event.category],
                                color: CATEGORY_COLORS[event.category]
                              }}
                            >
                              {CATEGORY_LABELS[event.category]}
                            </Badge>
                          </div>
                          <CardDescription className="font-mono">
                            {new Date(event.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash size={18} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {event.description && (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {event.description}
                        </p>
                      )}

                      {event.transitData && (
                        <div className="space-y-4">
                          <div className="bg-muted/30 rounded-lg p-4 border border-border">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <span>Planetary Positions on This Date</span>
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                              {event.transitData.planets.map((planet) => (
                                <div
                                  key={planet.name}
                                  className="text-xs bg-background/50 rounded-md p-2 border border-border"
                                >
                                  <div className="font-semibold mb-1">
                                    <span className="text-base mr-1">{PLANET_SYMBOLS[planet.name]}</span>
                                    {planet.name}
                                  </div>
                                  <div className="text-muted-foreground">
                                    <span className="mr-1">{ZODIAC_SYMBOLS[planet.sign as ZodiacSign]}</span>
                                    {planet.sign}
                                  </div>
                                  <div className="text-muted-foreground font-mono">
                                    {planet.degree.toFixed(1)}°
                                  </div>
                                  <div className="text-muted-foreground">
                                    House {planet.house}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {event.transitData.significantTransits.length > 0 && (
                            <div className="bg-accent/10 rounded-lg p-4 border border-accent/30">
                              <h4 className="text-sm font-semibold mb-3 text-accent">
                                Significant Transit Aspects
                              </h4>
                              <div className="space-y-2">
                                {event.transitData.significantTransits.map((transit, idx) => (
                                  <div
                                    key={idx}
                                    className="text-sm bg-background/50 rounded-md px-3 py-2 border border-accent/20"
                                  >
                                    {transit}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {!event.description.includes('--- ASTROLOGICAL ANALYSIS ---') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generateEventAnalysis(event)}
                              disabled={isGeneratingAnalysis}
                              className="gap-2 w-full"
                            >
                              {isGeneratingAnalysis ? (
                                <>
                                  <Sparkle size={16} weight="fill" className="animate-spin" />
                                  Generating Analysis...
                                </>
                              ) : (
                                <>
                                  <Sparkle size={16} weight="fill" />
                                  Generate Astrological Analysis
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="mt-0">
          {patterns.length === 0 ? (
            <div className="text-center py-12">
              <Graph size={48} weight="thin" className="text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No recurring patterns detected yet</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Add more life events to discover recurring astrological patterns and connections.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <PatternVisualization patterns={patterns} />

              <div className="bg-muted/30 rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <TrendUp size={24} weight="bold" className="text-accent" />
                  Recurring Astrological Patterns
                </h3>
                <p className="text-sm text-muted-foreground">
                  These patterns reveal cosmic themes that have repeatedly appeared during significant moments in your life.
                </p>
              </div>

              {patterns
                .sort((a, b) => {
                  const sigOrder = { high: 0, medium: 1, low: 2 }
                  return sigOrder[a.significance] - sigOrder[b.significance] || b.frequency - a.frequency
                })
                .map((pattern, index) => (
                  <motion.div
                    key={pattern.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className="border-l-4 cursor-pointer hover:shadow-lg transition-shadow"
                      style={{ borderLeftColor: pattern.color }}
                      onClick={() => setSelectedPattern(pattern.id === selectedPattern?.id ? null : pattern)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <CardTitle className="text-lg">{pattern.name}</CardTitle>
                              <Badge
                                variant={pattern.significance === 'high' ? 'default' : 'outline'}
                                style={{
                                  backgroundColor: pattern.significance === 'high' ? pattern.color : 'transparent',
                                  borderColor: pattern.color,
                                  color: pattern.significance === 'high' ? 'white' : pattern.color
                                }}
                              >
                                {pattern.significance.toUpperCase()}
                              </Badge>
                              <Badge variant="secondary" className="gap-1">
                                <span className="font-mono">{pattern.frequency}</span>
                                occurrences
                              </Badge>
                            </div>
                            <CardDescription className="leading-relaxed">
                              {pattern.description}
                            </CardDescription>
                          </div>
                          <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                            style={{ 
                              backgroundColor: `${pattern.color}20`,
                              color: pattern.color,
                              border: `2px solid ${pattern.color}`
                            }}
                          >
                            {pattern.frequency}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <AnimatePresence>
                        {selectedPattern?.id === pattern.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <CardContent className="border-t border-border pt-6">
                              <h4 className="text-sm font-semibold mb-4">Events Connected by This Pattern:</h4>
                              <div className="space-y-3">
                                {pattern.occurrences.map((occurrence, idx) => {
                                  const event = chartEvents.find(e => e.id === occurrence.eventId)
                                  return (
                                    <div
                                      key={idx}
                                      className="bg-background rounded-lg p-4 border-l-2"
                                      style={{ borderLeftColor: event ? CATEGORY_COLORS[event.category] : pattern.color }}
                                    >
                                      <div className="flex items-start justify-between gap-4 mb-2">
                                        <div className="flex-1">
                                          <div className="font-semibold text-sm mb-1">{occurrence.eventTitle}</div>
                                          <div className="text-xs text-muted-foreground font-mono mb-2">
                                            {new Date(occurrence.eventDate).toLocaleDateString('en-US', {
                                              year: 'numeric',
                                              month: 'long',
                                              day: 'numeric'
                                            })}
                                          </div>
                                        </div>
                                        {event && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                            style={{
                                              borderColor: CATEGORY_COLORS[event.category],
                                              color: CATEGORY_COLORS[event.category]
                                            }}
                                          >
                                            {CATEGORY_LABELS[event.category]}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs bg-muted/50 rounded px-3 py-2 font-mono">
                                        {occurrence.relevantData}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    )}
  </CardContent>
</Card>
  )
}
