import { useRef, useState, useEffect } from 'react'
import { ChartData, TransitData, PLANET_SYMBOLS, ASPECT_TYPES, ZodiacSign, ZODIAC_SYMBOLS } from '@/lib/astrology-types'
import { calculateCurrentTransits } from '@/lib/astrology-calc'
import { ZODIAC_INFO, PLANETARY_DIGNITIES, getPlanetaryDignity, getDignityDescription, getDignityColor, HOUSE_INFO, getHouseCategoryDescription } from '@/lib/zodiac-info'
import { detectAspectPatterns } from '@/lib/aspect-patterns'
import { getAspectInterpretation } from '@/lib/aspect-interpretations'
import { ChartWheel } from './ChartWheel'
import { AspectPatternDiagram } from './AspectPatternDiagram'
import { DailyHoroscope } from './DailyHoroscope'
import { LifeEventsTimeline } from './LifeEventsTimeline'
import { TransitInterpretation } from './TransitInterpretation'
import { ExportOptionsDialog } from './ExportOptionsDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Printer, PencilSimple, ArrowLeft, Sparkle } from '@phosphor-icons/react'
import { exportChartToPDF, PDFExportOptions } from '@/lib/pdf-export'
import { toast } from 'sonner'
import logoImage from '@/assets/images/logo.jpg'

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
    const loadTransits = async () => {
      if (showTransits) {
        try {
          const currentTransits = await calculateCurrentTransits(chart)
          setTransits(currentTransits)
        } catch (error) {
          console.error('Error calculating transits:', error)
        }
      }
    }
    loadTransits()
  }, [showTransits, chart])

  useEffect(() => {
    setInterpretation(chart.interpretation || '')
  }, [chart.interpretation])

  const handleExport = async (options: PDFExportOptions) => {
    toast.loading('Preparing PDF export...', { id: 'pdf-export' })
    try {
      const svg = svgRef.current
      console.log('SVG element for export:', svg)
      await exportChartToPDF(chart, svg, interpretation, options)
      toast.success(
        interpretation 
          ? 'PDF with full interpretation exported successfully!' 
          : 'PDF exported successfully! Generate an interpretation for more detailed insights.',
        { id: 'pdf-export', duration: 4000 }
      )
    } catch (error) {
      console.error('PDF export error in ChartView:', error)
      toast.error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'pdf-export' })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const generateInterpretation = async () => {
    setIsGeneratingInterpretation(true)
    toast.loading('Generating comprehensive chart interpretation in multiple parts...', { id: 'interpretation-progress' })
    
    try {
      const sun = chart.planets.find(p => p.name === 'Sun')
      const moon = chart.planets.find(p => p.name === 'Moon')
      const mercury = chart.planets.find(p => p.name === 'Mercury')
      const venus = chart.planets.find(p => p.name === 'Venus')
      const mars = chart.planets.find(p => p.name === 'Mars')
      const jupiter = chart.planets.find(p => p.name === 'Jupiter')
      const saturn = chart.planets.find(p => p.name === 'Saturn')
      const uranus = chart.planets.find(p => p.name === 'Uranus')
      const neptune = chart.planets.find(p => p.name === 'Neptune')
      const pluto = chart.planets.find(p => p.name === 'Pluto')

      const risingSign = chart.houses.find(h => h.number === 1)?.sign || 'Unknown'
      const mcSign = chart.houses.find(h => h.number === 10)?.sign || 'Unknown'

      const aspectList = chart.aspects.map(a => 
        `${a.planet1} ${a.type} ${a.planet2} (orb: ${a.orb.toFixed(2)}°)`
      ).join('\n')

      const elementCount = {
        Fire: 0,
        Earth: 0,
        Air: 0,
        Water: 0
      }

      const modalityCount = {
        Cardinal: 0,
        Fixed: 0,
        Mutable: 0
      }

      chart.planets.forEach(p => {
        if (['Aries', 'Leo', 'Sagittarius'].includes(p.sign)) elementCount.Fire++
        if (['Taurus', 'Virgo', 'Capricorn'].includes(p.sign)) elementCount.Earth++
        if (['Gemini', 'Libra', 'Aquarius'].includes(p.sign)) elementCount.Air++
        if (['Cancer', 'Scorpio', 'Pisces'].includes(p.sign)) elementCount.Water++

        if (['Aries', 'Cancer', 'Libra', 'Capricorn'].includes(p.sign)) modalityCount.Cardinal++
        if (['Taurus', 'Leo', 'Scorpio', 'Aquarius'].includes(p.sign)) modalityCount.Fixed++
        if (['Gemini', 'Virgo', 'Sagittarius', 'Pisces'].includes(p.sign)) modalityCount.Mutable++
      })

      const chartData = `Birth Data: ${chart.name}, ${chart.date} at ${chart.time}, ${chart.location}
Ascendant: ${risingSign} ${chart.ascendant.toFixed(1)}° | MC: ${mcSign} ${chart.midheaven.toFixed(1)}°

Planets: Sun ${sun?.sign} H${sun?.house}, Moon ${moon?.sign} H${moon?.house}, Mercury ${mercury?.sign} H${mercury?.house}, Venus ${venus?.sign} H${venus?.house}, Mars ${mars?.sign} H${mars?.house}, Jupiter ${jupiter?.sign} H${jupiter?.house}, Saturn ${saturn?.sign} H${saturn?.house}, Uranus ${uranus?.sign} H${uranus?.house}, Neptune ${neptune?.sign} H${neptune?.house}, Pluto ${pluto?.sign} H${pluto?.house}

Elements: Fire ${elementCount.Fire}, Earth ${elementCount.Earth}, Air ${elementCount.Air}, Water ${elementCount.Water}
Modalities: Cardinal ${modalityCount.Cardinal}, Fixed ${modalityCount.Fixed}, Mutable ${modalityCount.Mutable}

Major Aspects: ${aspectList}`

      console.log('=== GENERATING CHART INTERPRETATION IN 3 PARTS ===')
      
      toast.loading('Part 1/3: Core identity and personal planets...', { id: 'interpretation-progress' })
      const part1Prompt = (window.spark.llmPrompt as any)`You are an expert professional astrologer. Generate Part 1 of a comprehensive natal chart interpretation.

${chartData}

Write sections 1-5 in warm, professional tone. Each section should be 3-4 detailed paragraphs.

## 1. CHART OVERVIEW & DOMINANT THEMES
Analyze the overall chart energy. Discuss dominant elements (Fire ${elementCount.Fire}, Earth ${elementCount.Earth}, Air ${elementCount.Air}, Water ${elementCount.Water}) and modalities (Cardinal ${modalityCount.Cardinal}, Fixed ${modalityCount.Fixed}, Mutable ${modalityCount.Mutable}). What are the key themes and patterns in this chart?

## 2. CORE IDENTITY: SUN, MOON & RISING
Sun in ${sun?.sign} House ${sun?.house}: Discuss core identity, life purpose, and ego expression.
Moon in ${moon?.sign} House ${moon?.house}: Discuss emotional nature, needs, instincts, and inner world.
Rising ${risingSign} at ${chart.ascendant.toFixed(1)}°: Discuss personality mask, approach to life, and first impressions.
Explain how these three work together to create the person's essential nature.

## 3. COMMUNICATION & INTELLECT: MERCURY
Mercury in ${mercury?.sign} House ${mercury?.house}: Discuss communication style, thinking patterns, learning preferences, mental processes, and how they share ideas.

## 4. LOVE & VALUES: VENUS
Venus in ${venus?.sign} House ${venus?.house}: Discuss love language, aesthetic preferences, what they value, how they relate to others, and what brings them pleasure and harmony.

## 5. ACTION & DESIRE: MARS
Mars in ${mars?.sign} House ${mars?.house}: Discuss drive, assertiveness, anger expression, sexual nature, how they pursue desires, and what motivates action.

Write all 5 sections completely. Be thorough and insightful.`

      const part1 = await window.spark.llm(part1Prompt, 'gpt-4o')
      console.log(`Part 1 generated: ${part1.length} characters`)
      
      toast.loading('Part 2/3: Growth planets and life areas...', { id: 'interpretation-progress' })
      const part2Prompt = (window.spark.llmPrompt as any)`You are an expert professional astrologer. Generate Part 2 of the natal chart interpretation (sections 6-9).

${chartData}

Write sections 6-9 in warm, professional tone. Each section should be 3-4 detailed paragraphs.

## 6. EXPANSION & WISDOM: JUPITER
Jupiter in ${jupiter?.sign} House ${jupiter?.house}: Discuss growth areas, philosophy, beliefs, optimism, where luck flows, teaching/learning gifts, and how they expand consciousness.

## 7. DISCIPLINE & LESSONS: SATURN
Saturn in ${saturn?.sign} House ${saturn?.house}: Discuss life lessons, discipline, responsibilities, karmic patterns, limitations to overcome, fears, and where mastery develops through time.

## 8. TRANSFORMATION & OUTER PLANETS
Uranus in ${uranus?.sign} House ${uranus?.house}: Discuss innovation, rebellion, where they break conventions, and sudden insights.
Neptune in ${neptune?.sign} House ${neptune?.house}: Discuss spirituality, dreams, imagination, illusions, and connection to the divine.
Pluto in ${pluto?.sign} House ${pluto?.house}: Discuss transformation, power, death/rebirth cycles, shadow work, and deep psychological patterns.

## 9. ASPECT PATTERNS & DYNAMICS
Analyze the major aspects in the chart:
${aspectList}

Discuss internal tensions, harmonies, talent configurations, and how different parts of the personality interact. Identify any special patterns like T-squares, grand trines, stelliums, or other significant configurations.

Write all 4 sections completely. Be thorough and insightful.`

      const part2 = await window.spark.llm(part2Prompt, 'gpt-4o')
      console.log(`Part 2 generated: ${part2.length} characters`)
      
      toast.loading('Part 3/3: Life purpose and integration...', { id: 'interpretation-progress' })
      const part3Prompt = (window.spark.llmPrompt as any)`You are an expert professional astrologer. Generate Part 3 (final part) of the natal chart interpretation (sections 10-13).

${chartData}

Write sections 10-13 in warm, professional tone. Each section should be 3-4 detailed paragraphs.

## 10. LIFE PATH & CAREER
MC in ${mcSign} at ${chart.midheaven.toFixed(1)}°: Discuss career path, public role, reputation, and life direction. Consider 10th house themes, 2nd house (resources/income), and 6th house (daily work). What vocational paths suit this chart?

## 11. RELATIONSHIPS & PARTNERSHIPS
Analyze 7th house themes, Venus-Mars dynamics, and relationship patterns. Discuss romantic partnerships, marriage indicators, business partnerships, and how they relate one-on-one. What do they seek in partners? What challenges and gifts do they bring to relationships?

## 12. SOUL PURPOSE & SPIRITUAL PATH
Synthesize the chart to reveal soul purpose and spiritual path. What is this person here to learn and embody? Discuss spiritual gifts, psychic abilities, past life indicators, and areas for conscious evolution. How can they serve their highest purpose?

## 13. PRACTICAL GUIDANCE & INTEGRATION
Provide concrete, actionable advice for working with this chart energy. Discuss shadow work needed, gifts to develop, life areas requiring attention, and specific practices or approaches that support growth. How can they integrate all these energies into a fulfilling life?

Write all 4 sections completely. End with empowering, practical guidance. Be thorough and insightful.`

      const part3 = await window.spark.llm(part3Prompt, 'gpt-4o')
      console.log(`Part 3 generated: ${part3.length} characters`)
      
      const fullInterpretation = `${part1}\n\n${part2}\n\n${part3}`
      
      console.log('=== INTERPRETATION COMPLETE ===')
      console.log(`Total length: ${fullInterpretation.length} characters`)
      
      const sectionMatches = fullInterpretation.match(/##\s*\d+\./g)
      const sectionCount = sectionMatches ? sectionMatches.length : 0
      console.log(`Total sections generated: ${sectionCount}`)
      
      if (sectionCount >= 13) {
        toast.success('Complete 13-section interpretation generated successfully!', { id: 'interpretation-progress' })
      } else if (sectionCount >= 10) {
        toast.success(`Comprehensive interpretation with ${sectionCount} sections generated!`, { id: 'interpretation-progress' })
      } else {
        toast.warning(`Generated ${sectionCount} sections. Some sections may be incomplete.`, { id: 'interpretation-progress', duration: 6000 })
      }
      
      setInterpretation(fullInterpretation)
      onUpdateChart(chart.id, fullInterpretation)
    } catch (error) {
      toast.error('Failed to generate interpretation', { id: 'interpretation-progress' })
      console.error('Interpretation error:', error)
    } finally {
      setIsGeneratingInterpretation(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="print-only" style={{ display: 'none' }}>
        <div style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '30px', backgroundColor: '#441568', color: 'white' }}>
          <h1 className="chart-title" style={{ fontSize: '48px', marginBottom: '10px' }}>Psychic Link Charts</h1>
          <p style={{ fontSize: '14px', marginBottom: '0' }}>What Do The Stars Say About You?</p>
        </div>
        <div style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '10px' }}>
          <h2 className="client-name" style={{ fontSize: '36px', marginBottom: '10px', color: '#441568' }}>{chart.name}</h2>
          <p style={{ fontSize: '13px', color: '#505050' }}>{chart.date} at {chart.time}</p>
          <p style={{ fontSize: '13px', color: '#505050', marginBottom: '15px' }}>{chart.location}</p>
          <img src={logoImage} alt="Logo" style={{ width: '80px', height: '80px', margin: '0 auto', display: 'block' }} />
        </div>
      </div>

      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">{chart.name}</h1>
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
          <ExportOptionsDialog 
            onExport={handleExport}
            hasInterpretation={!!interpretation}
          />
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
            <ChartWheel ref={svgRef} chart={chart} transits={showTransits ? transits || undefined : undefined} />
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
                  <span className="font-mono text-foreground">{chart.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-mono text-foreground">{chart.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timezone:</span>
                  <span className="font-mono text-foreground">UTC{chart.timezone}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Location</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Place:</span>
                  <span className="text-[oklch(0.75_0.19_195)]">{chart.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latitude:</span>
                  <span className="font-mono text-[oklch(0.75_0.19_195)]">{chart.latitude.toFixed(4)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Longitude:</span>
                  <span className="font-mono text-[oklch(0.75_0.19_195)]">{chart.longitude.toFixed(4)}°</span>
                </div>
              </div>
            </div>

            {chart.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">Notes</h3>
                  <p className="text-sm text-foreground">{chart.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="planets" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-13">
          <TabsTrigger value="planets">Planetary Positions</TabsTrigger>
          <TabsTrigger value="houses">House Cusps</TabsTrigger>
          <TabsTrigger value="house-meanings">House Meanings</TabsTrigger>
          <TabsTrigger value="aspects">Major Aspects</TabsTrigger>
          <TabsTrigger value="patterns">Aspect Patterns</TabsTrigger>
          <TabsTrigger value="zodiac">Zodiac Signs</TabsTrigger>
          <TabsTrigger value="dignities">Planetary Dignities</TabsTrigger>
          <TabsTrigger value="interpretation">
            <Sparkle className="mr-1.5" size={16} weight="fill" />
            Interpretation
          </TabsTrigger>
          <TabsTrigger value="horoscope">
            <Sparkle className="mr-1.5" size={16} weight="fill" />
            Horoscopes
          </TabsTrigger>
          <TabsTrigger value="timeline">Life Events</TabsTrigger>
          <TabsTrigger value="transits" disabled={!showTransits}>Current Transits</TabsTrigger>
          <TabsTrigger value="transit-aspects" disabled={!showTransits}>Transit Aspects</TabsTrigger>
          <TabsTrigger value="transit-interpretation">
            <Sparkle className="mr-1.5" size={16} weight="fill" />
            Transit Interpretation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planets">
          <Card>
            <CardHeader>
              <CardTitle>Planetary Positions</CardTitle>
              <CardDescription>Exact positions of all planets in the natal chart with dignity status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Planet</TableHead>
                    <TableHead>Sign</TableHead>
                    <TableHead>Degree in Sign</TableHead>
                    <TableHead>House</TableHead>
                    <TableHead>Dignity</TableHead>
                    <TableHead>Longitude</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chart.planets.map((planet) => {
                    const dignity = getPlanetaryDignity(planet.name, planet.sign as ZodiacSign)
                    return (
                      <TableRow key={planet.name}>
                        <TableCell className="font-medium text-foreground">
                          <span className="text-xl mr-2">{PLANET_SYMBOLS[planet.name]}</span>
                          {planet.name}
                        </TableCell>
                        <TableCell className="text-foreground">
                          <span className="text-lg mr-2">{ZODIAC_SYMBOLS[planet.sign as ZodiacSign]}</span>
                          {planet.sign}
                        </TableCell>
                        <TableCell className="font-mono text-foreground">{planet.degree.toFixed(2)}°</TableCell>
                        <TableCell className="text-foreground">{planet.house}</TableCell>
                        <TableCell>
                          {dignity ? (
                            <Badge
                              variant="outline"
                              style={{ borderColor: getDignityColor(dignity), color: getDignityColor(dignity) }}
                              className="text-xs"
                            >
                              {dignity}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-foreground">{planet.longitude.toFixed(2)}°</TableCell>
                      </TableRow>
                    )
                  })}
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
                      <TableCell className="font-medium text-foreground">House {house.number}</TableCell>
                      <TableCell className="text-foreground">{house.sign}</TableCell>
                      <TableCell className="font-mono text-foreground">{house.cusp.toFixed(2)}°</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="house-meanings">
          <Card>
            <CardHeader>
              <CardTitle>House Meanings & Life Areas</CardTitle>
              <CardDescription>Comprehensive information about each of the 12 astrological houses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((houseNum) => {
                const houseInfo = HOUSE_INFO[houseNum]
                const userHouse = chart.houses.find(h => h.number === houseNum)
                return (
                  <div key={houseNum} className="border border-border rounded-lg p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{houseInfo.name}</h3>
                          {userHouse && (
                            <span className="text-sm text-muted-foreground font-mono">
                              {ZODIAC_SYMBOLS[userHouse.sign as ZodiacSign]} {userHouse.sign} at {userHouse.cusp.toFixed(2)}°
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge 
                            variant="outline" 
                            style={{ 
                              borderColor: houseInfo.category === 'Angular' ? 'oklch(0.70 0.20 150)' : 
                                          houseInfo.category === 'Succedent' ? 'oklch(0.78 0.15 85)' : 
                                          'oklch(0.60 0.22 40)',
                              color: houseInfo.category === 'Angular' ? 'oklch(0.70 0.20 150)' : 
                                     houseInfo.category === 'Succedent' ? 'oklch(0.78 0.15 85)' : 
                                     'oklch(0.60 0.22 40)'
                            }}
                          >
                            {houseInfo.category}
                          </Badge>
                          <Badge variant="outline" style={{ borderColor: getDignityColor('Domicile'), color: getDignityColor('Domicile') }}>
                            {houseInfo.element}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Natural Sign: {ZODIAC_SYMBOLS[houseInfo.naturalSign]} {houseInfo.naturalSign}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Natural Ruler: {PLANET_SYMBOLS[houseInfo.naturalRuler]} {houseInfo.naturalRuler}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {houseInfo.description}
                    </p>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">KEY THEMES:</p>
                      <div className="flex flex-wrap gap-2">
                        {houseInfo.keywords.map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">LIFE AREAS GOVERNED:</p>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                        {houseInfo.lifeAreas.map((area, idx) => (
                          <li key={idx} className="list-disc">{area}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-muted/30 rounded-md border border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">PSYCHOLOGICAL THEME:</p>
                      <p className="text-sm text-muted-foreground italic leading-relaxed">
                        {houseInfo.psychologicalTheme}
                      </p>
                    </div>
                  </div>
                )
              })}

              <div className="mt-8 p-5 bg-muted/30 rounded-lg border border-border space-y-4">
                <h4 className="font-semibold text-base">Understanding House Categories:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        style={{ borderColor: 'oklch(0.70 0.20 150)', color: 'oklch(0.70 0.20 150)' }}
                      >
                        Angular Houses
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {getHouseCategoryDescription('Angular')}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">Houses 1, 4, 7, 10</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        style={{ borderColor: 'oklch(0.78 0.15 85)', color: 'oklch(0.78 0.15 85)' }}
                      >
                        Succedent Houses
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {getHouseCategoryDescription('Succedent')}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">Houses 2, 5, 8, 11</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        style={{ borderColor: 'oklch(0.60 0.22 40)', color: 'oklch(0.60 0.22 40)' }}
                      >
                        Cadent Houses
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {getHouseCategoryDescription('Cadent')}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">Houses 3, 6, 9, 12</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aspects">
          <Card>
            <CardHeader>
              <CardTitle>Major Aspects</CardTitle>
              <CardDescription>Significant angular relationships between planets with interpretations</CardDescription>
            </CardHeader>
            <CardContent>
              {chart.aspects.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No major aspects found within orb
                </p>
              ) : (
                <div className="space-y-4">
                  {chart.aspects.map((aspect, index) => {
                    const aspectInfo = Object.values(ASPECT_TYPES).find(
                      (t) => t.name === aspect.type
                    )
                    const interpretation = getAspectInterpretation(aspect.planet1, aspect.planet2, aspect.type)
                    return (
                      <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-medium text-foreground">
                              <span className="text-xl mr-1.5">{PLANET_SYMBOLS[aspect.planet1]}</span>
                              {aspect.planet1}
                            </span>
                            <Badge
                              variant="outline"
                              style={{ borderColor: aspect.color, color: aspect.color }}
                              className="text-sm"
                            >
                              {aspectInfo?.symbol} {aspect.type}
                            </Badge>
                            <span className="text-lg font-medium text-foreground">
                              <span className="text-xl mr-1.5">{PLANET_SYMBOLS[aspect.planet2]}</span>
                              {aspect.planet2}
                            </span>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground font-mono">
                            <span>Orb: {aspect.orb.toFixed(2)}°</span>
                            <span>Angle: {aspect.angle}°</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {interpretation}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Aspect Patterns</CardTitle>
              <CardDescription>Complex configurations revealing deeper chart dynamics</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const patterns = detectAspectPatterns(chart.planets, chart.aspects)
                
                if (patterns.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-2">
                        No major aspect patterns detected in this chart
                      </p>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Aspect patterns like T-Squares, Grand Trines, and Yods require specific configurations of multiple aspects between planets.
                      </p>
                    </div>
                  )
                }

                return (
                  <div className="space-y-6">
                    {patterns.map((pattern, index) => (
                      <div key={index} className="border border-border rounded-lg p-5 space-y-4" style={{ borderLeftWidth: '4px', borderLeftColor: pattern.color }}>
                        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
                          <div className="flex items-start justify-center">
                            <AspectPatternDiagram pattern={pattern} />
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-semibold" style={{ color: pattern.color }}>
                                  {pattern.type}
                                </h3>
                                {pattern.element && (
                                  <Badge variant="outline" style={{ borderColor: pattern.color, color: pattern.color }}>
                                    {pattern.element}
                                  </Badge>
                                )}
                                {pattern.modality && (
                                  <Badge variant="outline" style={{ borderColor: pattern.color, color: pattern.color }}>
                                    {pattern.modality}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {pattern.description}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs font-semibold text-muted-foreground mr-2">PLANETS INVOLVED:</span>
                              {pattern.planets.map((planetName) => (
                                <Badge key={planetName} variant="secondary" className="text-sm">
                                  <span className="mr-1.5">{PLANET_SYMBOLS[planetName]}</span>
                                  {planetName}
                                </Badge>
                              ))}
                            </div>

                            <Separator />

                            <div className="bg-muted/30 rounded-md p-4">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">INTERPRETATION:</p>
                              <p className="text-sm text-foreground leading-relaxed">
                                {pattern.interpretation}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="mt-8 p-5 bg-muted/30 rounded-lg border border-border space-y-3">
                      <h4 className="font-semibold text-base">Understanding Aspect Patterns:</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Aspect patterns are configurations of three or more planets connected by major aspects. They represent core themes and dynamics in the natal chart that are more powerful than individual aspects. These patterns often describe significant life challenges, natural talents, and key areas of personal development.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <h5 className="text-sm font-semibold">Challenging Patterns:</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            <strong>T-Square:</strong> Creates dynamic tension requiring action<br/>
                            <strong>Grand Cross:</strong> Maximum challenge and maximum potential<br/>
                            <strong>Yod:</strong> Karmic or fated life direction
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-sm font-semibold">Harmonious Patterns:</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            <strong>Grand Trine:</strong> Natural talents and ease<br/>
                            <strong>Kite:</strong> Grand Trine with focused direction<br/>
                            <strong>Grand Sextile:</strong> Exceptional potential and gifts
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zodiac">
          <Card>
            <CardHeader>
              <CardTitle>Zodiac Sign Meanings</CardTitle>
              <CardDescription>Comprehensive information about each zodiac sign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(ZODIAC_INFO).map(([sign, info]) => (
                <div key={sign} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{ZODIAC_SYMBOLS[sign as ZodiacSign]}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{sign}</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" style={{ borderColor: getDignityColor('Domicile'), color: getDignityColor('Domicile') }}>
                            {info.element}
                          </Badge>
                          <Badge variant="outline" style={{ borderColor: getDignityColor('Exaltation'), color: getDignityColor('Exaltation') }}>
                            {info.modality}
                          </Badge>
                          <Badge variant="secondary">
                            Ruled by {info.ruler}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{info.description}</p>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">KEY THEMES:</p>
                    <div className="flex flex-wrap gap-2">
                      {info.keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dignities">
          <Card>
            <CardHeader>
              <CardTitle>Planetary Dignities in Your Chart</CardTitle>
              <CardDescription>Essential dignities show how well planets can express their nature</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Planet</TableHead>
                    <TableHead>Sign</TableHead>
                    <TableHead>Dignity Status</TableHead>
                    <TableHead>Meaning</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chart.planets.map((planet) => {
                    const dignity = getPlanetaryDignity(planet.name, planet.sign as ZodiacSign)
                    return (
                      <TableRow key={planet.name}>
                        <TableCell className="font-medium text-foreground">
                          <span className="text-xl mr-2">{PLANET_SYMBOLS[planet.name]}</span>
                          {planet.name}
                        </TableCell>
                        <TableCell className="text-foreground">
                          <span className="text-lg mr-2">{ZODIAC_SYMBOLS[planet.sign as ZodiacSign]}</span>
                          {planet.sign}
                        </TableCell>
                        <TableCell>
                          {dignity ? (
                            <Badge
                              variant="outline"
                              style={{ borderColor: getDignityColor(dignity), color: getDignityColor(dignity) }}
                            >
                              {dignity}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Peregrine</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {dignity ? getDignityDescription(dignity) : 'Neutral - Planet functions normally'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                <h4 className="font-semibold text-sm">Understanding Planetary Dignities:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" style={{ borderColor: getDignityColor('Domicile'), color: getDignityColor('Domicile') }}>
                      Domicile
                    </Badge>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Planet is in its ruling sign - operates at full strength and comfort
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" style={{ borderColor: getDignityColor('Exaltation'), color: getDignityColor('Exaltation') }}>
                      Exaltation
                    </Badge>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Planet is honored - expresses its highest and most refined qualities
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" style={{ borderColor: getDignityColor('Detriment'), color: getDignityColor('Detriment') }}>
                      Detriment
                    </Badge>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Planet is opposite its domicile - faces challenges expressing naturally
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" style={{ borderColor: getDignityColor('Fall'), color: getDignityColor('Fall') }}>
                      Fall
                    </Badge>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Planet is opposite its exaltation - struggles to manifest its nature
                    </p>
                  </div>
                </div>
              </div>
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
                    Chart Interpretation
                  </CardTitle>
                  <CardDescription>
                    Comprehensive astrological analysis by The Psychic Link
                  </CardDescription>
                </div>
                <Button 
                  onClick={generateInterpretation}
                  disabled={isGeneratingInterpretation}
                  className="gap-2 bg-accent hover:bg-accent/90"
                >
                  {isGeneratingInterpretation ? (
                    <>
                      <Sparkle size={18} weight="fill" className="animate-spin" />
                      Channeling Cosmic Wisdom...
                    </>
                  ) : (
                    <>
                      <Sparkle size={18} weight="fill" />
                      {interpretation ? 'Regenerate Reading' : 'Generate My Reading'}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {interpretation ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <div className="flex items-center gap-3">
                      <Sparkle size={24} weight="fill" className="text-accent" />
                      <div>
                        <p className="font-semibold text-sm">AI-Powered Astrological Reading</p>
                        <p className="text-xs text-muted-foreground">Generated by The Psychic Link's advanced interpretation engine</p>
                      </div>
                    </div>
                    <ExportOptionsDialog 
                      onExport={handleExport}
                      hasInterpretation={true}
                      variant="outline"
                    />
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    <div className="space-y-6 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {interpretation}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                      <Sparkle size={18} weight="fill" className="text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Need a fresh perspective? You can regenerate this interpretation at any time.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="mb-6">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl animate-pulse" />
                      <Sparkle size={64} weight="fill" className="text-accent relative" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold">Unlock Your Chart's Secrets</h3>
                  <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                    Generate a comprehensive, AI-powered astrological interpretation that reveals the deeper meanings behind your natal chart's planetary positions, aspects, and life themes.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                    <div className="p-4 rounded-lg bg-muted/20 border border-border">
                      <div className="text-accent mb-2">📖</div>
                      <p className="text-sm font-semibold mb-1 text-foreground">13 Detailed Sections</p>
                      <p className="text-xs text-muted-foreground">From core identity to soul purpose</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/20 border border-border">
                      <div className="text-accent mb-2">🎯</div>
                      <p className="text-sm font-semibold mb-1 text-foreground">Personalized Insights</p>
                      <p className="text-xs text-muted-foreground">Tailored to your unique chart</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/20 border border-border">
                      <div className="text-accent mb-2">✨</div>
                      <p className="text-sm font-semibold mb-1 text-foreground">Professional Analysis</p>
                      <p className="text-xs text-muted-foreground">Expert astrological guidance</p>
                    </div>
                  </div>

                  <Button 
                    onClick={generateInterpretation}
                    disabled={isGeneratingInterpretation}
                    size="lg"
                    className="gap-2 px-8 bg-accent hover:bg-accent/90"
                  >
                    {isGeneratingInterpretation ? (
                      <>
                        <Sparkle size={20} weight="fill" className="animate-spin" />
                        Channeling Cosmic Wisdom...
                      </>
                    ) : (
                      <>
                        <Sparkle size={20} weight="fill" />
                        Generate My Reading
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horoscope">
          <DailyHoroscope chart={chart} />
        </TabsContent>

        <TabsContent value="timeline">
          <LifeEventsTimeline chart={chart} />
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
                        <TableCell className="font-medium text-foreground">
                          <span className="text-xl mr-2">{PLANET_SYMBOLS[planet.name]}</span>
                          {planet.name}
                        </TableCell>
                        <TableCell className="text-foreground">{planet.sign}</TableCell>
                        <TableCell className="font-mono text-foreground">{planet.degree.toFixed(2)}°</TableCell>
                        <TableCell className="text-foreground">{planet.house}</TableCell>
                        <TableCell className="font-mono text-foreground">{planet.longitude.toFixed(2)}°</TableCell>
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
                            <TableCell className="font-medium text-foreground">
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
                            <TableCell className="font-medium text-foreground">
                              <span className="text-xl mr-2">{PLANET_SYMBOLS[aspect.natalPlanet]}</span>
                              {aspect.natalPlanet}
                            </TableCell>
                            <TableCell className="font-mono text-foreground">{aspect.orb.toFixed(2)}°</TableCell>
                            <TableCell className="font-mono text-foreground">{aspect.angle}°</TableCell>
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

        <TabsContent value="transit-interpretation">
          <TransitInterpretation chart={chart} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
