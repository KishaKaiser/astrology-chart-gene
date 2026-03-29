import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { ChartData } from '@/lib/astrology-types'
import { generateChartData } from '@/lib/astrology-calc'
import { ChartForm, ChartFormData } from '@/components/ChartForm'
import { ChartLibrary } from '@/components/ChartLibrary'
import { ChartView } from '@/components/ChartView'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { CrystalBallLogo } from '@/components/CrystalBallLogo'

function App() {
  const [charts, setCharts] = useKV<ChartData[]>('astrology-charts', [])
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null)
  const [view, setView] = useState<'library' | 'chart'>('library')

  const handleGenerateChart = async (formData: ChartFormData) => {
    try {
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

      setCharts((currentCharts) => [...(currentCharts || []), newChart])
      setSelectedChart(newChart)
      setView('chart')
    } catch (error) {
      console.error('Error generating chart:', error)
      toast.error('Failed to generate chart. Please try again.')
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
            
            {view === 'library' && <ChartForm onSubmit={handleGenerateChart} />}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {view === 'library' ? (
          <ChartLibrary
            charts={charts || []}
            onSelectChart={handleSelectChart}
            onDeleteChart={handleDeleteChart}
          />
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