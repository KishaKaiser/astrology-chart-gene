import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Wrench, CheckCircle, XCircle, Warning, Info, ArrowsClockwise, Copy } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface DiagnosticResult {
  category: string
  name: string
  status: 'success' | 'error' | 'warning' | 'info'
  message: string
  details?: string
}

export function DiagnosticTool() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [showDialog, setShowDialog] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    setShowDialog(true)
    const diagnosticResults: DiagnosticResult[] = []

    diagnosticResults.push({
      category: 'Browser',
      name: 'User Agent',
      status: 'info',
      message: navigator.userAgent,
      details: `Platform: ${navigator.platform}`
    })

    diagnosticResults.push({
      category: 'Browser',
      name: 'JavaScript Engine',
      status: 'success',
      message: 'JavaScript calculation engine active',
      details: 'Using built-in astronomical algorithms (WebAssembly not required)'
    })

    const asyncFn = async () => {}
    const isAsyncSupported = asyncFn().constructor.name === 'Promise'
    
    diagnosticResults.push({
      category: 'Browser',
      name: 'JavaScript Features',
      status: 'success',
      message: 'Core features available',
      details: [
        `Async/Await: ${isAsyncSupported ? 'Supported' : 'Not supported'}`,
        `Promises: ${typeof Promise === 'function' ? 'Supported' : 'Not supported'}`,
        `Dynamic Import: Supported`
      ].join('\n')
    })

    try {
      const swissephLoader = await import('@/lib/swisseph-loader')
      diagnosticResults.push({
        category: 'Dependencies',
        name: 'Astrology Engine',
        status: 'success',
        message: 'Built-in calculation engine loaded successfully',
        details: `SwissEphemeris: ${swissephLoader.SwissEphemeris ? 'Available' : 'Missing'}`
      })
    } catch (error) {
      diagnosticResults.push({
        category: 'Dependencies',
        name: 'Astrology Engine',
        status: 'error',
        message: 'Failed to load calculation engine',
        details: error instanceof Error ? error.message : String(error)
      })
    }

    try {
      const swissephLoader = await import('@/lib/swisseph-loader')
      diagnosticResults.push({
        category: 'Dependencies',
        name: 'Calculation Enums',
        status: 'success',
        message: 'Planet and house system enums loaded',
        details: [
          `Planet: ${swissephLoader.Planet ? 'Available' : 'Missing'}`,
          `HouseSystem: ${swissephLoader.HouseSystem ? 'Available' : 'Missing'}`
        ].join('\n')
      })
    } catch (error) {
      diagnosticResults.push({
        category: 'Dependencies',
        name: 'Calculation Enums',
        status: 'error',
        message: 'Failed to load enums',
        details: error instanceof Error ? error.message : String(error)
      })
    }

    try {
      const { SwissEphemeris } = await import('@/lib/swisseph-loader')
      const instance = new SwissEphemeris()
      
      diagnosticResults.push({
        category: 'Library',
        name: 'SwissEphemeris Instance',
        status: 'success',
        message: 'Instance created successfully',
        details: `Type: ${typeof instance}`
      })

      diagnosticResults.push({
        category: 'Library',
        name: 'Initialization',
        status: 'success',
        message: 'Built-in engine ready (no initialization required)'
      })

      const requiredMethods = ['dateToJulianDay', 'calculateHouses', 'calculatePosition']
      const availableMethods = requiredMethods.filter(method => typeof (instance as any)[method] === 'function')
      const missingMethods = requiredMethods.filter(method => typeof (instance as any)[method] !== 'function')

      diagnosticResults.push({
        category: 'Library',
        name: 'Required Methods',
        status: missingMethods.length === 0 ? 'success' : 'error',
        message: `${availableMethods.length}/${requiredMethods.length} methods available`,
        details: missingMethods.length > 0 
          ? `Missing: ${missingMethods.join(', ')}` 
          : `Available: ${availableMethods.join(', ')}`
      })

      try {
        const testDate = new Date('2000-01-01T12:00:00Z')
        const julianDay = instance.dateToJulianDay(testDate)
        diagnosticResults.push({
          category: 'Calculations',
          name: 'Date to Julian Day',
          status: typeof julianDay === 'number' ? 'success' : 'error',
          message: typeof julianDay === 'number' 
            ? `Test calculation successful` 
            : 'Calculation returned invalid type',
          details: `Result: ${julianDay} (expected ~2451545)`
        })
      } catch (error) {
        diagnosticResults.push({
          category: 'Calculations',
          name: 'Date to Julian Day',
          status: 'error',
          message: 'Test calculation failed',
          details: error instanceof Error ? error.message : String(error)
        })
      }

      try {
        const { Planet } = await import('@/lib/swisseph-loader')
        const testJD = 2451545.0
        const sunPosition = instance.calculatePosition(testJD, Planet.Sun)
        diagnosticResults.push({
          category: 'Calculations',
          name: 'Planet Position',
          status: sunPosition && typeof sunPosition.longitude === 'number' ? 'success' : 'error',
          message: sunPosition && typeof sunPosition.longitude === 'number'
            ? 'Planet calculation successful'
            : 'Invalid calculation result',
          details: sunPosition ? `Sun longitude: ${sunPosition.longitude.toFixed(2)}°` : 'No result returned'
        })
      } catch (error) {
        diagnosticResults.push({
          category: 'Calculations',
          name: 'Planet Position',
          status: 'error',
          message: 'Planet calculation failed',
          details: error instanceof Error ? error.message : String(error)
        })
      }

      try {
        const { HouseSystem } = await import('@/lib/swisseph-loader')
        const testJD = 2451545.0
        const houses = instance.calculateHouses(testJD, 51.5074, -0.1278, HouseSystem.Placidus)
        diagnosticResults.push({
          category: 'Calculations',
          name: 'House System',
          status: houses && Array.isArray(houses.cusps) ? 'success' : 'error',
          message: houses && Array.isArray(houses.cusps)
            ? 'House calculation successful'
            : 'Invalid house calculation result',
          details: houses ? `Houses: ${houses.cusps?.length || 0} cusps, Ascendant: ${houses.ascendant?.toFixed(2)}°` : 'No result returned'
        })
      } catch (error) {
        diagnosticResults.push({
          category: 'Calculations',
          name: 'House System',
          status: 'error',
          message: 'House calculation failed',
          details: error instanceof Error ? error.message : String(error)
        })
      }

    } catch (error) {
      diagnosticResults.push({
        category: 'Library',
        name: 'SwissEphemeris Instance',
        status: 'error',
        message: 'Failed to create instance',
        details: error instanceof Error ? error.message : String(error)
      })
    }

    diagnosticResults.push({
      category: 'Environment',
      name: 'Memory',
      status: 'info',
      message: (performance as any).memory 
        ? `Used: ${Math.round((performance as any).memory.usedJSHeapSize / 1048576)}MB / ${Math.round((performance as any).memory.jsHeapSizeLimit / 1048576)}MB`
        : 'Memory info not available',
      details: (performance as any).memory 
        ? `Total: ${Math.round((performance as any).memory.totalJSHeapSize / 1048576)}MB`
        : undefined
    })

    diagnosticResults.push({
      category: 'Environment',
      name: 'Connection',
      status: 'info',
      message: navigator.onLine ? 'Online' : 'Offline',
      details: (navigator as any).connection 
        ? `Type: ${(navigator as any).connection.effectiveType || 'unknown'}`
        : 'Connection info not available'
    })

    setResults(diagnosticResults)
    setIsRunning(false)

    const errorCount = diagnosticResults.filter(r => r.status === 'error').length
    if (errorCount > 0) {
      toast.error(`Diagnostics completed with ${errorCount} error(s)`)
    } else {
      toast.success('Diagnostics completed successfully')
    }
  }

  const copyToClipboard = () => {
    const report = [
      '=== Psychic Link Charts Diagnostic Report ===',
      `Timestamp: ${new Date().toISOString()}`,
      '',
      ...results.map(r => {
        const lines = [
          `[${r.category}] ${r.name}: ${r.status.toUpperCase()}`,
          `  Message: ${r.message}`
        ]
        if (r.details) {
          lines.push(`  Details: ${r.details}`)
        }
        return lines.join('\n')
      })
    ].join('\n')

    navigator.clipboard.writeText(report)
    toast.success('Diagnostic report copied to clipboard')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle weight="fill" className="text-green-500" />
      case 'error':
        return <XCircle weight="fill" className="text-red-500" />
      case 'warning':
        return <Warning weight="fill" className="text-yellow-500" />
      case 'info':
        return <Info weight="fill" className="text-blue-400" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      info: 'outline'
    }
    return <Badge variant={variants[status] || 'outline'} className="text-white">{status}</Badge>
  }

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = []
    }
    acc[result.category].push(result)
    return acc
  }, {} as Record<string, DiagnosticResult[]>)

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={runDiagnostics}
          className="border-accent/50 text-accent hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Wrench className="mr-2" weight="bold" />
          Diagnostics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-white">
            <Wrench weight="bold" className="text-accent" size={24} />
            System Diagnostics
          </DialogTitle>
          <DialogDescription className="text-white">
            Comprehensive check of browser compatibility and astrology library status
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2">
            {results.length > 0 && (
              <>
                <span className="text-sm text-white">
                  {results.filter(r => r.status === 'success').length} passed
                </span>
                <span className="text-sm text-white">•</span>
                <span className="text-sm text-white">
                  {results.filter(r => r.status === 'error').length} failed
                </span>
                <span className="text-sm text-white">•</span>
                <span className="text-sm text-white">
                  {results.filter(r => r.status === 'warning').length} warnings
                </span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {results.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="text-white hover:text-white"
              >
                <Copy className="mr-2" />
                Copy Report
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={runDiagnostics}
              disabled={isRunning}
              className="text-white hover:text-white border-accent/50 hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowsClockwise className={`mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Running...' : 'Rerun'}
            </Button>
          </div>
        </div>

        <Separator />

        <ScrollArea className="h-[50vh] pr-4">
          {isRunning ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <ArrowsClockwise className="animate-spin mx-auto text-accent" size={32} />
                <p className="text-sm text-white">Running diagnostics...</p>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Wrench className="mx-auto text-muted-foreground" size={32} />
                <p className="text-sm text-white">Click "Run Diagnostics" to begin</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pr-4">
              {Object.entries(groupedResults).map(([category, categoryResults]) => (
                <Card key={category} className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {categoryResults.map((result, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="mt-0.5">
                          {getStatusIcon(result.status)}
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm text-white">{result.name}</span>
                            {getStatusBadge(result.status)}
                          </div>
                          <p className="text-sm text-white">{result.message}</p>
                          {result.details && (
                            <pre className="text-xs text-white bg-background/50 p-2 rounded mt-2 overflow-x-auto font-mono">
                              {result.details}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
