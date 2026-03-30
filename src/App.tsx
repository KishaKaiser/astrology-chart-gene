import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { ChartData } from '@/lib/astrology-types'
import { generateChartData, resetSwissEphemeris } from '@/lib/astrology-calc'
import { ChartForm, ChartFormData } from '@/components/ChartForm'
import { ChartLibrary } from '@/components/ChartLibrary'
import { ChartView } from '@/components/ChartView'
import { DailyHoroscope } from '@/components/DailyHoroscope'
import { GeneralHoroscope } from '@/components/GeneralHoroscope'
import { LoversChart } from '@/components/LoversChart'
import { PastLifeChart } from '@/components/PastLifeChart'
import { KarmicRelationship } from '@/components/KarmicRelationship'
import { KarmicDebtCalculator } from '@/components/KarmicDebtCalculator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { CrystalBallLogo } from '@/components/CrystalBallLogo'
import { BookOpen, Sparkle, Star, ArrowsClockwise, Heart, ClockCounterClockwise, Infinity, Scales } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { DiagnosticTool } from '@/components/DiagnosticTool'
import { TroubleshootingWizard } from '@/components/TroubleshootingWizard'
import { TimezoneTestTool } from '@/components/TimezoneTestTool'

function App() {
  const [charts, setCharts] = useKV<ChartData[]>('astrology-charts', [])
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null)
  const [view, setView] = useState<'library' | 'chart'>('library')
  const [activeTab, setActiveTab] = useState<'charts' | 'personal-horoscope' | 'zodiac-horoscope' | 'lovers-chart' | 'karmic-relationship' | 'past-life' | 'karmic-debt'>('charts')
  const [ephemerisError, setEphemerisError] = useState(false)

  useEffect(() => {
    const preInitialize = async () => {
      try {
        console.log('Pre-initializing Swiss Ephemeris on app load...')
        await generateChartData(
          'Init Test',
          '2000-01-01',
          '12:00',
          'Greenwich',
          51.4769,
          -0.0005,
          '+00:00'
        )
        console.log('Swiss Ephemeris pre-initialization successful')
        setEphemerisError(false)
      } catch (error) {
        console.error('Swiss Ephemeris pre-initialization failed:', error)
        setEphemerisError(true)
      }
    }
    
    preInitialize().catch(err => {
      console.error('Fatal pre-initialization error:', err)
      setEphemerisError(true)
    })
  }, [])

  const handleGenerateChart = async (formData: ChartFormData) => {
    try {
      console.log('=== CHART GENERATION STARTED ===')
      console.log('Input data:', {
        name: formData.name,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        timezone: formData.timezone
      })
      
      toast.loading('Initializing astrology engine...', { id: 'chart-generation' })
      
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

      console.log('=== CHART GENERATION SUCCESSFUL ===')
      toast.success('Chart generated successfully!', { id: 'chart-generation' })
      setCharts((currentCharts) => [...(currentCharts || []), newChart])
      setSelectedChart(newChart)
      setView('chart')
      setEphemerisError(false)
    } catch (error) {
      console.error('=== CHART GENERATION FAILED ===')
      console.error('Error object:', error)
      console.error('Error type:', error?.constructor?.name)
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      
      let errorMessage = 'Failed to generate chart.'
      let errorDetails = ''
      let isEphemerisError = false
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        if (error.message.includes('Swiss Ephemeris') || error.message.includes('astrology engine') || error.message.includes('initialization')) {
          isEphemerisError = true
          setEphemerisError(true)
          errorDetails = '\n\nThe astrology calculation library failed to initialize. Click the "Reset Engine" button in the header to try reinitializing, or refresh the page.'
        } else if (error.message.includes('date') || error.message.includes('time')) {
          errorDetails = '\n\nPlease check that the date and time are valid and in the correct format.'
        } else if (error.message.includes('location') || error.message.includes('coordinates')) {
          errorDetails = '\n\nPlease verify the location coordinates are correct. Latitude should be between -90 and 90, longitude between -180 and 180.'
        } else if (error.message.includes('Julian')) {
          errorDetails = '\n\nThe date/time could not be converted for astronomical calculations. Ensure the date is not too far in the past or future.'
        } else if (error.message.includes('houses')) {
          errorDetails = '\n\nThe house system calculation failed. This may be due to extreme latitude values (near poles).'
        }
      }
      
      const fullMessage = errorMessage + errorDetails
      
      toast.error(fullMessage, { 
        id: 'chart-generation',
        duration: isEphemerisError ? 15000 : 10000,
        description: 'Check the browser console (F12) for detailed technical information.'
      })
    }
  }

  const handleResetEngine = () => {
    console.log('User requested engine reset')
    resetSwissEphemeris()
    setEphemerisError(false)
    toast.success('Astrology engine reset successfully. Try generating a chart again.')
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
                <h1 className="text-5xl font-bold leading-none text-white font-display">Psychic Link Charts</h1>
                <p className="text-sm text-muted-foreground leading-none">Professional Astrology Software</p>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-3">
              <TimezoneTestTool />
              <TroubleshootingWizard />
              <DiagnosticTool />
              {ephemerisError && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetEngine}
                  className="border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <ArrowsClockwise className="mr-2" weight="bold" />
                  Reset Engine
                </Button>
              )}
              {view === 'library' && activeTab === 'charts' && <ChartForm onSubmit={handleGenerateChart} />}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {view === 'library' ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'charts' | 'personal-horoscope' | 'zodiac-horoscope' | 'lovers-chart' | 'karmic-relationship' | 'past-life' | 'karmic-debt')} className="space-y-6">
            <TabsList className="grid w-full max-w-7xl mx-auto grid-cols-7">
              <TabsTrigger value="charts" className="gap-2 text-white">
                <BookOpen weight="bold" />
                Chart Library
              </TabsTrigger>
              <TabsTrigger value="personal-horoscope" className="gap-2">
                <Sparkle weight="fill" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="zodiac-horoscope" className="gap-2">
                <Star weight="fill" />
                Zodiac
              </TabsTrigger>
              <TabsTrigger value="lovers-chart" className="gap-2">
                <Heart weight="fill" />
                Compatibility
              </TabsTrigger>
              <TabsTrigger value="karmic-relationship" className="gap-2">
                <Infinity weight="fill" />
                Karmic Bond
              </TabsTrigger>
              <TabsTrigger value="past-life" className="gap-2">
                <ClockCounterClockwise weight="fill" />
                Past Life
              </TabsTrigger>
              <TabsTrigger value="karmic-debt" className="gap-2">
                <Scales weight="fill" />
                Karmic Debt
              </TabsTrigger>
            </TabsList>

            <TabsContent value="charts">
              <ChartLibrary
                charts={charts || []}
                onSelectChart={handleSelectChart}
                onDeleteChart={handleDeleteChart}
              />
            </TabsContent>

            <TabsContent value="personal-horoscope">
              {charts && charts.length > 0 ? (
                <DailyHoroscope chart={charts[0]} />
              ) : (
                <div className="text-center py-20">
                  <p className="text-muted-foreground mb-4">
                    You need to create a natal chart first to view personalized horoscope forecasts.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Switch to the Chart Library tab and generate your first chart.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="zodiac-horoscope">
              <GeneralHoroscope />
            </TabsContent>

            <TabsContent value="lovers-chart">
              <LoversChart />
            </TabsContent>

            <TabsContent value="karmic-relationship">
              <KarmicRelationship />
            </TabsContent>

            <TabsContent value="past-life">
              <PastLifeChart />
            </TabsContent>

            <TabsContent value="karmic-debt">
              {charts && charts.length > 0 ? (
                <KarmicDebtCalculator charts={charts} />
              ) : (
                <div className="text-center py-20">
                  <p className="text-muted-foreground mb-4">
                    You need to create a natal chart first to calculate karmic debts.
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