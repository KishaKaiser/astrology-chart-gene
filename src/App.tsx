import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { ChartData } from '@/lib/astrology-types'
import { generateChartData } from '@/lib/astrology-calc'
import { ChartForm, ChartFormData } from '@/components/ChartForm'
import { ChartLibrary } from '@/components/ChartLibrary'
import { ChartView } from '@/components/ChartView'
import { DailyHoroscope } from '@/components/DailyHoroscope'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { CrystalBallLogo } from '@/components/CrystalBallLogo'
import { BookOpen, Sparkle } from '@phosphor-icons/react'

function App() {
  const [charts, setCharts] = useKV<ChartData[]>('astrology-charts', [])
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null)
  const [view, setView] = useState<'library' | 'chart'>('library')
  const [activeTab, setActiveTab] = useState<'charts' | 'horoscope'>('charts')

  const handleGenerateChart = async (formData: ChartFormData) => {
    try {
      toast.loading('Generating chart...', { id: 'chart-generation' })
      
      const newChart = await generateChartData(
        formData.name,
        formData.date,
        formData.time,
        formData.location,
        formData.latitude,
        formData.longitude,
        formData.timezone,
        formData.notes
      )

      toast.success('Chart generated successfully!', { id: 'chart-generation' })
      setCharts((currentCharts) => [...(currentCharts || []), newChart])
      setSelectedChart(newChart)
      setView('chart')
    } catch (error) {
      console.error('Error generating chart:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate chart. Please try again.'
      toast.error(errorMessage, { id: 'chart-generation' })
    }
  }

  const handleSelectChart = (chart: ChartData) => {
    setSelectedChart(chart)
    setView('chart')
  }

  const handleDeleteChart = (chartId: string) => {
    setCharts((currentCharts) => (currentCharts || []).filter(chart => chart.id !== chartId))
    if (selectedChart?.id === chartId) {
      setSelectedChart(null)
      setView('library')
    }
  }

  const handleUpdateChart = (chartId: string, interpretation: string) => {
    setCharts((currentCharts) =>
      (currentCharts || []).map(chart =>
        chart.id === chartId
          ? { ...chart, interpretation, updatedAt: Date.now() }
          : chart
      )
    )
    if (selectedChart?.id === chartId) {
      setSelectedChart({ ...selectedChart, interpretation, updatedAt: Date.now() })
    }
  }

  const handleBackToLibrary = () => {
    setView('library')
    setSelectedChart(null)
  }

  const handleEditChart = () => {
    
  }

  return (
    <div className="min-h-screen">
      <Toaster position="top-center" />
      
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="relative">
                <CrystalBallLogo className="w-12 h-12" />
              </div>
              <div className="flex flex-col gap-0.5">
                <h1 className="text-5xl font-semibold leading-none" style={{ fontFamily: 'Corinthia, cursive' }}>Psychic Link Charts</h1>
                <p className="text-sm text-muted-foreground leading-none" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>Professional Astrology Software</p>
              </div>
            </motion.div>
            
            {view === 'library' && activeTab === 'charts' && <ChartForm onSubmit={handleGenerateChart} />}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {view === 'library' ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'charts' | 'horoscope')} className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="charts" className="gap-2">
                <BookOpen weight="bold" />
                Chart Library
              </TabsTrigger>
              <TabsTrigger value="horoscope" className="gap-2">
                <Sparkle weight="fill" />
                Horoscope
              </TabsTrigger>
            </TabsList>

            <TabsContent value="charts">
              <ChartLibrary
                charts={charts || []}
                onSelectChart={handleSelectChart}
                onDeleteChart={handleDeleteChart}
              />
            </TabsContent>

            <TabsContent value="horoscope">
              {charts && charts.length > 0 ? (
                <DailyHoroscope chart={charts[0]} />
              ) : (
                <div className="text-center py-20">
                  <p className="text-muted-foreground mb-4">
                    You need to create a natal chart first to view horoscope forecasts.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Switch to the Chart Library tab and generate your first chart.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : selectedChart ? (
          <ChartView
            chart={selectedChart}
            onBack={handleBackToLibrary}
            onEdit={handleEditChart}
            onUpdateChart={handleUpdateChart}
          />
        ) : null}
      </main>

      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-6 py-8">
          <p className="text-center text-sm text-muted-foreground">
            Psychic Link Charts © {new Date().getFullYear()} | Professional Astrology Software
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App