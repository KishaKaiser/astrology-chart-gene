import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { generateChartData } from '@/lib/astrology-calc'
import { Flask, CheckCircle, XCircle } from '@phosphor-icons/react'

export function SunSignTest() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [sunSign, setSunSign] = useState<string>('')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [autoRan, setAutoRan] = useState(false)

  const runTest = async () => {
    setLoading(true)
    setResult('Testing...')
    setSunSign('')
    setIsCorrect(null)
    
    try {
      console.log('=== SUN SIGN TEST FOR SEPTEMBER 1, 1977 ===')
      console.log('Birth data:')
      console.log('  Date: September 1, 1977')
      console.log('  Time: 17:00 (5:00 PM)')
      console.log('  Location: Indianapolis, IN')
      console.log('  Coordinates: 39.7684, -86.1581')
      console.log('  Timezone: -05:00 (EST, no DST in 1977)')
      console.log('  Expected: Sun in Virgo')
      console.log('  UTC Conversion: 17:00 EST + 5 hours = 22:00 UTC')
      console.log('')
      
      const chart = await generateChartData(
        'Test Subject',
        '1977-09-01',
        '17:00',
        'Indianapolis, IN',
        39.7684,
        -86.1581,
        '-05:00'
      )
      
      const sun = chart.planets.find(p => p.name === 'Sun')
      
      if (!sun) {
        setResult('ERROR: Sun planet not found in chart data')
        return
      }
      
      console.log('=== RESULT ===')
      console.log(`Sun Sign: ${sun.sign}`)
      console.log(`Sun Position: ${sun.degree.toFixed(4)}° ${sun.sign}`)
      console.log(`Sun Longitude: ${sun.longitude.toFixed(4)}°`)
      console.log('')
      
      const correct = sun.sign === 'Virgo'
      setSunSign(sun.sign)
      setIsCorrect(correct)
      
      setResult(`
Sun Sign: ${sun.sign} ${correct ? '✓' : '✗'}
Position: ${sun.degree.toFixed(2)}° ${sun.sign}
Absolute Longitude: ${sun.longitude.toFixed(2)}°
House: ${sun.house}

Expected: Virgo (150° - 180°)
Actual Range: ${Math.floor(sun.longitude / 30) * 30}° - ${Math.floor(sun.longitude / 30) * 30 + 30}°

Timezone Conversion:
  Local: Sept 1, 1977 at 17:00 EST (-05:00)
  UTC:   Sept 1, 1977 at 22:00 UTC
  
Calculation Details:
  Birth Date: ${chart.date} at ${chart.time}
  Location: ${chart.location}
  Timezone: ${chart.timezone}

Result: ${correct ? '✓ CORRECT - Sun in Virgo as expected!' : `✗ INCORRECT - Sun showing as ${sun.sign} instead of Virgo`}

${!correct ? `
⚠️ PROBLEM DETECTED:
The Sun is showing as ${sun.sign} instead of Virgo.
This suggests the UTC time conversion may still be incorrect.
Check the browser console for detailed calculation logs.
` : `
✓ SUCCESS:
The Sun sign is now correctly calculated as Virgo!
The timezone conversion is working properly.
`}
      `.trim())
      
    } catch (error) {
      console.error('Test failed with error:', error)
      setResult(`ERROR: ${error instanceof Error ? error.message : String(error)}`)
      setIsCorrect(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!autoRan) {
      setAutoRan(true)
      setTimeout(() => {
        runTest()
      }, 1000)
    }
  }, [autoRan])

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flask className="text-accent" weight="fill" />
            <CardTitle>Sun Sign Test - September 1, 1977</CardTitle>
          </div>
          {isCorrect !== null && (
            <Badge variant={isCorrect ? "default" : "destructive"} className="gap-1">
              {isCorrect ? (
                <>
                  <CheckCircle weight="fill" />
                  Virgo ✓
                </>
              ) : (
                <>
                  <XCircle weight="fill" />
                  {sunSign} ✗
                </>
              )}
            </Badge>
          )}
        </div>
        <CardDescription>
          Test chart generation with birth data: 9/1/1977 at 5:00 PM in Indianapolis, IN
          {loading && ' • Auto-running test...'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTest} 
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? 'Running Test...' : 'Re-run Sun Sign Test'}
        </Button>
        
        {result && (
          <pre className="bg-muted p-4 rounded-lg text-sm font-mono whitespace-pre-wrap overflow-x-auto text-foreground">
            {result}
          </pre>
        )}
        
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Expected Result:</strong> Sun in Virgo</p>
          <p><strong>Why:</strong> September 1 is well before the September 23 Sun-Libra ingress.</p>
          <p><strong>Timezone Note:</strong> Indianapolis did not observe DST in 1977, so 5:00 PM EST = 10:00 PM UTC.</p>
        </div>
      </CardContent>
    </Card>
  )
}
