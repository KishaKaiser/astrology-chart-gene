import { useState } from 'react'
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
}

export function ExportOptionsDialog({ onExport, hasInterpretation, disabled, variant = 'default' }: ExportOptionsDialogProps) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<PDFExportOptions>(defaultPDFOptions)

  const handleExport = () => {
    onExport(options)
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
                <Label htmlFor="includeChartWheel" className="cursor-pointer flex-1">
                  <div className="font-medium">🎡 Natal Chart Wheel</div>
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
                  <div className="font-medium">🏛️ House Meanings</div>
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
                  <div className="font-medium">🔮 Major Aspects</div>
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
                  <div className="font-medium">🔗 Aspect Patterns</div>
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
                  <div className="font-medium">👑 Planetary Dignities</div>
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
                  className={`cursor-pointer flex-1 ${!hasInterpretation ? 'opacity-50' : ''}`}
                >
                  <div className="font-medium">✨ Full Chart Interpretation</div>
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
            <div className="text-xs text-muted-foreground mb-3">
              These sections are placeholders. Generate the respective reports first, then they'll be included automatically in future exports.
            </div>
            <div className="space-y-3 opacity-50">
              <div className="flex items-center space-x-3">
                <Checkbox id="includePersonalHoroscope" disabled />
                <Label htmlFor="includePersonalHoroscope" className="flex-1">
                  <div className="font-medium text-sm">🌙 Personal Horoscope</div>
                  <div className="text-xs text-muted-foreground">Daily forecast and timing</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox id="includeCompatibility" disabled />
                <Label htmlFor="includeCompatibility" className="flex-1">
                  <div className="font-medium text-sm">💕 Romantic Compatibility</div>
                  <div className="text-xs text-muted-foreground">Synastry and relationship analysis</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox id="includeKarmicBond" disabled />
                <Label htmlFor="includeKarmicBond" className="flex-1">
                  <div className="font-medium text-sm">♾️ Karmic Bond Analysis</div>
                  <div className="text-xs text-muted-foreground">Soul connections and past patterns</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox id="includePastLife" disabled />
                <Label htmlFor="includePastLife" className="flex-1">
                  <div className="font-medium text-sm">🔄 Past Life Indicators</div>
                  <div className="text-xs text-muted-foreground">Karmic imprints and soul journey</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox id="includeKarmicDebt" disabled />
                <Label htmlFor="includeKarmicDebt" className="flex-1">
                  <div className="font-medium text-sm">⚖️ Karmic Debt Calculator</div>
                  <div className="text-xs text-muted-foreground">Numerological karmic numbers</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox id="includeFamily" disabled />
                <Label htmlFor="includeFamily" className="flex-1">
                  <div className="font-medium text-sm">👨‍👩‍👧‍👦 Family Dynamics</div>
                  <div className="text-xs text-muted-foreground">Family synastry and patterns</div>
                </Label>
              </div>
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
