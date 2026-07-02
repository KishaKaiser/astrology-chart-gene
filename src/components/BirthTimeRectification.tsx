import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Clock, Plus, Trash, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { rectifyBirthTime } from '@/lib/rectification'

interface LifeEvent {
  id: string
  type: string
  date: string
  description: string
}

interface BirthTimeRectificationProps {
  birthDate: string
  location: string
  latitude: number
  longitude: number
  timezone: string
  onTimeSelected: (time: string) => void
}

const EVENT_TYPES = [
  { value: 'marriage', label: 'Marriage/Partnership' },
  { value: 'child', label: 'Birth of Child' },
  { value: 'career', label: 'Career Change/Promotion' },
  { value: 'relocation', label: 'Major Relocation' },
  { value: 'accident', label: 'Accident/Injury' },
  { value: 'loss', label: 'Loss/Death of Loved One' },
  { value: 'education', label: 'Educational Milestone' },
  { value: 'financial', label: 'Major Financial Event' },
  { value: 'health', label: 'Health Crisis' },
  { value: 'spiritual', label: 'Spiritual Awakening' },
]

export function BirthTimeRectification({
  birthDate,
  location,
  latitude,
  longitude,
  timezone,
  onTimeSelected
}: BirthTimeRectificationProps) {
  const [open, setOpen] = useState(false)
  const [events, setEvents] = useState<LifeEvent[]>([])
  const [newEvent, setNewEvent] = useState({
    type: '',
    date: '',
    description: ''
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [suggestedTimes, setSuggestedTimes] = useState<Array<{
    time: string
    score: number
    reasoning: string
  }>>([])

  const addEvent = () => {
    if (!newEvent.type || !newEvent.date) {
      toast.error('Please select event type and date')
      return
    }

    const event: LifeEvent = {
      id: Date.now().toString(),
      type: newEvent.type,
      date: newEvent.date,
      description: newEvent.description
    }

    setEvents(prev => [...prev, event])
    setNewEvent({ type: '', date: '', description: '' })
  }

  const removeEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const analyzeEvents = async () => {
    if (events.length === 0) {
      toast.error('Please add at least one life event')
      return
    }

    setIsAnalyzing(true)
    try {
      const results = await rectifyBirthTime(
        birthDate,
        location,
        latitude,
        longitude,
        timezone,
        events
      )
      setSuggestedTimes(results)
      toast.success('Analysis complete!')
    } catch (error) {
      console.error('Rectification error:', error)
      toast.error('Failed to analyze events. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const selectTime = (time: string) => {
    onTimeSelected(time)
    setOpen(false)
    toast.success(`Birth time set to ${time}`)
  }

  const getEventLabel = (type: string) => {
    return EVENT_TYPES.find(e => e.value === type)?.label || type
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2"
        size="sm"
      >
        <Clock weight="bold" />
        Unknown Time? Rectify
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Clock weight="bold" />
              Birth Time Rectification
            </DialogTitle>
            <DialogDescription>
              Help us narrow down your birth time by adding significant life events. 
              The system will analyze astrological transits to suggest possible birth times.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <Card className="p-4 bg-muted/30">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Plus weight="bold" />
                Add Life Event
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-type">Event Type *</Label>
                    <Select
                      value={newEvent.type}
                      onValueChange={(value) => setNewEvent(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger id="event-type">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-date">Event Date *</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-description">Description (Optional)</Label>
                  <Textarea
                    id="event-description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional details about this event..."
                    rows={2}
                  />
                </div>

                <Button
                  type="button"
                  onClick={addEvent}
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                >
                  <Plus weight="bold" />
                  Add Event
                </Button>
              </div>
            </Card>

            {events.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Life Events ({events.length})</h3>
                <div className="space-y-2">
                  {events.map(event => (
                    <Card key={event.id} className="p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{getEventLabel(event.type)}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEvent(event.id)}
                          className="shrink-0"
                        >
                          <Trash weight="bold" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={analyzeEvents}
                  disabled={isAnalyzing}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Sparkle weight="fill" />
                  {isAnalyzing ? 'Analyzing Events...' : 'Analyze & Suggest Birth Times'}
                </Button>
              </div>
            )}

            {suggestedTimes.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Suggested Birth Times</h3>
                <p className="text-sm text-muted-foreground">
                  Based on your life events, these birth times show the strongest astrological correlations:
                </p>
                <div className="space-y-2">
                  {suggestedTimes.map((result, index) => (
                    <Card key={index} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => selectTime(result.time)}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl font-bold font-mono">{result.time}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-accent">Match: {result.score}%</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{result.reasoning}</p>
                        </div>
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            selectTime(result.time)
                          }}
                          size="sm"
                        >
                          Use This Time
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {events.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  Add at least 3-5 significant life events for better accuracy
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
