import { useRef, useState, useEffect } from 'react'
import { ChartData, TransitData, PLANET_SYMBOLS, ASPECT_TYPES } from '@/lib/astrology-types'
import { calculateCurrentTransits } from '@/lib/astrology-calc'
import { ChartWheel } from './ChartWheel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { DownloadSimple, Printer, PencilSimple, ArrowLeft, Sparkle } from '@phosphor-icons/react'
import { exportChartToPDF } from '@/lib/pdf-export'
import { toast } from 'sonner'

interface ChartViewProps {
  chart: ChartData
  onBack: () => void
  onEdit: () => void
  onUpdateChart: (chartId: string, interpretation: string) => void
}

export function ChartView({ chart, onBack, onEdit, onUpdateChart }: ChartViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [showTransits, setShowTransits] = useState(false)
  const [transits, setTransits] = useState<TransitData | null>(null)
  const [interpretation, setInterpretation] = useState<string>(chart.interpretation || '')
  const [isGeneratingInterpretation, setIsGeneratingInterpretation] = useState(false)

  useEffect(() => {
    if (showTransits) {
      const currentTransits = calculateCurrentTransits(chart)
      setTransits(currentTransits)
    }
  }, [showTransits, chart])

  useEffect(() => {
    setInterpretation(chart.interpretation || '')
  }, [chart.interpretation])

  const handleExport = async () => {
    const svg = document.querySelector('svg')
    await exportChartToPDF(chart, svg, interpretation)
  }

  const handlePrint = () => {
    window.print()
  }

  const generateInterpretation = async () => {
    setIsGeneratingInterpretation(true)
    try {
      const chartSummary = {
        name: chart.name,
        sunSign: chart.planets.find(p => p.name === 'Sun')?.sign,
        moonSign: chart.planets.find(p => p.name === 'Moon')?.sign,
        risingSign: chart.planets.find(p => p.name === 'Sun')?.sign,
        ascendant: chart.ascendant,
        planets: chart.planets.map(p => ({
          name: p.name,
          sign: p.sign,
          house: p.house,
          degree: p.degree
        })),
        majorAspects: chart.aspects.slice(0, 10).map(a => ({
          planet1: a.planet1,
          planet2: a.planet2,
          type: a.type,
          orb: a.orb
        }))
      }

      const planetList = chartSummary.planets.map(p => 
        `${p.name} in ${p.sign} (House ${p.house}, ${p.degree.toFixed(2)}°)`
      ).join('\n')

      const aspectList = chartSummary.majorAspects.map(a => 
        `${a.planet1} ${a.type} ${a.planet2} (orb: ${a.orb.toFixed(2)}°)`
      ).join('\n')

      const promptText = `You are a professional astrologer providing detailed chart interpretations.

Generate a comprehensive astrological interpretation for the following natal chart:

Name: ${chartSummary.name}
Sun Sign: ${chartSummary.sunSign}
Moon Sign: ${chartSummary.moonSign}
Ascendant: ${chartSummary.ascendant.toFixed(2)}°

Planetary Positions:
${planetList}

Major Aspects:
${aspectList}

Provide an interpretation covering:
1. Overall Chart Pattern & Energy
2. Sun, Moon, and Rising Sign synthesis
3. Key planetary placements and their meanings
4. Significant aspects and their influence
5. Life themes and potential strengths
6. Areas for growth and awareness

Format the response in clear sections with headers. Be insightful, professional, and constructive. Focus on psychological and developmental themes rather than predictions.`

      const result = await window.spark.llm(promptText, 'gpt-4o')
      setInterpretation(result)
      onUpdateChart(chart.id, result)
      toast.success('Interpretation generated and saved!')
    } catch (error) {
      toast.error('Failed to generate interpretation')
      console.error('Interpretation error:', error)
    } finally {
      setIsGeneratingInterpretation(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold">{chart.name}</h1>
            <p className="text-muted-foreground mt-1">
              {chart.date} at {chart.time} | {chart.location}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit} className="gap-2">
            <PencilSimple size={18} />
            Edit
          </Button>
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer size={18} />
            Print
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <DownloadSimple size={18} weight="bold" />
            {interpretation ? 'Export PDF with Interpretation' : 'Export PDF'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Natal Chart Wheel</CardTitle>
                <CardDescription>
                  House System: {chart.houseSystem} | ASC: {chart.ascendant.toFixed(2)}° | MC: {chart.midheaven.toFixed(2)}°
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="show-transits"
                  checked={showTransits}
                  onCheckedChange={setShowTransits}
                />
                <Label htmlFor="show-transits" className="text-sm cursor-pointer">
                  Show Transits
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartWheel chart={chart} transits={showTransits ? transits || undefined : undefined} />
            {showTransits && transits && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md border border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Current transits as of {transits.calculatedAt.toLocaleString()}
                </p>
                <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary border-2 border-accent" />
                    <span>Natal Planets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[oklch(0.60_0.22_40)] border-2 border-[oklch(0.75_0.25_45)]" />
                    <span>Transit Planets</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chart Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Birth Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-mono">{chart.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-mono">{chart.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timezone:</span>
                  <span className="font-mono">{chart.timezone}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Location</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Place:</span>
                  <span>{chart.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latitude:</span>
                  <span className="font-mono">{chart.latitude.toFixed(4)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Longitude:</span>
                  <span className="font-mono">{chart.longitude.toFixed(4)}°</span>
                </div>
              </div>
            </div>

            {chart.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">Notes</h3>
                  <p className="text-sm">{chart.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="planets" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="planets">Planetary Positions</TabsTrigger>
          <TabsTrigger value="houses">House Cusps</TabsTrigger>
          <TabsTrigger value="aspects">Major Aspects</TabsTrigger>
          <TabsTrigger value="interpretation">
            <Sparkle className="mr-1.5" size={16} weight="fill" />
            Interpretation
          </TabsTrigger>
          <TabsTrigger value="transits" disabled={!showTransits}>Current Transits</TabsTrigger>
          <TabsTrigger value="transit-aspects" disabled={!showTransits}>Transit Aspects</TabsTrigger>
        </TabsList>

        <TabsContent value="planets">
          <Card>
            <CardHeader>
              <CardTitle>Planetary Positions</CardTitle>
              <CardDescription>Exact positions of all planets in the natal chart</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Planet</TableHead>
                    <TableHead>Sign</TableHead>
                    <TableHead>Degree in Sign</TableHead>
                    <TableHead>House</TableHead>
                    <TableHead>Longitude</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chart.planets.map((planet) => (
                    <TableRow key={planet.name}>
                      <TableCell className="font-medium">
                        <span className="text-xl mr-2">{PLANET_SYMBOLS[planet.name]}</span>
                        {planet.name}
                      </TableCell>
                      <TableCell>{planet.sign}</TableCell>
                      <TableCell className="font-mono">{planet.degree.toFixed(2)}°</TableCell>
                      <TableCell>{planet.house}</TableCell>
                      <TableCell className="font-mono">{planet.longitude.toFixed(2)}°</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="houses">
          <Card>
            <CardHeader>
              <CardTitle>House Cusps</CardTitle>
              <CardDescription>12 house divisions using {chart.houseSystem} house system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>House</TableHead>
                    <TableHead>Sign</TableHead>
                    <TableHead>Cusp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chart.houses.map((house) => (
                    <TableRow key={house.number}>
                      <TableCell className="font-medium">House {house.number}</TableCell>
                      <TableCell>{house.sign}</TableCell>
                      <TableCell className="font-mono">{house.cusp.toFixed(2)}°</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aspects">
          <Card>
            <CardHeader>
              <CardTitle>Major Aspects</CardTitle>
              <CardDescription>Significant angular relationships between planets</CardDescription>
            </CardHeader>
            <CardContent>
              {chart.aspects.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No major aspects found within orb
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Planet 1</TableHead>
                      <TableHead>Aspect</TableHead>
                      <TableHead>Planet 2</TableHead>
                      <TableHead>Orb</TableHead>
                      <TableHead>Angle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chart.aspects.map((aspect, index) => {
                      const aspectInfo = Object.values(ASPECT_TYPES).find(
                        (t) => t.name === aspect.type
                      )
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{aspect.planet1}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              style={{ borderColor: aspect.color, color: aspect.color }}
                            >
                              {aspectInfo?.symbol} {aspect.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{aspect.planet2}</TableCell>
                          <TableCell className="font-mono">{aspect.orb.toFixed(2)}°</TableCell>
                          <TableCell className="font-mono">{aspect.angle}°</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interpretation">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkle size={24} weight="fill" className="text-accent" />
                    AI Chart Interpretation
                  </CardTitle>
                  <CardDescription>
                    Comprehensive astrological analysis powered by AI
                  </CardDescription>
                </div>
                <Button 
                  onClick={generateInterpretation}
                  disabled={isGeneratingInterpretation}
                  className="gap-2"
                >
                  {isGeneratingInterpretation ? (
                    <>
                      <Sparkle size={18} weight="fill" className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkle size={18} weight="fill" />
                      {interpretation ? 'Regenerate' : 'Generate'} Interpretation
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {interpretation ? (
                <div className="prose prose-invert max-w-none">
                  <div className="space-y-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {interpretation}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkle size={48} weight="fill" className="text-accent/30 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No interpretation generated yet
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Click the button above to generate a comprehensive AI-powered interpretation of this natal chart, including planetary positions, aspects, and life themes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transits">
          <Card>
            <CardHeader>
              <CardTitle>Current Transit Positions</CardTitle>
              <CardDescription>
                {transits ? `Calculated as of ${transits.calculatedAt.toLocaleString()}` : 'Enable transit display to view current planetary positions'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transits ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Planet</TableHead>
                      <TableHead>Sign</TableHead>
                      <TableHead>Degree in Sign</TableHead>
                      <TableHead>House (in Natal Chart)</TableHead>
                      <TableHead>Longitude</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transits.planets.map((planet) => (
                      <TableRow key={planet.name}>
                        <TableCell className="font-medium">
                          <span className="text-xl mr-2">{PLANET_SYMBOLS[planet.name]}</span>
                          {planet.name}
                        </TableCell>
                        <TableCell>{planet.sign}</TableCell>
                        <TableCell className="font-mono">{planet.degree.toFixed(2)}°</TableCell>
                        <TableCell>{planet.house}</TableCell>
                        <TableCell className="font-mono">{planet.longitude.toFixed(2)}°</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Enable the &quot;Show Transits&quot; toggle above to view current planetary positions
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transit-aspects">
          <Card>
            <CardHeader>
              <CardTitle>Transit-to-Natal Aspects</CardTitle>
              <CardDescription>
                {transits ? `Current transiting planets forming aspects to natal planets (${transits.calculatedAt.toLocaleString()})` : 'Enable transit display to view transit aspects'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transits ? (
                transits.aspects.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No significant transit-to-natal aspects found within orb
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transit Planet</TableHead>
                        <TableHead>Aspect</TableHead>
                        <TableHead>Natal Planet</TableHead>
                        <TableHead>Orb</TableHead>
                        <TableHead>Angle</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transits.aspects.map((aspect, index) => {
                        const aspectInfo = Object.values(ASPECT_TYPES).find(
                          (t) => t.name === aspect.type
                        )
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <span className="text-xl mr-2">{PLANET_SYMBOLS[aspect.transitPlanet]}</span>
                              {aspect.transitPlanet}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                style={{ borderColor: aspect.color, color: aspect.color }}
                              >
                                {aspectInfo?.symbol} {aspect.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              <span className="text-xl mr-2">{PLANET_SYMBOLS[aspect.natalPlanet]}</span>
                              {aspect.natalPlanet}
                            </TableCell>
                            <TableCell className="font-mono">{aspect.orb.toFixed(2)}°</TableCell>
                            <TableCell className="font-mono">{aspect.angle}°</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Enable the &quot;Show Transits&quot; toggle above to view transit-to-natal aspects
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
