import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { generateChartData } from '@/lib/astrology-calc'
import { Flask } from '@phosphor-icons/react'

export function SunSignTest() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    setResult('Testing...')
    
    try {
      console.log('=== SUN SIGN TEST FOR SEPTEMBER 1, 1977 ===')
      console.log('Birth data:')
      console.log('  Date: September 1, 1977')
      console.log('  Time: 17:00 (5:00 PM)')
      console.log('  Location: Indianapolis, IN')
      console.log('  Timezone: -05:00 (EST, no DST in 1977)')
      console.log('  Expected: Sun in Virgo')
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
      
      const isCorrect = sun.sign === 'Virgo'
      
      setResult(`
Sun Sign: ${sun.sign} ${isCorrect ? '✓' : '✗'}
Position: ${sun.degree.toFixed(2)}° ${sun.sign}
Absolute Longitude: ${sun.longitude.toFixed(2)}°

Expected: Virgo (150° - 180°)
Result: ${isCorrect ? '✓ CORRECT' : '✗ INCORRECT - Should be Virgo'}

Note: September 1, 1977 at 17:00 EST = 22:00 UTC
The Sun should be at approximately 8-9° Virgo at that time.

${!isCorrect ? `
⚠️ PROBLEM DETECTED:
The Sun is showing as ${sun.sign} instead of Virgo.
This suggests the UTC time conversion may still be incorrect.
Check the browser console for detailed calculation logs.
` : ''}
      `.trim())
      
    } catch (error) {
      console.error('Test failed with error:', error)
      setResult(`ERROR: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flask className="text-accent" weight="fill" />
          Sun Sign Test - September 1, 1977
        </CardTitle>
        <CardDescription>
          Test chart generation with birth data: 9/1/1977 at 5:00 PM in Indianapolis, IN
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTest} 
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? 'Running Test...' : 'Run Sun Sign Test'}
        </Button>
        
        {result && (
          <pre className="bg-muted p-4 rounded-lg text-sm font-mono whitespace-pre-wrap overflow-x-auto">
            {result}
          </pre>
        )}
        
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Expected Result:</strong> Sun in Virgo</p>
          <p><strong>Why:</strong> September 1 is well before the September 23 Sun-Libra ingress.</p>
          <p><strong>Timezone Note:</strong> Indianapolis did not observe DST in 1977, so 5:00 PM = UTC 22:00.</p>
        </div>
      </CardContent>
    </Card>
  )
}
