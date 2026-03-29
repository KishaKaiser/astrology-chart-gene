import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { ChartData } from '@/lib/astrology-types'
import { generateChartData } from '@/lib/astrology-calc'
import { ChartForm, ChartFormData } from '@/components/ChartForm'
import { ChartLibrary } from '@/components/ChartLibrary'
import { ChartView } from '@/components/ChartView'
import { Toaster } from '@/components/ui/sonner'
import { motion } from 'framer-motion'
import psychicLogo from './assets/images/psychic-logo.png'

function App() {
  const [charts, setCharts] = useKV<ChartData[]>('astrology-charts', [])
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null)
  const [view, setView] = useState<'library' | 'chart'>('library')

  const handleGenerateChart = (formData: ChartFormData) => {
    const newChart = generateChartData(
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
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <img src={psychicLogo} alt="Psychic Link Charts Logo" className="w-10 h-10 rounded-full object-cover star-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold">Psychic Link Charts</h1>
                <p className="text-sm text-muted-foreground">Professional Astrology Software</p>
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