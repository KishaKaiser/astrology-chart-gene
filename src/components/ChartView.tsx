import { useRef } from 'react'
import { ChartData, PLANET_SYMBOLS, ASPECT_TYPES } from '@/lib/astrology-types'
import { ChartWheel } from './ChartWheel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DownloadSimple, Printer, PencilSimple, ArrowLeft } from '@phosphor-icons/react'
import { exportChartToPDF } from '@/lib/pdf-export'

interface ChartViewProps {
  chart: ChartData
  onBack: () => void
  onEdit: () => void
}

export function ChartView({ chart, onBack, onEdit }: ChartViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  const handleExport = async () => {
    const svg = document.querySelector('svg')
    await exportChartToPDF(chart, svg)
  }

  const handlePrint = () => {
    window.print()
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
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Natal Chart Wheel</CardTitle>
            <CardDescription>
              House System: {chart.houseSystem} | ASC: {chart.ascendant.toFixed(2)}° | MC: {chart.midheaven.toFixed(2)}°
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartWheel chart={chart} />
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="planets">Planetary Positions</TabsTrigger>
          <TabsTrigger value="houses">House Cusps</TabsTrigger>
          <TabsTrigger value="aspects">Major Aspects</TabsTrigger>
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
      </Tabs>
    </div>
  )
}
