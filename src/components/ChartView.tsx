import { useRef, useState, useEffect } from 'react'
import { ChartData, TransitData, PLANET_SYMBOLS, ASPECT_TYPES, ZodiacSign, ZODIAC_SYMBOLS } from '@/lib/astrology-types'
import { calculateCurrentTransits } from '@/lib/astrology-calc'
import { ZODIAC_INFO, PLANETARY_DIGNITIES, getPlanetaryDignity, getDignityDescription, getDignityColor, HOUSE_INFO, getHouseCategoryDescription } from '@/lib/zodiac-info'
import { detectAspectPatterns } from '@/lib/aspect-patterns'
import { ChartWheel } from './ChartWheel'
import { AspectPatternDiagram } from './AspectPatternDiagram'
import { DailyHoroscope } from './DailyHoroscope'
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

      const planetList = chart.planets.map(p => 
        `${p.name} in ${p.sign} (House ${p.house}, ${p.degree.toFixed(2)}°)`
      ).join('\n')

      const aspectList = chart.aspects.map(a => 
        `${a.planet1} ${a.type} ${a.planet2} (orb: ${a.orb.toFixed(2)}°)`
      ).join('\n')

      const houseList = chart.houses.map(h =>
        `House ${h.number}: ${h.sign} at ${h.cusp.toFixed(2)}°`
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

      const promptText = (window.spark.llmPrompt as any)`You are an expert professional astrologer with deep knowledge of psychological astrology, providing comprehensive chart interpretations. Write in a warm, insightful, and professional tone.

Generate an in-depth astrological interpretation for the following natal chart:

=== BIRTH DATA ===
Name: ${chart.name}
Date: ${chart.date}
Time: ${chart.time}
Location: ${chart.location}

=== CHART ANGLES ===
Ascendant (Rising Sign): ${risingSign} at ${chart.ascendant.toFixed(2)}°
Midheaven (MC): ${mcSign} at ${chart.midheaven.toFixed(2)}°

=== PLANETARY POSITIONS ===
Sun: ${sun?.sign} (House ${sun?.house}, ${sun?.degree.toFixed(2)}°)
Moon: ${moon?.sign} (House ${moon?.house}, ${moon?.degree.toFixed(2)}°)
Mercury: ${mercury?.sign} (House ${mercury?.house}, ${mercury?.degree.toFixed(2)}°)
Venus: ${venus?.sign} (House ${venus?.house}, ${venus?.degree.toFixed(2)}°)
Mars: ${mars?.sign} (House ${mars?.house}, ${mars?.degree.toFixed(2)}°)
Jupiter: ${jupiter?.sign} (House ${jupiter?.house}, ${jupiter?.degree.toFixed(2)}°)
Saturn: ${saturn?.sign} (House ${saturn?.house}, ${saturn?.degree.toFixed(2)}°)
Uranus: ${uranus?.sign} (House ${uranus?.house}, ${uranus?.degree.toFixed(2)}°)
Neptune: ${neptune?.sign} (House ${neptune?.house}, ${neptune?.degree.toFixed(2)}°)
Pluto: ${pluto?.sign} (House ${pluto?.house}, ${pluto?.degree.toFixed(2)}°)

=== HOUSE CUSPS ===
${houseList}

=== MAJOR ASPECTS ===
${aspectList}

=== ELEMENTAL & MODAL BALANCE ===
Fire: ${elementCount.Fire} planets | Earth: ${elementCount.Earth} planets | Air: ${elementCount.Air} planets | Water: ${elementCount.Water} planets
Cardinal: ${modalityCount.Cardinal} planets | Fixed: ${modalityCount.Fixed} planets | Mutable: ${modalityCount.Mutable} planets

=== INTERPRETATION GUIDELINES ===
Provide a comprehensive interpretation covering the following sections with detailed analysis:

**1. CHART OVERVIEW & DOMINANT THEMES**
- Overall chart pattern and energy signature
- Dominant elements and modalities and what they mean for personality
- Any stelliums (3+ planets in same sign/house)
- Chart shape (bundle, bowl, bucket, splash, etc.) if applicable
- Key strengths and natural talents

**2. THE CORE IDENTITY: SUN, MOON & RISING**
- Sun in ${sun?.sign} in House ${sun?.house}: Core identity, life purpose, creative expression, vitality
- Moon in ${moon?.sign} in House ${moon?.house}: Emotional nature, needs, instincts, subconscious patterns, how you nurture and need nurturing
- Ascendant in ${risingSign}: Outer personality, first impressions, physical approach to life, life path
- Synthesis of the three: How these work together to form the complete personality

**3. COMMUNICATION & INTELLECT: MERCURY**
- Mercury in ${mercury?.sign} in House ${mercury?.house}: Communication style, learning patterns, mental processes, decision-making approach

**4. LOVE & VALUES: VENUS**
- Venus in ${venus?.sign} in House ${venus?.house}: Love language, aesthetic preferences, what you value, how you attract and relate, social graces, relationship needs

**5. ACTION & DESIRE: MARS**
- Mars in ${mars?.sign} in House ${mars?.house}: How you assert yourself, take action, express anger, pursue desires, sexual energy, competitive nature

**6. EXPANSION & WISDOM: JUPITER**
- Jupiter in ${jupiter?.sign} in House ${jupiter?.house}: Areas of growth and opportunity, philosophical outlook, where you find meaning, natural optimism, teaching abilities

**7. DISCIPLINE & LESSONS: SATURN**
- Saturn in ${saturn?.sign} in House ${saturn?.house}: Life lessons, areas requiring discipline, fears to overcome, where you build lasting structures, karmic patterns

**8. TRANSFORMATION & OUTER PLANETS**
- Uranus in ${uranus?.sign} in House ${uranus?.house}: Areas of innovation, rebellion, sudden change, where you're unique
- Neptune in ${neptune?.sign} in House ${neptune?.house}: Spiritual inclinations, dreams, illusions, creative imagination, areas of sensitivity
- Pluto in ${pluto?.sign} in House ${pluto?.house}: Deep transformation, power dynamics, psychological depth, regeneration

**9. ASPECT PATTERNS & DYNAMICS**
- Detailed analysis of the most significant aspects between planets
- How these aspects create internal tensions or harmonies
- Aspect patterns (T-squares, Grand Trines, Grand Crosses, Yods, etc.) if present
- How to work constructively with challenging aspects

**10. LIFE PATH & CAREER INDICATORS**
- Midheaven in ${mcSign}: Career path, public image, life direction, aspirations
- 10th house themes and planets
- 2nd and 6th house indicators for work and resources
- Natural vocational inclinations

**11. RELATIONSHIPS & PARTNERSHIPS**
- 7th house themes and what you seek in partnerships
- Venus-Mars dynamics
- How you connect with others romantically and platonically

**12. SOUL PURPOSE & SPIRITUAL PATH**
- Deeper life purpose indicators
- Spiritual gifts and challenges
- Areas for conscious evolution

**13. PRACTICAL GUIDANCE & INTEGRATION**
- Concrete ways to work with this chart's energy
- Shadow work areas
- Gifts to develop
- Life advice based on the chart patterns

Write each section with depth and nuance. Be specific about how energies manifest in daily life. Focus on psychological growth, self-awareness, and empowerment rather than predictions. Use professional astrological language while remaining accessible. Make it feel personal and insightful.`

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
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-11">
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
            Daily Horoscope
          </TabsTrigger>
          <TabsTrigger value="transits" disabled={!showTransits}>Current Transits</TabsTrigger>
          <TabsTrigger value="transit-aspects" disabled={!showTransits}>Transit Aspects</TabsTrigger>
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
                        <TableCell className="font-medium">
                          <span className="text-xl mr-2">{PLANET_SYMBOLS[planet.name]}</span>
                          {planet.name}
                        </TableCell>
                        <TableCell>
                          <span className="text-lg mr-2">{ZODIAC_SYMBOLS[planet.sign as ZodiacSign]}</span>
                          {planet.sign}
                        </TableCell>
                        <TableCell className="font-mono">{planet.degree.toFixed(2)}°</TableCell>
                        <TableCell>{planet.house}</TableCell>
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
                        <TableCell className="font-mono">{planet.longitude.toFixed(2)}°</TableCell>
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
                        <h3 className="text-lg font-semibold">{sign}</h3>
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
                        <TableCell className="font-medium">
                          <span className="text-xl mr-2">{PLANET_SYMBOLS[planet.name]}</span>
                          {planet.name}
                        </TableCell>
                        <TableCell>
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

        <TabsContent value="horoscope">
          <DailyHoroscope chart={chart} />
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
