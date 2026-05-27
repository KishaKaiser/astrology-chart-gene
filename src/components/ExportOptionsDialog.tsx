import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { FamilyRelationshipData } from '@/lib/family-compatibility'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { DownloadSimple } from '@phosphor-icons/react'
import { PDFExportOptions, defaultPDFOptions } from '@/lib/pdf-export'

interface ExportOptionsDialogProps {
  onExport: (options: PDFExportOptions) => void
  hasInterpretation: boolean
  disabled?: boolean
  variant?: 'default' | 'outline'
  chartId?: string
}

interface FamilyDynamicsEntry {
  key: string
  data: FamilyRelationshipData
  displayName: string
}

interface HoroscopeReading {
  content: string
  generatedAt: number
}

export function ExportOptionsDialog({ onExport, hasInterpretation, disabled, variant = 'default', chartId }: ExportOptionsDialogProps) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<PDFExportOptions>(defaultPDFOptions)
  const [savedFamilyData] = useKV<Record<string, FamilyRelationshipData>>('family-dynamics', {})
  const [savedHoroscopes] = useKV<Record<string, HoroscopeReading>>('personal-horoscopes', {})
  const [familyDynamicsEntries, setFamilyDynamicsEntries] = useState<FamilyDynamicsEntry[]>([])
  const [selectedFamilyReports, setSelectedFamilyReports] = useState<Set<string>>(new Set())
  const [selectedHoroscopes, setSelectedHoroscopes] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (chartId && savedFamilyData) {
      const entries = Object.entries(savedFamilyData)
        .filter(([key]) => key.startsWith(`${chartId}-`) || key.includes(`-${chartId}-`))
        .map(([key, data]) => {
          const parts = key.split('-')
          const relationshipType = parts[2]
          const relationshipLabel = relationshipType === 'parent-child' ? 'Parent-Child' : 'Sibling'
          
          return {
            key,
            data,
            displayName: `${relationshipLabel}: ${data.person1.name} & ${data.person2.name}`
          }
        })
      
      setFamilyDynamicsEntries(entries)
    }
  }, [chartId, savedFamilyData])

  useEffect(() => {
    if (!open) {
      setSelectedFamilyReports(new Set())
      setSelectedHoroscopes(new Set())
    }
  }, [open])

  const toggleFamilyReport = (key: string) => {
    setSelectedFamilyReports(prev => {
      const updated = new Set(prev)
      if (updated.has(key)) {
        updated.delete(key)
      } else {
        updated.add(key)
      }
      return updated
    })
  }

  const toggleHoroscopeReport = (timeframe: string) => {
    setSelectedHoroscopes(prev => {
      const updated = new Set(prev)
      if (updated.has(timeframe)) {
        updated.delete(timeframe)
      } else {
        updated.add(timeframe)
      }
      return updated
    })
  }

  const getAvailableHoroscopes = () => {
    if (!chartId || !savedHoroscopes) return []
    
    const horoscopes: { key: string; label: string; content: string }[] = []
    const timeframes = ['daily', 'weekly', 'monthly']
    
    timeframes.forEach(timeframe => {
      const key = `${chartId}-${timeframe}`
      if (savedHoroscopes[key]?.content) {
        horoscopes.push({
          key: timeframe,
          label: timeframe.charAt(0).toUpperCase() + timeframe.slice(1),
          content: savedHoroscopes[key].content
        })
      }
    })
    
    return horoscopes
  }

  const availableHoroscopes = getAvailableHoroscopes()

  const handleExport = () => {
    let exportOptions = { ...options }
    
    if (selectedHoroscopes.size > 0 && savedHoroscopes && chartId) {
      const horoscopeTexts = Array.from(selectedHoroscopes).map(timeframe => {
        const key = `${chartId}-${timeframe}`
        const horoscope = savedHoroscopes[key]
        if (!horoscope) return ''
        
        const label = timeframe.charAt(0).toUpperCase() + timeframe.slice(1)
        const generatedDate = new Date(horoscope.generatedAt).toLocaleString()
        
        return `${label} Horoscope (Generated: ${generatedDate})\n\n${horoscope.content}`
      }).filter(text => text !== '')
      
      if (horoscopeTexts.length > 0) {
        exportOptions = {
          ...exportOptions,
          includePersonalHoroscope: horoscopeTexts.join('\n\n---\n\n')
        }
      }
    }
    
    if (selectedFamilyReports.size > 0 && savedFamilyData) {
      const familyTexts = Array.from(selectedFamilyReports).map(key => {
        const data = savedFamilyData[key]
        if (!data) return ''
        
        const parts = key.split('-')
        const relationshipType = parts[2]
        const relationshipLabel = relationshipType === 'parent-child' ? 'Parent-Child Relationship' : 'Sibling Relationship'
        
        let text = `${relationshipLabel}: ${data.person1.name} & ${data.person2.name}\n\n`
        text += `Overall Compatibility Score: ${data.overallScore}%\n\n`
        text += `Compatibility Breakdown:\n`
        data.compatibilityScores.forEach(score => {
          text += `- ${score.category}: ${score.score}% - ${score.description}\n`
        })
        
        if (data.aiInterpretation) {
          text += `\n\nDetailed Interpretation:\n${data.aiInterpretation}`
        }
        
        return text
      }).filter(text => text !== '')
      
      if (familyTexts.length > 0) {
        exportOptions = {
          ...exportOptions,
          includeFamily: familyTexts.join('\n\n---\n\n')
        }
      }
    }
    
    onExport(exportOptions)
    setOpen(false)
  }

  const toggleOption = (key: keyof PDFExportOptions) => {
    setOptions((prev) => ({
      ...prev,
      [key]: typeof prev[key] === 'boolean' ? !prev[key] : prev[key]
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant}
          disabled={disabled}
          className={variant === 'default' ? 'gap-2' : 'gap-2'}
        >
          <DownloadSimple size={18} weight="bold" />
          {hasInterpretation ? 'Export Complete PDF' : 'Export Chart PDF'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DownloadSimple size={24} weight="bold" className="text-accent" />
            Customize PDF Export
          </DialogTitle>
          <DialogDescription>
            Select which sections to include in your exported PDF report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Chart Data</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="includeChartWheel" 
                  checked={options.includeChartWheel}
                  onCheckedChange={() => toggleOption('includeChartWheel')}
                />
                <Label htmlFor="includeChartWheel" className="cursor-pointer flex-1 text-foreground">
                  <div className="font-medium text-foreground">🎡 Natal Chart Wheel</div>
                  <div className="text-xs text-muted-foreground">Visual diagram of planetary positions</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="includeHouseMeanings" 
                  checked={options.includeHouseMeanings}
                  onCheckedChange={() => toggleOption('includeHouseMeanings')}
                />
                <Label htmlFor="includeHouseMeanings" className="cursor-pointer flex-1 text-foreground">
                  <div className="font-medium text-foreground">🏛️ House Meanings</div>
                  <div className="text-xs text-muted-foreground">Detailed descriptions of all 12 houses</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="includeMajorAspects" 
                  checked={options.includeMajorAspects}
                  onCheckedChange={() => toggleOption('includeMajorAspects')}
                />
                <Label htmlFor="includeMajorAspects" className="cursor-pointer flex-1 text-foreground">
                  <div className="font-medium text-foreground">🔮 Major Aspects</div>
                  <div className="text-xs text-muted-foreground">Angular relationships between planets</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="includeAspectPatterns" 
                  checked={options.includeAspectPatterns}
                  onCheckedChange={() => toggleOption('includeAspectPatterns')}
                />
                <Label htmlFor="includeAspectPatterns" className="cursor-pointer flex-1 text-foreground">
                  <div className="font-medium text-foreground">🔗 Aspect Patterns</div>
                  <div className="text-xs text-muted-foreground">Complex configurations (T-Squares, Grand Trines, etc.)</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="includePlanetaryDignities" 
                  checked={options.includePlanetaryDignities}
                  onCheckedChange={() => toggleOption('includePlanetaryDignities')}
                />
                <Label htmlFor="includePlanetaryDignities" className="cursor-pointer flex-1 text-foreground">
                  <div className="font-medium text-foreground">👑 Planetary Dignities</div>
                  <div className="text-xs text-muted-foreground">Essential dignities and debilities</div>
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">AI-Generated Insights</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="includeInterpretation" 
                  checked={options.includeInterpretation}
                  onCheckedChange={() => toggleOption('includeInterpretation')}
                  disabled={!hasInterpretation}
                />
                <Label 
                  htmlFor="includeInterpretation" 
                  className={`cursor-pointer flex-1 text-foreground ${!hasInterpretation ? 'opacity-50' : ''}`}
                >
                  <div className="font-medium text-foreground">✨ Full Chart Interpretation</div>
                  <div className="text-xs text-muted-foreground">
                    {hasInterpretation 
                      ? 'Comprehensive AI-powered astrological analysis'
                      : 'Generate an interpretation first to include this'
                    }
                  </div>
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Additional Reports</h3>
            
            <div className={`space-y-3 ${availableHoroscopes.length === 0 ? 'opacity-50' : ''}`}>
              <Label className="flex-1 text-foreground">
                <div className="font-medium text-sm text-foreground">✨ Personal Horoscope Forecasts</div>
                <div className="text-xs text-muted-foreground">
                  {availableHoroscopes.length > 0
                    ? `Select which horoscope readings to include (${availableHoroscopes.length} available)`
                    : 'Generate horoscope readings first in the Personal tab'
                  }
                </div>
              </Label>
              
              {availableHoroscopes.length > 0 && (
                <div className="ml-6 space-y-2 border-l-2 border-border pl-4">
                  {availableHoroscopes.map((horoscope) => (
                    <div key={horoscope.key} className="flex items-center space-x-3">
                      <Checkbox 
                        id={`horoscope-${horoscope.key}`}
                        checked={selectedHoroscopes.has(horoscope.key)}
                        onCheckedChange={() => toggleHoroscopeReport(horoscope.key)}
                      />
                      <Label 
                        htmlFor={`horoscope-${horoscope.key}`}
                        className="cursor-pointer text-sm text-foreground"
                      >
                        {horoscope.label} Horoscope
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground mb-3 pt-2">
              Note: Romantic Compatibility, Karmic Bond, Past Life Indicators, and Karmic Debt reports are currently viewable in the app but not yet exportable to PDF. Use the app tabs to access these features.
            </div>
            
            <div className={`flex flex-col space-y-3 ${familyDynamicsEntries.length === 0 ? 'opacity-50' : ''}`}>
              <Label className="flex-1 text-foreground">
                <div className="font-medium text-sm text-foreground">👨‍👩‍👧‍👦 Family Dynamics</div>
                <div className="text-xs text-muted-foreground">
                  {familyDynamicsEntries.length > 0
                    ? `Select which family dynamics reports to include (${familyDynamicsEntries.length} available)`
                    : 'Generate a family dynamics report first'
                  }
                </div>
              </Label>
              
              {familyDynamicsEntries.length > 0 && (
                <div className="ml-6 space-y-2 border-l-2 border-border pl-4">
                  {familyDynamicsEntries.map((entry) => (
                    <div key={entry.key} className="flex items-center space-x-3">
                      <Checkbox 
                        id={`family-${entry.key}`}
                        checked={selectedFamilyReports.has(entry.key)}
                        onCheckedChange={() => toggleFamilyReport(entry.key)}
                      />
                      <Label 
                        htmlFor={`family-${entry.key}`} 
                        className="cursor-pointer text-sm text-foreground"
                      >
                        {entry.displayName}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} className="gap-2 bg-accent hover:bg-accent/90">
            <DownloadSimple size={18} weight="bold" />
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
