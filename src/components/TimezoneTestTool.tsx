import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Flask, CheckCircle, XCircle, Clock } from '@phosphor-icons/react'
import { generateChartData } from '@/lib/astrology-calc'
import { toast } from 'sonner'

interface TestLocation {
  name: string
  date: string
  time: string
  location: string
  latitude: number
  longitude: number
  timezone: string
  description: string
}

const TEST_LOCATIONS: TestLocation[] = [
  {
    name: 'New York',
    date: '1990-06-15',
    time: '14:30',
    location: 'New York, NY, USA',
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: 'America/New_York',
    description: 'Eastern Time (UTC-5/-4)'
  },
  {
    name: 'Los Angeles',
    date: '1985-12-25',
    time: '08:00',
    location: 'Los Angeles, CA, USA',
    latitude: 34.0522,
    longitude: -118.2437,
    timezone: 'America/Los_Angeles',
    description: 'Pacific Time (UTC-8/-7)'
  },
  {
    name: 'London',
    date: '1992-03-10',
    time: '19:45',
    location: 'London, UK',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London',
    description: 'GMT/BST (UTC+0/+1)'
  },
  {
    name: 'Tokyo',
    date: '1988-08-08',
    time: '23:30',
    location: 'Tokyo, Japan',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo',
    description: 'Japan Standard Time (UTC+9)'
  },
  {
    name: 'Sydney',
    date: '1995-01-20',
    time: '06:15',
    location: 'Sydney, Australia',
    latitude: -33.8688,
    longitude: 151.2093,
    timezone: 'Australia/Sydney',
    description: 'Australian Eastern Time (UTC+10/+11)'
  },
  {
    name: 'Dubai',
    date: '1987-11-05',
    time: '12:00',
    location: 'Dubai, UAE',
    latitude: 25.2048,
    longitude: 55.2708,
    timezone: 'Asia/Dubai',
    description: 'Gulf Standard Time (UTC+4)'
  },
  {
    name: 'São Paulo',
    date: '1991-04-17',
    time: '16:20',
    location: 'São Paulo, Brazil',
    latitude: -23.5505,
    longitude: -46.6333,
    timezone: 'America/Sao_Paulo',
    description: 'Brasília Time (UTC-3)'
  },
  {
    name: 'Mumbai',
    date: '1993-07-22',
    time: '10:45',
    location: 'Mumbai, India',
    latitude: 19.0760,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
    description: 'Indian Standard Time (UTC+5:30)'
  },
  {
    name: 'Reykjavik',
    date: '1989-02-14',
    time: '04:00',
    location: 'Reykjavik, Iceland',
    latitude: 64.1466,
    longitude: -21.9426,
    timezone: 'Atlantic/Reykjavik',
    description: 'GMT (UTC+0)'
  },
  {
    name: 'Chicago',
    date: '1977-09-01',
    time: '17:00',
    location: 'Chicago, IL, USA',
    latitude: 41.8781,
    longitude: -87.6298,
    timezone: 'America/Chicago',
    description: 'Central Time (UTC-6/-5)'
  }
]

interface TestResult {
  location: TestLocation
  success: boolean
  error?: string
  sunSign?: string
  moonSign?: string
  ascendant?: string
  duration?: number
}

export function TimezoneTestTool() {
  const [isOpen, setIsOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [currentTest, setCurrentTest] = useState<string>('')

  const runTests = async () => {
    setIsRunning(true)
    setResults([])
    setCurrentTest('')

    const testResults: TestResult[] = []

    for (const location of TEST_LOCATIONS) {
      setCurrentTest(location.name)
      
      const startTime = Date.now()
      
      try {
        console.log(`Testing: ${location.name}`)
        console.log(`Date: ${location.date}, Time: ${location.time}`)
        console.log(`Timezone: ${location.timezone}`)
        
        const chart = await generateChartData(
          `Test - ${location.name}`,
          location.date,
          location.time,
          location.location,
          location.latitude,
          location.longitude,
          location.timezone,
          `Timezone test for ${location.description}`
        )

        const duration = Date.now() - startTime

        testResults.push({
          location,
          success: true,
          sunSign: chart.planets.find(p => p.name === 'Sun')?.sign,
          moonSign: chart.planets.find(p => p.name === 'Moon')?.sign,
          ascendant: chart.houses[0]?.sign,
          duration
        })

        console.log(`✓ ${location.name} - Success`)
      } catch (error) {
        const duration = Date.now() - startTime
        
        testResults.push({
          location,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration
        })

        console.error(`✗ ${location.name} - Failed:`, error)
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setResults(testResults)
    setCurrentTest('')
    setIsRunning(false)

    const successCount = testResults.filter(r => r.success).length
    const totalCount = testResults.length

    if (successCount === totalCount) {
      toast.success(`All ${totalCount} timezone tests passed!`)
    } else {
      toast.error(`${totalCount - successCount} of ${totalCount} tests failed`)
    }
  }

  const successCount = results.filter(r => r.success).length
  const failureCount = results.filter(r => !r.success).length

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-accent/50 text-accent hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Flask className="mr-2" weight="bold" />
          Timezone Tests
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-white flex items-center gap-3">
            <Flask weight="bold" className="text-accent" size={28} />
            Timezone Conversion Tests
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Test chart generation across different timezones and locations to verify accurate calculations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              {results.length > 0 && (
                <>
                  <Badge variant="outline" className="text-green-400 border-green-400/50">
                    <CheckCircle className="mr-1" size={16} weight="fill" />
                    {successCount} Passed
                  </Badge>
                  <Badge variant="outline" className="text-red-400 border-red-400/50">
                    <XCircle className="mr-1" size={16} weight="fill" />
                    {failureCount} Failed
                  </Badge>
                </>
              )}
            </div>
            <Button
              onClick={runTests}
              disabled={isRunning}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isRunning ? (
                <>
                  <Clock className="mr-2 animate-spin" weight="bold" />
                  Testing {currentTest}...
                </>
              ) : (
                'Run All Tests'
              )}
            </Button>
          </div>

          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {results.length === 0 && !isRunning && (
                <Card className="bg-muted/30 border-border">
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      Click "Run All Tests" to test chart generation across {TEST_LOCATIONS.length} different locations and timezones
                    </p>
                  </CardContent>
                </Card>
              )}

              {results.map((result, index) => (
                <Card
                  key={index}
                  className={`transition-all ${
                    result.success
                      ? 'bg-green-950/20 border-green-500/30'
                      : 'bg-red-950/20 border-red-500/30'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle weight="fill" className="text-green-400" size={20} />
                          ) : (
                            <XCircle weight="fill" className="text-red-400" size={20} />
                          )}
                          {result.location.name}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground mt-1">
                          {result.location.description}
                        </CardDescription>
                      </div>
                      {result.duration && (
                        <Badge variant="secondary" className="text-xs">
                          {result.duration}ms
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Location:</span>
                        <span className="ml-2 text-white">{result.location.location}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Timezone:</span>
                        <span className="ml-2 text-white font-mono text-xs">{result.location.timezone}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <span className="ml-2 text-white">{result.location.date}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Time:</span>
                        <span className="ml-2 text-white">{result.location.time}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Coordinates:</span>
                        <span className="ml-2 text-white font-mono text-xs">
                          {result.location.latitude.toFixed(4)}°, {result.location.longitude.toFixed(4)}°
                        </span>
                      </div>
                    </div>

                    {result.success ? (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground block text-xs">Sun Sign</span>
                            <span className="text-white font-semibold">{result.sunSign}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">Moon Sign</span>
                            <span className="text-white font-semibold">{result.moonSign}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">Ascendant</span>
                            <span className="text-white font-semibold">{result.ascendant}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-red-500/20">
                        <p className="text-sm text-red-400 font-mono bg-red-950/30 p-3 rounded">
                          {result.error}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
