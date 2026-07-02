import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ChartData } from '@/lib/astrology-types'
import { calculateKarmicDebt, KarmicDebtResult, NumerologyDebt, AstrologicalDebt, ResolutionPath } from '@/lib/karmic-debt-calc'
import { motion, AnimatePresence } from 'framer-motion'
import { Scales, ArrowCounterClockwise, Sparkle, Warning, CheckCircle, Calculator } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface KarmicDebtCalculatorProps {
  charts: ChartData[]
}

export function KarmicDebtCalculator({ charts }: KarmicDebtCalculatorProps) {
  const [selectedChartId, setSelectedChartId] = useState<string>('')
  const [birthName, setBirthName] = useState('')
  const [result, setResult] = useState<KarmicDebtResult | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [savedResults, setSavedResults] = useKV<KarmicDebtResult[]>('karmic-debt-results', [])

  const handleCalculate = async () => {
    if (!selectedChartId || !birthName.trim()) {
      toast.error('Please select a chart and enter your full birth name')
      return
    }

    const selectedChart = charts.find(c => c.id === selectedChartId)
    if (!selectedChart) {
      toast.error('Chart not found')
      return
    }

    setCalculating(true)
    try {
      const debtResult = await calculateKarmicDebt(selectedChart, birthName.trim())
      setResult(debtResult)
      
      setSavedResults(current => {
        const filtered = (current || []).filter(r => r.chartId !== selectedChartId)
        return [...filtered, debtResult]
      })

      toast.success('Karmic debt analysis complete!')
    } catch (error) {
      console.error('Karmic debt calculation error:', error)
      toast.error('Failed to calculate karmic debt')
    } finally {
      setCalculating(false)
    }
  }

  const handleLoadSaved = (savedResult: KarmicDebtResult) => {
    setResult(savedResult)
    setSelectedChartId(savedResult.chartId)
    const chart = charts.find(c => c.id === savedResult.chartId)
    if (chart) {
      setBirthName(savedResult.birthName)
    }
  }

  const getSeverityColor = (severity: 'low' | 'medium' | 'high' | 'critical') => {
    switch (severity) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-orange-400'
      case 'critical': return 'text-red-400'
    }
  }

  const getSeverityBadgeVariant = (severity: 'low' | 'medium' | 'high' | 'critical') => {
    switch (severity) {
      case 'low': return 'outline'
      case 'medium': return 'secondary'
      case 'high': return 'default'
      case 'critical': return 'destructive'
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-accent/30 bg-card/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/20">
                <Scales className="w-8 h-8 text-accent" weight="duotone" />
              </div>
              <div>
                <CardTitle className="text-3xl text-white">Karmic Debt Calculator</CardTitle>
                <CardDescription className="text-base">
                  Discover areas of your soul requiring resolution and growth
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chart-select" className="text-white">Select Birth Chart</Label>
                <select
                  id="chart-select"
                  value={selectedChartId}
                  onChange={(e) => setSelectedChartId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-input border border-input text-white"
                >
                  <option value="">Choose a chart...</option>
                  {charts.map(chart => (
                    <option key={chart.id} value={chart.id}>
                      {chart.name} - {chart.date}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth-name" className="text-white">Full Birth Name</Label>
                <Input
                  id="birth-name"
                  value={birthName}
                  onChange={(e) => setBirthName(e.target.value)}
                  placeholder="Enter your full name as on birth certificate"
                  className="text-white"
                />
              </div>
            </div>

            <Button
              onClick={handleCalculate}
              disabled={calculating || !selectedChartId || !birthName.trim()}
              className="w-full"
              size="lg"
            >
              {calculating ? (
                <>
                  <ArrowCounterClockwise className="mr-2 animate-spin" weight="bold" />
                  Calculating Karmic Debts...
                </>
              ) : (
                <>
                  <Calculator className="mr-2" weight="bold" />
                  Calculate Karmic Debt
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <Card className="border-accent/30 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <Sparkle className="text-accent" weight="fill" />
                  Overall Karmic Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Total Karmic Debt Score</span>
                    <span className="text-2xl font-bold text-accent">{result.totalDebtScore}</span>
                  </div>
                  <Progress value={result.totalDebtScore} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {result.totalDebtScore < 30 && 'Light karmic load - your soul is relatively balanced'}
                    {result.totalDebtScore >= 30 && result.totalDebtScore < 60 && 'Moderate karmic work ahead - focus on key lessons'}
                    {result.totalDebtScore >= 60 && result.totalDebtScore < 80 && 'Significant karmic debts - important soul work to complete'}
                    {result.totalDebtScore >= 80 && 'Heavy karmic burden - this lifetime offers major transformation opportunities'}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-primary/20 border-primary/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-white">Numerology Debt</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{result.numerologyDebts.length}</div>
                      <p className="text-xs text-muted-foreground">Numbers identified</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary/20 border-primary/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-white">Astrological Debt</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{result.astrologicalDebts.length}</div>
                      <p className="text-xs text-muted-foreground">Indicators found</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary/20 border-primary/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-white">Soul Lessons</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{result.resolutionPaths.length}</div>
                      <p className="text-xs text-muted-foreground">Paths to healing</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="numerology" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="numerology">Numerology Debts</TabsTrigger>
                <TabsTrigger value="astrological">Astrological Indicators</TabsTrigger>
                <TabsTrigger value="resolution">Resolution Paths</TabsTrigger>
              </TabsList>

              <TabsContent value="numerology" className="space-y-4">
                {result.numerologyDebts.length === 0 ? (
                  <Card className="bg-card/50">
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" weight="duotone" />
                      <p className="text-white text-lg">No karmic debt numbers detected</p>
                      <p className="text-muted-foreground text-sm mt-2">
                        Your numerology chart shows balanced energies
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  result.numerologyDebts.map((debt, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="bg-card/50 border-accent/20">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-white flex items-center gap-2">
                                {debt.debtNumber}
                                <Badge variant={getSeverityBadgeVariant(debt.severity)}>
                                  {debt.severity}
                                </Badge>
                              </CardTitle>
                              <CardDescription className="mt-1">{debt.area}</CardDescription>
                            </div>
                            <div className={`text-4xl font-mono ${getSeverityColor(debt.severity)}`}>
                              {debt.debtNumber.split(' ')[0]}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-2">Description</h4>
                            <p className="text-muted-foreground text-sm">{debt.description}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-2">Past Life Pattern</h4>
                            <p className="text-muted-foreground text-sm">{debt.pastLifePattern}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-2">Resolution</h4>
                            <p className="text-muted-foreground text-sm">{debt.resolution}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="astrological" className="space-y-4">
                {result.astrologicalDebts.map((debt: AstrologicalDebt, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="bg-card/50 border-accent/20">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-white">{debt.indicator}</CardTitle>
                            <CardDescription className="mt-1">{debt.placement}</CardDescription>
                          </div>
                          <Badge variant={getSeverityBadgeVariant(debt.severity)}>
                            {debt.severity}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-2">Karmic Meaning</h4>
                          <p className="text-muted-foreground text-sm">{debt.karmicMeaning}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-2">Life Challenge</h4>
                          <p className="text-muted-foreground text-sm">{debt.lifeChallenge}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-2">Path to Balance</h4>
                          <p className="text-muted-foreground text-sm">{debt.pathToBalance}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="resolution" className="space-y-4">
                {result.resolutionPaths.map((path: ResolutionPath, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Sparkle className="text-accent" weight="fill" />
                          {path.area}
                        </CardTitle>
                        <CardDescription>{path.priority} Priority</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Alert className="bg-primary/20 border-primary/30">
                          <Warning className="text-accent" weight="fill" />
                          <AlertDescription className="text-white ml-2">
                            {path.challenge}
                          </AlertDescription>
                        </Alert>
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-2">Healing Actions</h4>
                          <ul className="space-y-2">
                            {path.actions.map((action: string, actionIdx: number) => (
                              <li key={actionIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" weight="fill" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-2">Expected Outcome</h4>
                          <p className="text-muted-foreground text-sm">{path.outcome}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {result.aiGuidance && (
                  <Card className="bg-gradient-to-br from-accent/20 to-primary/20 border-accent/40">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Sparkle className="text-accent animate-pulse" weight="fill" />
                        AI Spiritual Guidance
                      </CardTitle>
                      <CardDescription>Personalized insights for your karmic journey</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white leading-relaxed whitespace-pre-line">{result.aiGuidance}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      {!result && savedResults && savedResults.length > 0 && (
        <Card className="border-accent/30 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Previous Calculations</CardTitle>
            <CardDescription>Load your saved karmic debt analyses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {savedResults.map((saved, idx) => {
                const chart = charts.find(c => c.id === saved.chartId)
                return (
                  <Button
                    key={idx}
                    variant="outline"
                    className="justify-between h-auto py-3"
                    onClick={() => handleLoadSaved(saved)}
                  >
                    <div className="text-left">
                      <div className="font-medium text-white">{saved.birthName}</div>
                      <div className="text-xs text-muted-foreground">
                        {chart?.name} - Score: {saved.totalDebtScore}
                      </div>
                    </div>
                    <ArrowCounterClockwise className="text-accent" weight="bold" />
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
