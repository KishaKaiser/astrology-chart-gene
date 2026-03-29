import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { BirthTimeRectification } from '@/components/BirthTimeRectification'

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
    { name: 'New York, USA', lat: 40.7128, lng: -74.0060, tz: '-05:00' },
    { name: 'London, UK', lat: 51.5074, lng: -0.1278, tz: '+00:00' },
    { name: 'Paris, France', lat: 48.8566, lng: 2.3522, tz: '+01:00' },
    { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, tz: '+09:00' },
    { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093, tz: '+10:00' },
    { name: 'Los Angeles, USA', lat: 34.0522, lng: -118.2437, tz: '-08:00' },
  ]

  const setCity = (city: typeof popularCities[0]) => {
    setFormData(prev => ({
      ...prev,
      location: city.name,
      latitude: city.lat,
      longitude: city.lng,
      timezone: city.tz
    }))
  }

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="gap-2 text-white"
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

            <div className="space-y-2">
              <Label htmlFor="chart-location" className="text-foreground">Birth Location *</Label>
              <Input
                id="chart-location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, Country"
                required
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {popularCities.map(city => (
                  <Button
                    key={city.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCity(city)}
                    className="text-xs"
                  >
                    {city.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chart-latitude" className="text-foreground">Latitude *</Label>
                <Input
                  id="chart-latitude"
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                  placeholder="40.7128"
                  required
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chart-longitude" className="text-foreground">Longitude *</Label>
                <Input
                  id="chart-longitude"
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                  placeholder="-74.0060"
                  required
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chart-timezone" className="text-foreground">Timezone *</Label>
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Generate Chart
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
