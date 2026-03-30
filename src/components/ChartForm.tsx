import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Sun, Moon, Clock, Info, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { BirthTimeRectification } from '@/components/BirthTimeRectification'
import { LocationSearch } from '@/components/LocationSearch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { findTimezoneByCoordinates, formatTimezoneDisplay, formatDSTDisplay, getTimezoneOffset } from '@/lib/timezone-db'
import { calculateDST, formatDSTInfo, formatDSTDetails } from '@/lib/dst-calculator'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ChartFormProps {
  onSubmit: (data: ChartFormData) => void
}

export interface ChartFormData {
  name: string
  date: string
  time: string
  location: string
  latitude: number
  longitude: number
  timezone: string
  notes?: string
}

export function ChartForm({ onSubmit }: ChartFormProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<ChartFormData>({
    name: '',
    date: '',
    time: '',
    location: '',
    latitude: 0,
    longitude: 0,
    timezone: '+00:00',
    notes: ''
  })
  const [dstInfo, setDstInfo] = useState<ReturnType<typeof calculateDST> | null>(null)
  
  const getLatitudeWarning = (latitude: number): { severity: 'warning' | 'error', message: string } | null => {
    const absLat = Math.abs(latitude)
    
    if (absLat > 80) {
      return {
        severity: 'error',
        message: `Extreme polar latitude (${latitude.toFixed(2)}°). Chart calculations will likely fail due to astronomical house system limitations near the poles. Consider using a different location or be prepared for calculation errors.`
      }
    } else if (absLat > 66.5) {
      return {
        severity: 'warning',
        message: `High latitude location (${latitude.toFixed(2)}°) above the Arctic/Antarctic Circle. House calculations may be unreliable or fail during certain times of year when the sun doesn't rise or set normally.`
      }
    }
    
    return null
  }
  
  const latitudeWarning = formData.latitude !== 0 ? getLatitudeWarning(formData.latitude) : null

  useEffect(() => {
    if (formData.date && formData.time && formData.timezone) {
      const [year, month, day] = formData.date.split('-').map(Number)
      const [hours, minutes] = formData.time.split(':').map(Number)
      const birthDate = new Date(year, month - 1, day, hours, minutes, 0)
      
      const result = calculateDST(birthDate, formData.timezone)
      setDstInfo(result)
    } else {
      setDstInfo(null)
    }
  }, [formData.date, formData.time, formData.timezone])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.date || !formData.time || !formData.location) {
      toast.error('Please fill in all required fields')
      return
    }

    onSubmit(formData)
    setOpen(false)
    setFormData({
      name: '',
      date: '',
      time: '',
      location: '',
      latitude: 0,
      longitude: 0,
      timezone: '+00:00',
      notes: ''
    })
  }

  const popularCities = [
    { name: 'New York, USA', lat: 40.7128, lng: -74.0060 },
    { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
    { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
    { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
    { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
    { name: 'Los Angeles, USA', lat: 34.0522, lng: -118.2437 },
  ]

  const setCity = (city: typeof popularCities[0]) => {
    const timezoneIdentifier = findTimezoneByCoordinates(city.lat, city.lng)
    const timezoneOffset = getTimezoneOffset(timezoneIdentifier)
    setFormData(prev => ({
      ...prev,
      location: city.name,
      latitude: city.lat,
      longitude: city.lng,
      timezone: timezoneOffset
    }))
  }

  const timezoneIdentifierForDisplay = formData.timezone.match(/^[+-]\d{2}:\d{2}$/) 
    ? findTimezoneByCoordinates(formData.latitude, formData.longitude)
    : formData.timezone

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="gap-2 text-white hover:bg-accent hover:text-accent-foreground"
        size="lg"
      >
        <Plus size={20} weight="bold" />
        Generate New Chart
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-foreground">Generate Natal Chart</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter birth details to generate an accurate astrology chart
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="chart-name" className="text-foreground">Name *</Label>
              <Input
                id="chart-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Client name or chart identifier"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chart-date" className="text-foreground">Birth Date *</Label>
                <Input
                  id="chart-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chart-time" className="text-foreground">Birth Time *</Label>
                <div className="flex gap-2">
                  <Input
                    id="chart-time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    required
                    className="flex-1"
                  />
                  {formData.date && formData.location && formData.latitude !== 0 && (
                    <BirthTimeRectification
                      birthDate={formData.date}
                      location={formData.location}
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      timezone={formData.timezone}
                      onTimeSelected={(time) => setFormData(prev => ({ ...prev, time }))}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-foreground">Birth Location *</Label>
              <Tabs defaultValue="search" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="search" className="hover:bg-accent/10">Search Location</TabsTrigger>
                  <TabsTrigger value="manual" className="hover:bg-accent/10">Manual Entry</TabsTrigger>
                </TabsList>
                
                <TabsContent value="search" className="space-y-3 mt-4">
                  <LocationSearch
                    value={formData.location}
                    onLocationSelect={(location) => {
                      setFormData(prev => ({
                        ...prev,
                        location: location.name,
                        latitude: location.latitude,
                        longitude: location.longitude,
                        timezone: location.timezone
                      }))
                    }}
                  />
                  
                  {formData.location && formData.latitude !== 0 && (
                    <div className="space-y-3">
                      <div className="p-4 bg-accent/10 border border-accent/20 rounded-md space-y-3">
                        <div>
                          <p className="text-sm text-foreground font-medium mb-1">{formData.location}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {formData.latitude.toFixed(4)}°, {formData.longitude.toFixed(4)}°
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Sun size={16} className="text-accent" weight="fill" />
                            <p className="text-xs text-accent font-medium">
                              {formatTimezoneDisplay(timezoneIdentifierForDisplay)}
                            </p>
                          </div>
                          
                          <div className="flex items-start gap-2 pl-6">
                            <Moon size={14} className="text-muted-foreground mt-0.5" weight="fill" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {formatDSTDisplay(timezoneIdentifierForDisplay)}
                            </p>
                          </div>
                        </div>
                        
                        {dstInfo && (
                          <div className="pt-3 border-t border-accent/20">
                            <Alert className="bg-background/50 border-accent/30">
                              <Clock size={16} className="text-accent" weight="bold" />
                              <AlertDescription className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <Info size={14} className="text-accent mt-0.5 flex-shrink-0" weight="bold" />
                                  <div>
                                    <p className="text-xs font-semibold text-foreground mb-1">
                                      {formatDSTInfo(dstInfo)}
                                    </p>
                                    <div className="space-y-0.5">
                                      {formatDSTDetails(dstInfo).map((detail, idx) => (
                                        <p key={idx} className="text-xs text-muted-foreground">
                                          {detail}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}
                      </div>
                      
                      {latitudeWarning && (
                        <Alert className={latitudeWarning.severity === 'error' ? 'bg-destructive/10 border-destructive/50' : 'bg-yellow-500/10 border-yellow-500/50'}>
                          <Warning size={16} className={latitudeWarning.severity === 'error' ? 'text-destructive' : 'text-yellow-500'} weight="bold" />
                          <AlertDescription className="text-xs text-foreground">
                            {latitudeWarning.message}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Popular cities:</p>
                    <div className="flex flex-wrap gap-2">
                      {popularCities.map(city => (
                        <Button
                          key={city.name}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCity(city)}
                          className="text-xs text-foreground hover:bg-accent/20 hover:border-accent"
                        >
                          {city.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="manual" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="chart-location" className="text-foreground">Location Name</Label>
                    <Input
                      id="chart-location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Country"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="chart-latitude" className="text-foreground">Latitude</Label>
                      <Input
                        id="chart-latitude"
                        type="number"
                        step="0.0001"
                        min="-90"
                        max="90"
                        value={formData.latitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                        placeholder="40.7128"
                        required
                        className="font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="chart-longitude" className="text-foreground">Longitude</Label>
                      <Input
                        id="chart-longitude"
                        type="number"
                        step="0.0001"
                        min="-180"
                        max="180"
                        value={formData.longitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                        placeholder="-74.0060"
                        required
                        className="font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="chart-timezone" className="text-foreground">Timezone</Label>
                      <Input
                        id="chart-timezone"
                        value={formData.timezone}
                        onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                        placeholder="-05:00"
                        required
                        className="font-mono"
                      />
                    </div>
                  </div>
                  
                  {latitudeWarning && (
                    <Alert className={latitudeWarning.severity === 'error' ? 'bg-destructive/10 border-destructive/50' : 'bg-yellow-500/10 border-yellow-500/50'}>
                      <Warning size={16} className={latitudeWarning.severity === 'error' ? 'text-destructive' : 'text-yellow-500'} weight="bold" />
                      <AlertDescription className="text-xs text-foreground">
                        {latitudeWarning.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chart-notes" className="text-foreground">Notes</Label>
              <Textarea
                id="chart-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this chart..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="text-foreground hover:bg-accent/20 hover:border-accent">
                Cancel
              </Button>
              <Button type="submit" className="hover:bg-accent hover:text-accent-foreground">
                Generate Chart
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
