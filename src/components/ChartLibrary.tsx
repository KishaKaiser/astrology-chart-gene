import { useState } from 'react'
import { ChartData } from '@/lib/astrology-types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MagnifyingGlass, Trash } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface ChartLibraryProps {
  charts: ChartData[]
  onSelectChart: (chart: ChartData) => void
  onDeleteChart: (chartId: string) => void
}

export function ChartLibrary({ charts, onSelectChart, onDeleteChart }: ChartLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCharts = charts.filter(chart =>
    chart.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chart.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Chart Library</h2>
        <p className="text-muted-foreground">
          {charts.length} {charts.length === 1 ? 'chart' : 'charts'} saved
        </p>
      </div>

      <div className="relative">
        <MagnifyingGlass
          size={20}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search charts by name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredCharts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              {searchQuery ? 'No charts match your search' : 'No charts saved yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCharts.map((chart, index) => (
            <motion.div
              key={chart.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                className="cursor-pointer transition-all hover:border-accent hover:shadow-lg group relative"
                onClick={() => onSelectChart(chart)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete chart "${chart.name}"?`)) {
                      onDeleteChart(chart.id)
                    }
                  }}
                >
                  <Trash size={18} className="text-destructive" />
                </Button>
                
                <CardHeader>
                  <CardTitle className="text-xl">{chart.name}</CardTitle>
                  <CardDescription>{chart.location}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Birth Date:</span>
                    <span className="font-mono">{chart.date}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Birth Time:</span>
                    <span className="font-mono">{chart.time}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="secondary">{chart.houseSystem}</Badge>
                    <Badge variant="outline">{chart.planets.length} Planets</Badge>
                    <Badge variant="outline">{chart.aspects.length} Aspects</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
