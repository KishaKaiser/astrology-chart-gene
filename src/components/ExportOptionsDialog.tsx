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

interface SavedCompatibilityReport {
  person1Id: string
  person2Id: string
  relationshipType: 'romantic' | 'friendship' | 'business'
  synastryData: any
  soulmateAnalysis: any
  aiInterpretation: string
  generatedAt: number
}

interface SavedKarmicReport {
  person1Id: string
  person2Id: string
  karmicData: any
  aiInterpretation: string
  generatedAt: number
}

interface PastLifeReading {
  southNodeSign: string
  southNodeHouse: number
  saturnsSign: string
  saturnsHouse: number
  plutosSign: string
  plutosHouse: number
  primaryLifeTheme: string
  lifeEra: string
  occupation: string
  challenges: string[]
  karmaLessons: string[]
  talents: string[]
  interpretation: string
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

export function ExportOptionsDialog({ onExport, hasInterpretation, disabled, variant = 'default', chartId }: ExportOptionsDialogProps) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<PDFExportOptions>(defaultPDFOptions)
  const [savedFamilyData] = useKV<Record<string, FamilyRelationshipData>>('family-dynamics', {})
  const [savedHoroscopes] = useKV<Record<string, HoroscopeReading>>('personal-horoscopes', {})
  const [savedCompatibilityReports] = useKV<Record<string, SavedCompatibilityReport>>('compatibility-reports', {})
  const [savedKarmicReports] = useKV<Record<string, SavedKarmicReport>>('karmic-reports', {})
  const [savedPastLifeReadings] = useKV<Record<string, PastLifeReading>>('past-life-readings', {})
  const [savedKarmicDebts] = useKV<Record<string, any>>('karmic-debt-results', [])
  const [savedImportantDays] = useKV<Record<string, ImportantDaysReading>>('important-days-readings', {})
  const [familyDynamicsEntries, setFamilyDynamicsEntries] = useState<FamilyDynamicsEntry[]>([])
  const [selectedFamilyReports, setSelectedFamilyReports] = useState<Set<string>>(new Set())
  const [selectedHoroscopes, setSelectedHoroscopes] = useState<Set<string>>(new Set())
  const [selectedCompatibilityReports, setSelectedCompatibilityReports] = useState<Set<string>>(new Set())
  const [selectedKarmicReports, setSelectedKarmicReports] = useState<Set<string>>(new Set())
  const [selectedPastLifeReadings, setSelectedPastLifeReadings] = useState<Set<string>>(new Set())
  const [selectedKarmicDebts, setSelectedKarmicDebts] = useState<Set<string>>(new Set())
  const [selectedImportantDays, setSelectedImportantDays] = useState<Set<string>>(new Set())

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
      setSelectedCompatibilityReports(new Set())
      setSelectedKarmicReports(new Set())
      setSelectedPastLifeReadings(new Set())
      setSelectedKarmicDebts(new Set())
      setSelectedImportantDays(new Set())
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

  const getAvailableCompatibilityReports = () => {
    if (!chartId || !savedCompatibilityReports) return []
    
    const reports: { key: string; label: string }[] = []
    
    Object.entries(savedCompatibilityReports).forEach(([key, report]) => {
      if (report.person1Id === chartId || report.person2Id === chartId) {
        const typeLabel = report.relationshipType === 'romantic' ? 'Romantic' : 
                         report.relationshipType === 'friendship' ? 'Friendship' : 'Business'
        reports.push({
          key,
          label: `${typeLabel} Compatibility Report`
        })
      }
    })
    
    return reports
  }

  const getAvailableKarmicReports = () => {
    if (!chartId || !savedKarmicReports) return []
    
    const reports: { key: string; label: string }[] = []
    
    Object.entries(savedKarmicReports).forEach(([key, report]) => {
      if (report.person1Id === chartId || report.person2Id === chartId) {
        reports.push({
          key,
          label: 'Karmic Bond Analysis'
        })
      }
    })
    
    return reports
  }

  const getAvailablePastLifeReadings = () => {
    if (!chartId || !savedPastLifeReadings) return []
    
    if (savedPastLifeReadings[chartId]) {
      return [{ key: chartId, label: 'Past Life Reading' }]
    }
    
    return []
  }

  const getAvailableKarmicDebts = () => {
    if (!chartId || !savedKarmicDebts || !Array.isArray(savedKarmicDebts)) return []
    
    const debts = savedKarmicDebts.filter((debt: any) => debt.chartId === chartId)
    
    return debts.map((debt: any, index: number) => ({
      key: `${chartId}-${index}`,
      label: 'Karmic Debt Analysis',
      data: debt
    }))
  }

  const getAvailableImportantDays = () => {
    if (!chartId || !savedImportantDays) return []
    
    const key = `${chartId}-important-days`
    if (savedImportantDays[key]) {
      return [{ key, label: 'Important Days - 6 Month Forecast' }]
    }
    
    return []
  }

  const availableCompatibilityReports = getAvailableCompatibilityReports()
  const availableKarmicReports = getAvailableKarmicReports()
  const availablePastLifeReadings = getAvailablePastLifeReadings()
  const availableKarmicDebts = getAvailableKarmicDebts()
  const availableImportantDays = getAvailableImportantDays()

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

    if (selectedCompatibilityReports.size > 0 && savedCompatibilityReports) {
      const compatibilityTexts = Array.from(selectedCompatibilityReports).map(key => {
        const report = savedCompatibilityReports[key]
        if (!report || !report.aiInterpretation) return ''
        
        const typeLabel = report.relationshipType === 'romantic' ? 'Romantic' : 
                         report.relationshipType === 'friendship' ? 'Friendship' : 'Business'
        
        let text = `${typeLabel} Compatibility Analysis\n\n`
        text += `Overall Score: ${report.synastryData.overallScore}%\n\n`
        text += report.aiInterpretation
        
        return text
      }).filter(text => text !== '')
      
      if (compatibilityTexts.length > 0) {
        exportOptions = {
          ...exportOptions,
          includeCompatibility: compatibilityTexts.join('\n\n---\n\n')
        }
      }
    }

    if (selectedKarmicReports.size > 0 && savedKarmicReports) {
      const karmicTexts = Array.from(selectedKarmicReports).map(key => {
        const report = savedKarmicReports[key]
        if (!report || !report.aiInterpretation) return ''
        
        let text = `Karmic Relationship Analysis\n\n`
        text += `Overall Karmic Score: ${report.karmicData.overallKarmicScore}%\n\n`
        text += report.aiInterpretation
        
        return text
      }).filter(text => text !== '')
      
      if (karmicTexts.length > 0) {
        exportOptions = {
          ...exportOptions,
          includeKarmicBond: karmicTexts.join('\n\n---\n\n')
        }
      }
    }

    if (selectedPastLifeReadings.size > 0 && savedPastLifeReadings && chartId) {
      const pastLifeTexts = Array.from(selectedPastLifeReadings).map(key => {
        const reading = savedPastLifeReadings[key]
        if (!reading) return ''
        
        let text = `Past Life Reading\n\n`
        text += `Life Theme: ${reading.primaryLifeTheme}\n`
        text += `Era: ${reading.lifeEra}\n`
        text += `Occupation: ${reading.occupation}\n\n`
        text += `Karmic Indicators:\n`
        text += `- South Node: ${reading.southNodeSign} in House ${reading.southNodeHouse}\n`
        text += `- Saturn: ${reading.saturnsSign} in House ${reading.saturnsHouse}\n`
        text += `- Pluto: ${reading.plutosSign} in House ${reading.plutosHouse}\n\n`
        text += `Challenges Faced:\n${reading.challenges.map(c => `- ${c}`).join('\n')}\n\n`
        text += `Karmic Lessons:\n${reading.karmaLessons.map(l => `- ${l}`).join('\n')}\n\n`
        text += `Gifts & Talents:\n${reading.talents.map(t => `- ${t}`).join('\n')}\n\n`
        text += `Past Life Story:\n${reading.interpretation}`
        
        return text
      }).filter(text => text !== '')
      
      if (pastLifeTexts.length > 0) {
        exportOptions = {
          ...exportOptions,
          includePastLife: pastLifeTexts.join('\n\n---\n\n')
        }
      }
    }

    if (selectedKarmicDebts.size > 0 && availableKarmicDebts.length > 0) {
      const debtTexts = Array.from(selectedKarmicDebts).map(key => {
        const debtEntry = availableKarmicDebts.find(d => d.key === key)
        if (!debtEntry) return ''
        
        const debt = debtEntry.data
        let text = `Karmic Debt Analysis\n\n`
        text += `Total Debt Score: ${debt.totalDebtScore}\n\n`
        
        if (debt.numerologyDebts && debt.numerologyDebts.length > 0) {
          text += `Numerology Debts:\n`
          debt.numerologyDebts.forEach((nd: any) => {
            text += `\n${nd.debtNumber} - ${nd.area}\n`
            text += `${nd.description}\n`
            text += `Past Life Pattern: ${nd.pastLifePattern}\n`
            text += `Resolution: ${nd.resolution}\n`
          })
          text += '\n'
        }
        
        if (debt.astrologicalDebts && debt.astrologicalDebts.length > 0) {
          text += `\nAstrological Indicators:\n`
          debt.astrologicalDebts.forEach((ad: any) => {
            text += `\n${ad.indicator} - ${ad.placement}\n`
            text += `${ad.karmicMeaning}\n`
            text += `Challenge: ${ad.lifeChallenge}\n`
            text += `Path to Balance: ${ad.pathToBalance}\n`
          })
          text += '\n'
        }
        
        if (debt.aiGuidance) {
          text += `\nSpiritual Guidance:\n${debt.aiGuidance}`
        }
        
        return text
      }).filter(text => text !== '')
      
      if (debtTexts.length > 0) {
        exportOptions = {
          ...exportOptions,
          includeKarmicDebt: debtTexts.join('\n\n---\n\n')
        }
      }
    }

    if (selectedImportantDays.size > 0 && savedImportantDays && chartId) {
      const importantDaysTexts = Array.from(selectedImportantDays).map(key => {
        const reading = savedImportantDays[key]
        if (!reading) return ''
        
        const startDate = new Date(reading.startDate).toLocaleDateString()
        const endDate = new Date(reading.endDate).toLocaleDateString()
        const generatedDate = new Date(reading.generatedAt).toLocaleString()
        
        let text = `Important Days - 6 Month Forecast\n`
        text += `Period: ${startDate} to ${endDate}\n`
        text += `Generated: ${generatedDate}\n\n`
        
        const groupedByMonth = reading.content.reduce((acc, day) => {
          const date = new Date(day.date)
          const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          if (!acc[monthKey]) {
            acc[monthKey] = []
          }
          acc[monthKey].push(day)
          return acc
        }, {} as Record<string, DayForecast[]>)
        
        const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
          return new Date(a).getTime() - new Date(b).getTime()
        })
        
        sortedMonths.forEach(monthKey => {
          text += `\n${monthKey}\n${'='.repeat(monthKey.length)}\n\n`
          
          const monthDays = groupedByMonth[monthKey].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          )
          
          monthDays.forEach(day => {
            const date = new Date(day.date)
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
            const dayOfMonth = date.getDate()
            const month = date.toLocaleDateString('en-US', { month: 'short' })
            
            const categoryIcon = day.category === 'romance' ? '💕' : 
                                day.category === 'career' ? '💼' : '💰'
            const intensityLabel = day.intensity.toUpperCase()
            
            text += `${categoryIcon} ${dayOfWeek}, ${month} ${dayOfMonth} - ${day.category.toUpperCase()} [${intensityLabel}]\n`
            text += `${day.description}\n`
            
            if (day.transitDetails) {
              text += `Transit: ${day.transitDetails.transitingPlanet} ${day.transitDetails.aspect} ${day.transitDetails.natalPlanet}`
              if (day.transitDetails.houses) {
                text += ` (${day.transitDetails.houses})`
              }
              text += '\n'
            }
            
            text += '\n'
          })
        })
        
        return text
      }).filter(text => text !== '')
      
      if (importantDaysTexts.length > 0) {
        exportOptions = {
          ...exportOptions,
          includeImportantDays: importantDaysTexts.join('\n\n---\n\n')
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
          <DialogTitle className="flex items-center gap-2 text-white">
            <DownloadSimple size={24} weight="bold" className="text-accent" />
            Customize PDF Export
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select which sections to include in your exported PDF report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Chart Data</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="includeChartWheel" 
                  checked={options.includeChartWheel}
                  onCheckedChange={() => toggleOption('includeChartWheel')}
                />
                <Label htmlFor="includeChartWheel" className="cursor-pointer flex-1">
                  <div className="font-medium text-white">🎡 Natal Chart Wheel</div>
                  <div className="text-xs text-muted-foreground">Visual diagram of planetary positions</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="includeHouseMeanings" 
                  checked={options.includeHouseMeanings}
                  onCheckedChange={() => toggleOption('includeHouseMeanings')}
                />
                <Label htmlFor="includeHouseMeanings" className="cursor-pointer flex-1">
                  <div className="font-medium text-white">🏛️ House Meanings</div>
                  <div className="text-xs text-muted-foreground">Detailed descriptions of all 12 houses</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="includeMajorAspects" 
                  checked={options.includeMajorAspects}
                  onCheckedChange={() => toggleOption('includeMajorAspects')}
                />
                <Label htmlFor="includeMajorAspects" className="cursor-pointer flex-1">
                  <div className="font-medium text-white">🔮 Major Aspects</div>
                  <div className="text-xs text-muted-foreground">Angular relationships between planets</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="includeAspectPatterns" 
                  checked={options.includeAspectPatterns}
                  onCheckedChange={() => toggleOption('includeAspectPatterns')}
                />
                <Label htmlFor="includeAspectPatterns" className="cursor-pointer flex-1">
                  <div className="font-medium text-white">🔗 Aspect Patterns</div>
                  <div className="text-xs text-muted-foreground">Complex configurations (T-Squares, Grand Trines, etc.)</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="includePlanetaryDignities" 
                  checked={options.includePlanetaryDignities}
                  onCheckedChange={() => toggleOption('includePlanetaryDignities')}
                />
                <Label htmlFor="includePlanetaryDignities" className="cursor-pointer flex-1">
                  <div className="font-medium text-white">👑 Planetary Dignities</div>
                  <div className="text-xs text-muted-foreground">Essential dignities and debilities</div>
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">AI-Generated Insights</h3>
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
                  className={`cursor-pointer flex-1 ${!hasInterpretation ? 'opacity-50' : ''}`}
                >
                  <div className="font-medium text-white">✨ Full Chart Interpretation</div>
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
            <h3 className="text-sm font-semibold text-white">Additional Reports</h3>
            
            <div className={`space-y-3 ${availableHoroscopes.length === 0 ? 'opacity-50' : ''}`}>
              <Label className="flex-1">
                <div className="font-medium text-sm text-white">✨ Personal Horoscope Forecasts</div>
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
                        className="cursor-pointer text-sm text-white"
                      >
                        {horoscope.label} Horoscope
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`space-y-3 ${availableCompatibilityReports.length === 0 ? 'opacity-50' : ''}`}>
              <Label className="flex-1">
                <div className="font-medium text-sm text-white">💕 Romantic Compatibility</div>
                <div className="text-xs text-muted-foreground">
                  {availableCompatibilityReports.length > 0
                    ? `Select compatibility reports to include (${availableCompatibilityReports.length} available)`
                    : 'Generate compatibility reports first in the Compatibility tab'
                  }
                </div>
              </Label>
              
              {availableCompatibilityReports.length > 0 && (
                <div className="ml-6 space-y-2 border-l-2 border-border pl-4">
                  {availableCompatibilityReports.map((report) => (
                    <div key={report.key} className="flex items-center space-x-3">
                      <Checkbox 
                        id={`compatibility-${report.key}`}
                        checked={selectedCompatibilityReports.has(report.key)}
                        onCheckedChange={() => {
                          setSelectedCompatibilityReports(prev => {
                            const updated = new Set(prev)
                            if (updated.has(report.key)) {
                              updated.delete(report.key)
                            } else {
                              updated.add(report.key)
                            }
                            return updated
                          })
                        }}
                      />
                      <Label 
                        htmlFor={`compatibility-${report.key}`}
                        className="cursor-pointer text-sm text-white"
                      >
                        {report.label}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`space-y-3 ${availableKarmicReports.length === 0 ? 'opacity-50' : ''}`}>
              <Label className="flex-1">
                <div className="font-medium text-sm text-white">♾️ Karmic Bond</div>
                <div className="text-xs text-muted-foreground">
                  {availableKarmicReports.length > 0
                    ? `Select karmic bond reports to include (${availableKarmicReports.length} available)`
                    : 'Generate karmic bond reports first in the Karmic Bond tab'
                  }
                </div>
              </Label>
              
              {availableKarmicReports.length > 0 && (
                <div className="ml-6 space-y-2 border-l-2 border-border pl-4">
                  {availableKarmicReports.map((report) => (
                    <div key={report.key} className="flex items-center space-x-3">
                      <Checkbox 
                        id={`karmic-${report.key}`}
                        checked={selectedKarmicReports.has(report.key)}
                        onCheckedChange={() => {
                          setSelectedKarmicReports(prev => {
                            const updated = new Set(prev)
                            if (updated.has(report.key)) {
                              updated.delete(report.key)
                            } else {
                              updated.add(report.key)
                            }
                            return updated
                          })
                        }}
                      />
                      <Label 
                        htmlFor={`karmic-${report.key}`}
                        className="cursor-pointer text-sm text-white"
                      >
                        {report.label}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`space-y-3 ${availablePastLifeReadings.length === 0 ? 'opacity-50' : ''}`}>
              <Label className="flex-1">
                <div className="font-medium text-sm text-white">🔮 Past Life Indicators</div>
                <div className="text-xs text-muted-foreground">
                  {availablePastLifeReadings.length > 0
                    ? `Select past life readings to include (${availablePastLifeReadings.length} available)`
                    : 'Generate a past life reading first in the Past Life tab'
                  }
                </div>
              </Label>
              
              {availablePastLifeReadings.length > 0 && (
                <div className="ml-6 space-y-2 border-l-2 border-border pl-4">
                  {availablePastLifeReadings.map((reading) => (
                    <div key={reading.key} className="flex items-center space-x-3">
                      <Checkbox 
                        id={`pastlife-${reading.key}`}
                        checked={selectedPastLifeReadings.has(reading.key)}
                        onCheckedChange={() => {
                          setSelectedPastLifeReadings(prev => {
                            const updated = new Set(prev)
                            if (updated.has(reading.key)) {
                              updated.delete(reading.key)
                            } else {
                              updated.add(reading.key)
                            }
                            return updated
                          })
                        }}
                      />
                      <Label 
                        htmlFor={`pastlife-${reading.key}`}
                        className="cursor-pointer text-sm text-white"
                      >
                        {reading.label}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`space-y-3 ${availableKarmicDebts.length === 0 ? 'opacity-50' : ''}`}>
              <Label className="flex-1">
                <div className="font-medium text-sm text-white">⚖️ Karmic Debt</div>
                <div className="text-xs text-muted-foreground">
                  {availableKarmicDebts.length > 0
                    ? `Select karmic debt analyses to include (${availableKarmicDebts.length} available)`
                    : 'Calculate karmic debt first in the Karmic Debt tab'
                  }
                </div>
              </Label>
              
              {availableKarmicDebts.length > 0 && (
                <div className="ml-6 space-y-2 border-l-2 border-border pl-4">
                  {availableKarmicDebts.map((debt) => (
                    <div key={debt.key} className="flex items-center space-x-3">
                      <Checkbox 
                        id={`debt-${debt.key}`}
                        checked={selectedKarmicDebts.has(debt.key)}
                        onCheckedChange={() => {
                          setSelectedKarmicDebts(prev => {
                            const updated = new Set(prev)
                            if (updated.has(debt.key)) {
                              updated.delete(debt.key)
                            } else {
                              updated.add(debt.key)
                            }
                            return updated
                          })
                        }}
                      />
                      <Label 
                        htmlFor={`debt-${debt.key}`}
                        className="cursor-pointer text-sm text-white"
                      >
                        {debt.label}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`space-y-3 ${availableImportantDays.length === 0 ? 'opacity-50' : ''}`}>
              <Label className="flex-1">
                <div className="font-medium text-sm text-white">📅 Important Days</div>
                <div className="text-xs text-muted-foreground">
                  {availableImportantDays.length > 0
                    ? `Select Important Days forecast to include (${availableImportantDays.length} available)`
                    : 'Generate an Important Days forecast first in the Important Days tab'
                  }
                </div>
              </Label>
              
              {availableImportantDays.length > 0 && (
                <div className="ml-6 space-y-2 border-l-2 border-border pl-4">
                  {availableImportantDays.map((forecast) => (
                    <div key={forecast.key} className="flex items-center space-x-3">
                      <Checkbox 
                        id={`important-days-${forecast.key}`}
                        checked={selectedImportantDays.has(forecast.key)}
                        onCheckedChange={() => {
                          setSelectedImportantDays(prev => {
                            const updated = new Set(prev)
                            if (updated.has(forecast.key)) {
                              updated.delete(forecast.key)
                            } else {
                              updated.add(forecast.key)
                            }
                            return updated
                          })
                        }}
                      />
                      <Label 
                        htmlFor={`important-days-${forecast.key}`}
                        className="cursor-pointer text-sm text-white"
                      >
                        {forecast.label}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground mb-3 pt-2">
              Note: Generate reports using the app tabs above, then return here to export them to PDF.
            </div>
            
            <div className={`flex flex-col space-y-3 ${familyDynamicsEntries.length === 0 ? 'opacity-50' : ''}`}>
              <Label className="flex-1">
                <div className="font-medium text-sm text-white">👨‍👩‍👧‍👦 Family Dynamics</div>
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
                        className="cursor-pointer text-sm text-white"
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
          <Button variant="outline" onClick={() => setOpen(false)} className="text-white">
            Cancel
          </Button>
          <Button onClick={handleExport} className="gap-2 bg-accent hover:bg-accent/90 text-white">
            <DownloadSimple size={18} weight="bold" />
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
