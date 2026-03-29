import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  FirstAid, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  XCircle,
  Info,
  Warning,
  ArrowsClockwise,
  Globe,
  Sparkle,
  Calendar,
  MapPin
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { resetSwissEphemeris } from '@/lib/astrology-calc'

type IssueCategory = 
  | 'chart-generation'
  | 'library-error'
  | 'location-search'
  | 'calculation-accuracy'
  | 'performance'
  | 'other'

interface TroubleshootingStep {
  id: string
  title: string
  description: string
  type: 'info' | 'action' | 'choice' | 'fix'
  content?: React.ReactNode
  action?: () => void | Promise<void>
  actionLabel?: string
  choices?: {
    label: string
    value: string
    nextStep: string
  }[]
  nextStep?: string
  isTerminal?: boolean
}

const ISSUE_FLOWS: Record<IssueCategory, TroubleshootingStep[]> = {
  'chart-generation': [
    {
      id: 'chart-gen-start',
      title: 'Chart Generation Issue',
      description: 'Let\'s diagnose why your chart isn\'t generating.',
      type: 'choice',
      choices: [
        {
          label: 'I see an error message about Swiss Ephemeris or library initialization',
          value: 'library-init',
          nextStep: 'library-init-check'
        },
        {
          label: 'The chart generates but shows incorrect data',
          value: 'wrong-data',
          nextStep: 'data-validation'
        },
        {
          label: 'Nothing happens when I click Generate Chart',
          value: 'no-response',
          nextStep: 'browser-check'
        },
        {
          label: 'I get an error about date or time format',
          value: 'date-error',
          nextStep: 'date-validation'
        }
      ]
    },
    {
      id: 'library-init-check',
      title: 'Library Initialization Issue',
      description: 'The astrology calculation engine failed to load properly.',
      type: 'action',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <p className="text-sm">This usually happens when:</p>
            <ul className="text-sm space-y-1 ml-4 list-disc text-white">
              <li>WebAssembly is not supported in your browser</li>
              <li>The library files failed to download</li>
              <li>There's a browser compatibility issue</li>
            </ul>
          </div>
          <p className="text-sm">Try the following solution:</p>
        </div>
      ),
      action: async () => {
        resetSwissEphemeris()
        toast.success('Engine reset! Wait 3 seconds, then try generating a chart again.')
      },
      actionLabel: 'Reset Astrology Engine',
      nextStep: 'library-reset-done'
    },
    {
      id: 'library-reset-done',
      title: 'Engine Reset Complete',
      description: 'The astrology engine has been reset.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-accent/10 border border-accent/30 rounded-lg">
            <CheckCircle weight="fill" className="text-accent mt-0.5" size={20} />
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium">Next Steps:</p>
              <ol className="text-sm space-y-2 ml-4 list-decimal text-white">
                <li>Wait 3-5 seconds for the engine to fully reinitialize</li>
                <li>Close this troubleshooting wizard</li>
                <li>Try generating a chart again</li>
                <li>If the issue persists, try refreshing the page</li>
              </ol>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Still Having Issues?</p>
            <p className="text-sm text-white">
              If the problem continues after refreshing:
            </p>
            <ul className="text-sm space-y-1 ml-4 list-disc text-white">
              <li>Try using a different browser (Chrome, Firefox, or Edge recommended)</li>
              <li>Check that your browser is up to date</li>
              <li>Disable browser extensions that might block WebAssembly</li>
              <li>Run the Diagnostics tool to see detailed technical information</li>
            </ul>
          </div>
        </div>
      ),
      isTerminal: true
    },
    {
      id: 'data-validation',
      title: 'Verify Your Input Data',
      description: 'Let\'s check if your birth data is entered correctly.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="date">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <Calendar weight="bold" />
                  Date Format
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm text-white pt-2">
                  <p>Dates should be in YYYY-MM-DD format:</p>
                  <div className="p-3 bg-muted/30 rounded font-mono text-xs text-white">
                    ✓ Correct: 1990-05-15<br/>
                    ✗ Wrong: 05/15/1990 or 15-05-1990
                  </div>
                  <p className="text-xs mt-2 text-white">Use the date picker to avoid format errors.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="time">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <Sparkle weight="fill" />
                  Time Format
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm text-white pt-2">
                  <p>Time should be in 24-hour HH:MM format:</p>
                  <div className="p-3 bg-muted/30 rounded font-mono text-xs text-white">
                    ✓ Correct: 14:30 (2:30 PM)<br/>
                    ✗ Wrong: 2:30 PM or 14:30:00
                  </div>
                  <p className="text-xs mt-2 text-white">Enter time in the local time of birth, not UTC.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="location">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <MapPin weight="fill" />
                  Location & Timezone
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm text-white pt-2">
                  <p>Make sure:</p>
                  <ul className="space-y-1 ml-4 list-disc text-white">
                    <li>You selected a location from the search dropdown</li>
                    <li>The timezone matches the birth location</li>
                    <li>Coordinates are in decimal format (e.g., 51.5074, -0.1278)</li>
                  </ul>
                  <div className="p-3 bg-accent/10 border border-accent/30 rounded mt-3">
                    <p className="text-xs text-white">
                      <strong>Tip:</strong> If birth location isn't available in search, 
                      choose the nearest major city and manually adjust coordinates if needed.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="extreme-lat">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <Warning weight="fill" />
                  Extreme Latitudes
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm text-white pt-2">
                  <p>Locations very close to the poles (above 66°N or below 66°S) may cause calculation issues.</p>
                  <p className="text-xs mt-2 text-white">
                    House systems may fail at extreme latitudes. Try using Whole Sign or Equal houses instead of Placidus.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Separator />

          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium mb-2 text-white">Still seeing incorrect data?</p>
            <p className="text-sm text-white">
              Double-check that your timezone offset matches the birth location. 
              Daylight Saving Time adjustments should be included in the timezone offset.
            </p>
          </div>
        </div>
      ),
      isTerminal: true
    },
    {
      id: 'browser-check',
      title: 'Check Browser Compatibility',
      description: 'Your browser might not support all required features.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <p className="text-sm font-medium text-white">Recommended Browsers:</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                <CheckCircle weight="fill" className="text-green-500" />
                <span className="text-sm text-white">Chrome 90+</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                <CheckCircle weight="fill" className="text-green-500" />
                <span className="text-sm text-white">Firefox 88+</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                <CheckCircle weight="fill" className="text-green-500" />
                <span className="text-sm text-white">Edge 90+</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                <CheckCircle weight="fill" className="text-green-500" />
                <span className="text-sm text-white">Safari 14+</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-white">Quick Fixes:</p>
            <ol className="text-sm space-y-2 ml-4 list-decimal text-white">
              <li>
                <strong>Refresh the page</strong> (Ctrl+R or Cmd+R)
                <p className="text-xs mt-1 text-white">This reinitializes the astrology engine</p>
              </li>
              <li>
                <strong>Clear browser cache</strong>
                <p className="text-xs mt-1 text-white">Old cached files might be causing issues</p>
              </li>
              <li>
                <strong>Disable browser extensions</strong>
                <p className="text-xs mt-1 text-white">Ad blockers or privacy extensions can interfere with WebAssembly</p>
              </li>
              <li>
                <strong>Try Incognito/Private mode</strong>
                <p className="text-xs mt-1 text-white">This rules out extension or cache issues</p>
              </li>
            </ol>
          </div>

          <Separator />

          <div className="flex items-start gap-3 p-3 bg-accent/10 border border-accent/30 rounded-lg">
            <Info weight="fill" className="text-accent mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">Use the Diagnostics Tool</p>
              <p className="text-xs text-white">
                Click the "Diagnostics" button in the header to run a complete system check 
                and see exactly what's working and what isn't.
              </p>
            </div>
          </div>
        </div>
      ),
      isTerminal: true
    },
    {
      id: 'date-validation',
      title: 'Date & Time Entry Help',
      description: 'Proper date and time format is crucial for accurate charts.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-sm font-medium mb-3 text-white">Use the Form Controls</p>
            <div className="space-y-2 text-sm text-white">
              <div className="flex items-start gap-2">
                <Calendar weight="bold" className="mt-0.5 text-accent" />
                <div>
                  <p className="font-medium text-white">Date Field:</p>
                  <p className="text-xs text-white">Click the calendar icon to select a date visually, which ensures correct formatting</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Sparkle weight="fill" className="mt-0.5 text-accent" />
                <div>
                  <p className="font-medium text-white">Time Field:</p>
                  <p className="text-xs text-white">Enter time as HH:MM (24-hour format). Examples: 09:30, 14:45, 23:15</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-white">Common Mistakes:</p>
            <div className="space-y-2">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle weight="fill" className="text-red-500" size={16} />
                  <span className="text-sm font-medium text-white">Wrong Date Format</span>
                </div>
                <p className="text-xs text-white ml-6">
                  Entering dates like "5/15/1990" instead of "1990-05-15"
                </p>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle weight="fill" className="text-red-500" size={16} />
                  <span className="text-sm font-medium text-white">12-Hour Time Format</span>
                </div>
                <p className="text-xs text-white ml-6">
                  Using "2:30 PM" instead of "14:30"
                </p>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle weight="fill" className="text-red-500" size={16} />
                  <span className="text-sm font-medium text-white">Wrong Timezone</span>
                </div>
                <p className="text-xs text-white ml-6">
                  Not matching timezone to birth location (e.g., using EST for a California birth)
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium mb-2 text-white">Pro Tip:</p>
            <p className="text-xs text-white">
              If you don't know the exact birth time, you can use 12:00 (noon) for a solar chart, 
              but note that house positions and angles (Ascendant, MC) won't be accurate.
            </p>
          </div>
        </div>
      ),
      isTerminal: true
    }
  ],

  'library-error': [
    {
      id: 'lib-error-start',
      title: 'Library Error Troubleshooting',
      description: 'The astrology calculation library is having issues.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm mb-3">
              Library errors typically show messages like:
            </p>
            <ul className="text-xs space-y-1 ml-4 list-disc text-white font-mono">
              <li>"Swiss Ephemeris library failed to load"</li>
              <li>"Astrology calculation engine failed"</li>
              <li>"Failed to initialize astrology engine"</li>
            </ul>
          </div>
          <p className="text-sm">Let's try some solutions in order:</p>
        </div>
      ),
      nextStep: 'lib-reset'
    },
    {
      id: 'lib-reset',
      title: 'Reset the Calculation Engine',
      description: 'First, try resetting the astrology engine.',
      type: 'action',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-white">
            This will reinitialize the Swiss Ephemeris library and clear any corrupted state.
          </p>
        </div>
      ),
      action: async () => {
        resetSwissEphemeris()
        await new Promise(resolve => setTimeout(resolve, 2000))
        toast.success('Engine reset complete!')
      },
      actionLabel: 'Reset Engine Now',
      nextStep: 'lib-test-after-reset'
    },
    {
      id: 'lib-test-after-reset',
      title: 'Test the Engine',
      description: 'Now try generating a chart to see if the issue is resolved.',
      type: 'choice',
      choices: [
        {
          label: 'It worked! The chart generated successfully',
          value: 'success',
          nextStep: 'lib-success'
        },
        {
          label: 'Still getting an error',
          value: 'still-error',
          nextStep: 'lib-browser-check'
        }
      ]
    },
    {
      id: 'lib-success',
      title: 'Issue Resolved!',
      description: 'Great! The engine is working properly now.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-accent/10 border border-accent/30 rounded-lg">
            <CheckCircle weight="fill" className="text-accent" size={24} />
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">The library error has been resolved!</p>
              <p className="text-xs text-white">
                You can now generate charts normally. If the error returns, 
                try the reset process again or refresh the page.
              </p>
            </div>
          </div>
        </div>
      ),
      isTerminal: true
    },
    {
      id: 'lib-browser-check',
      title: 'Check Browser Support',
      description: 'Your browser might not support WebAssembly, which is required for calculations.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <p className="text-sm font-medium">Required Browser Features:</p>
            <ul className="text-sm space-y-2 ml-4 list-disc text-muted-foreground">
              <li><strong>WebAssembly</strong> - Core calculation engine</li>
              <li><strong>ES6+ JavaScript</strong> - Modern syntax support</li>
              <li><strong>Async/Await</strong> - Asynchronous operations</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Try these solutions:</p>
            <ol className="text-sm space-y-3 ml-4 list-decimal text-muted-foreground">
              <li>
                <strong>Update your browser</strong>
                <p className="text-xs mt-1">Make sure you're using the latest version</p>
              </li>
              <li>
                <strong>Switch to a supported browser</strong>
                <p className="text-xs mt-1">Chrome, Firefox, Edge, or Safari 14+</p>
              </li>
              <li>
                <strong>Refresh the page completely</strong>
                <p className="text-xs mt-1">Use Ctrl+Shift+R (or Cmd+Shift+R) for a hard refresh</p>
              </li>
              <li>
                <strong>Run Diagnostics</strong>
                <p className="text-xs mt-1">Click "Diagnostics" in the header for detailed technical info</p>
              </li>
            </ol>
          </div>

          <Separator />

          <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <Warning weight="fill" className="text-yellow-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Still Not Working?</p>
              <p className="text-xs text-muted-foreground">
                Try disabling browser extensions (especially ad blockers and privacy tools) 
                as they can interfere with WebAssembly loading. Test in Incognito/Private mode to confirm.
              </p>
            </div>
          </div>
        </div>
      ),
      isTerminal: true
    }
  ],

  'location-search': [
    {
      id: 'location-start',
      title: 'Location Search Issues',
      description: 'Having trouble finding or selecting a location?',
      type: 'choice',
      choices: [
        {
          label: 'My city doesn\'t appear in the search results',
          value: 'not-found',
          nextStep: 'location-not-found'
        },
        {
          label: 'Search isn\'t working at all (no results)',
          value: 'no-results',
          nextStep: 'location-no-results'
        },
        {
          label: 'Wrong coordinates or timezone populated',
          value: 'wrong-coords',
          nextStep: 'location-wrong-coords'
        }
      ]
    },
    {
      id: 'location-not-found',
      title: 'City Not in Database',
      description: 'Not all cities are in the location database.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-sm font-medium mb-2">Workaround:</p>
            <ol className="text-sm space-y-2 ml-4 list-decimal text-muted-foreground">
              <li>Search for the nearest major city</li>
              <li>Select it to populate coordinates and timezone</li>
              <li>Manually adjust coordinates if needed (optional)</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Finding Coordinates:</p>
            <p className="text-sm text-muted-foreground">
              You can find exact coordinates for any location using:
            </p>
            <ul className="text-sm space-y-1 ml-4 list-disc text-muted-foreground">
              <li>Google Maps (right-click on location → coordinates shown)</li>
              <li>Search "coordinates of [city name]" in any search engine</li>
              <li>GPS coordinates from maps applications</li>
            </ul>
          </div>

          <Separator />

          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> For astrology purposes, coordinates within 10-20 miles 
              of the actual birth location are usually sufficient unless you're doing very precise work.
            </p>
          </div>
        </div>
      ),
      isTerminal: true
    },
    {
      id: 'location-no-results',
      title: 'Location Search Not Working',
      description: 'The search function isn\'t returning any results.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <p className="text-sm font-medium">Common causes:</p>
            <ul className="text-sm space-y-2 ml-4 list-disc text-muted-foreground">
              <li>Location database hasn't loaded yet (wait a few seconds)</li>
              <li>Searching with special characters or unusual spelling</li>
              <li>Network connectivity issues</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Try these fixes:</p>
            <ol className="text-sm space-y-2 ml-4 list-decimal text-muted-foreground">
              <li>Wait 3-5 seconds after page load before searching</li>
              <li>Try different spelling variations (e.g., "New York" vs "New York City")</li>
              <li>Search for just the city name without state/country</li>
              <li>Use major city names rather than neighborhoods or districts</li>
              <li>Refresh the page if search continues not to work</li>
            </ol>
          </div>

          <Separator />

          <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-sm font-medium mb-2">Alternative:</p>
            <p className="text-sm text-muted-foreground">
              If search completely fails, you can manually enter coordinates and timezone. 
              Find coordinates using Google Maps or any GPS service.
            </p>
          </div>
        </div>
      ),
      isTerminal: true
    },
    {
      id: 'location-wrong-coords',
      title: 'Incorrect Location Data',
      description: 'The coordinates or timezone don\'t match your location.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm font-medium mb-2">Important:</p>
            <p className="text-sm text-muted-foreground">
              Always verify the coordinates and timezone after selecting a location. 
              The database might have outdated information for some cities.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">How to correct:</p>
            <div className="space-y-2">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-1">Coordinates</p>
                <p className="text-xs text-muted-foreground">
                  Manually edit the latitude/longitude fields after selecting a location. 
                  Use decimal format (e.g., 40.7128, -74.0060 for New York).
                </p>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-1">Timezone</p>
                <p className="text-xs text-muted-foreground">
                  Select the correct timezone from the dropdown. Make sure to account for 
                  whether Daylight Saving Time was in effect at the time of birth.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium mb-2">Timezone Resources:</p>
            <p className="text-xs text-muted-foreground">
              Search "historical timezone for [city] on [date]" to find accurate timezone 
              information including DST rules that were in effect at the time of birth.
            </p>
          </div>
        </div>
      ),
      isTerminal: true
    }
  ],

  'calculation-accuracy': [
    {
      id: 'accuracy-start',
      title: 'Calculation Accuracy Concerns',
      description: 'Let\'s verify the accuracy of your chart calculations.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-sm font-medium mb-2">What to verify:</p>
            <ul className="text-sm space-y-1 ml-4 list-disc text-muted-foreground">
              <li>Birth date and time are correct</li>
              <li>Timezone matches the birth location</li>
              <li>Daylight Saving Time is accounted for</li>
              <li>Coordinates are accurate</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Common accuracy issues:</p>
            <div className="space-y-2">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-1">DST (Daylight Saving Time)</p>
                <p className="text-xs text-muted-foreground">
                  The most common cause of incorrect charts. Your timezone offset should reflect 
                  whether DST was active at birth time. Check DST History in the app for guidance.
                </p>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-1">Local Mean Time vs Standard Time</p>
                <p className="text-xs text-muted-foreground">
                  For births before ~1900, you may need to use Local Mean Time calculations. 
                  This app uses standard timezone-based calculations.
                </p>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-1">House System</p>
                <p className="text-xs text-muted-foreground">
                  Different house systems (Placidus, Koch, Whole Sign, etc.) will give different 
                  house cusps. This is normal and not an error.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      isTerminal: true
    }
  ],

  'performance': [
    {
      id: 'performance-start',
      title: 'Performance Issues',
      description: 'Is the app running slowly?',
      type: 'choice',
      choices: [
        {
          label: 'Chart generation takes a very long time',
          value: 'slow-generation',
          nextStep: 'slow-generation'
        },
        {
          label: 'The app feels sluggish or unresponsive',
          value: 'sluggish',
          nextStep: 'general-performance'
        },
        {
          label: 'Browser tab is using too much memory',
          value: 'memory',
          nextStep: 'memory-usage'
        }
      ]
    },
    {
      id: 'slow-generation',
      title: 'Slow Chart Generation',
      description: 'Chart generation typically takes 1-3 seconds.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm mb-2">The first chart after page load may take longer (5-10 seconds) while the library initializes.</p>
            <p className="text-sm text-muted-foreground">Subsequent charts should be much faster.</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">If every chart is slow:</p>
            <ol className="text-sm space-y-2 ml-4 list-decimal text-muted-foreground">
              <li>Close other tabs to free up browser resources</li>
              <li>Refresh the page to clear memory</li>
              <li>Check if your device is low on RAM</li>
              <li>Try a different browser</li>
            </ol>
          </div>

          <Separator />

          <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              The app uses WebAssembly for calculations, which requires some initialization time. 
              This is normal and ensures accurate astronomical calculations.
            </p>
          </div>
        </div>
      ),
      isTerminal: true
    },
    {
      id: 'general-performance',
      title: 'General Performance Tips',
      description: 'Optimize the app\'s performance.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Quick fixes:</p>
            <ol className="text-sm space-y-2 ml-4 list-decimal text-muted-foreground">
              <li>Refresh the page periodically to clear memory</li>
              <li>Close unused browser tabs</li>
              <li>Clear browser cache and cookies</li>
              <li>Update your browser to the latest version</li>
              <li>Restart your browser completely</li>
            </ol>
          </div>

          <Separator />

          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium mb-2">Chart Library Management:</p>
            <p className="text-sm text-muted-foreground">
              If you have many saved charts (20+), the app may slow down. Consider deleting 
              old charts you no longer need to improve performance.
            </p>
          </div>
        </div>
      ),
      isTerminal: true
    },
    {
      id: 'memory-usage',
      title: 'High Memory Usage',
      description: 'The app stores chart data locally in your browser.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm font-medium mb-2">Memory Considerations:</p>
            <p className="text-sm text-muted-foreground">
              Each saved chart with interpretations uses browser storage. Large libraries 
              (50+ charts) may impact performance on lower-end devices.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">To reduce memory usage:</p>
            <ul className="text-sm space-y-2 ml-4 list-disc text-muted-foreground">
              <li>Delete old charts you don't need</li>
              <li>Clear interpretations from charts (they can be regenerated)</li>
              <li>Refresh the page to clear runtime memory</li>
              <li>Use browser's "clear site data" for a fresh start</li>
            </ul>
          </div>

          <Separator />

          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Run Diagnostics to see current memory usage statistics.
            </p>
          </div>
        </div>
      ),
      isTerminal: true
    }
  ],

  'other': [
    {
      id: 'other-start',
      title: 'Other Issues',
      description: 'Let\'s identify your specific issue.',
      type: 'choice',
      choices: [
        {
          label: 'I need help understanding chart interpretations',
          value: 'interpretations',
          nextStep: 'interpretation-help'
        },
        {
          label: 'Export or printing issues',
          value: 'export',
          nextStep: 'export-help'
        },
        {
          label: 'Data privacy / storage concerns',
          value: 'privacy',
          nextStep: 'privacy-help'
        },
        {
          label: 'Something else not listed',
          value: 'unlisted',
          nextStep: 'general-help'
        }
      ]
    },
    {
      id: 'interpretation-help',
      title: 'Understanding Interpretations',
      description: 'Chart interpretations are AI-generated summaries.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-sm">
              Interpretations provide insights into planetary positions, aspects, and patterns 
              found in your chart. They are generated on-demand using AI.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Key points:</p>
            <ul className="text-sm space-y-2 ml-4 list-disc text-muted-foreground">
              <li>Interpretations are guidelines, not absolute predictions</li>
              <li>Different astrologers may interpret the same chart differently</li>
              <li>You can regenerate interpretations to get different perspectives</li>
              <li>The chart data (positions, aspects) is calculated precisely</li>
            </ul>
          </div>

          <Separator />

          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium mb-2">Need More Detail?</p>
            <p className="text-xs text-muted-foreground">
              Click "Generate Interpretation" on any chart to get a comprehensive reading 
              of planetary positions, aspects, and patterns.
            </p>
          </div>
        </div>
      ),
      isTerminal: true
    },
    {
      id: 'export-help',
      title: 'Export & Printing',
      description: 'Save or print your charts.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium mb-1">Export as PDF</p>
              <p className="text-xs text-muted-foreground">
                Use the "Export PDF" button on any chart view to save a professional PDF 
                with chart wheel and interpretation.
              </p>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium mb-1">Browser Printing</p>
              <p className="text-xs text-muted-foreground">
                Use Ctrl+P (or Cmd+P) to print directly from your browser. 
                The chart will format appropriately for printing.
              </p>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium mb-1">Screenshot</p>
              <p className="text-xs text-muted-foreground">
                Use your device's screenshot tool to capture specific sections of the chart.
              </p>
            </div>
          </div>

          <Separator />

          <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              All your saved charts remain in the Chart Library and can be accessed anytime.
            </p>
          </div>
        </div>
      ),
      isTerminal: true
    },
    {
      id: 'privacy-help',
      title: 'Data Privacy & Storage',
      description: 'Your data is stored locally in your browser.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-sm font-medium mb-2">Privacy First:</p>
            <p className="text-sm text-muted-foreground">
              All chart data and interpretations are stored locally in your browser's storage. 
              Nothing is sent to external servers except during interpretation generation.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">What this means:</p>
            <ul className="text-sm space-y-2 ml-4 list-disc text-muted-foreground">
              <li>Your charts are private to you and your browser</li>
              <li>Data persists even after closing the browser</li>
              <li>Charts won't sync across devices or browsers</li>
              <li>Clearing browser data will delete all saved charts</li>
            </ul>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">To delete your data:</p>
            <ol className="text-sm space-y-1 ml-4 list-decimal text-muted-foreground">
              <li>Delete individual charts from the Chart Library</li>
              <li>Or use browser settings → Clear browsing data → Site data</li>
            </ol>
          </div>
        </div>
      ),
      isTerminal: true
    },
    {
      id: 'general-help',
      title: 'General Help Resources',
      description: 'Additional resources for troubleshooting.',
      type: 'info',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <p className="text-sm font-medium">Helpful tools in the app:</p>
            <ul className="text-sm space-y-2 ml-4 list-disc text-muted-foreground">
              <li><strong>Diagnostics</strong> - Technical system check (in header)</li>
              <li><strong>DST History</strong> - Check daylight saving time rules</li>
              <li><strong>Reset Engine</strong> - Reinitialize calculation library (appears when needed)</li>
            </ul>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Basic troubleshooting steps:</p>
            <ol className="text-sm space-y-2 ml-4 list-decimal text-muted-foreground">
              <li>Refresh the page (Ctrl+R or Cmd+R)</li>
              <li>Clear browser cache</li>
              <li>Try a different browser</li>
              <li>Check browser console (F12) for error messages</li>
              <li>Run Diagnostics for detailed system info</li>
            </ol>
          </div>

          <Separator />

          <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-sm font-medium mb-2">Still need help?</p>
            <p className="text-xs text-muted-foreground">
              Try running Diagnostics and reviewing the detailed technical report. 
              This will help identify specific browser or compatibility issues.
            </p>
          </div>
        </div>
      ),
      isTerminal: true
    }
  ]
}

export function TroubleshootingWizard() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | null>(null)
  const [currentStepId, setCurrentStepId] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [selectedChoice, setSelectedChoice] = useState<string>('')

  const currentFlow = selectedCategory ? ISSUE_FLOWS[selectedCategory] : []
  const currentStep = currentFlow.find(step => step.id === currentStepId)

  const startTroubleshooting = (category: IssueCategory) => {
    setSelectedCategory(category)
    const firstStep = ISSUE_FLOWS[category][0]
    setCurrentStepId(firstStep.id)
    setHistory([])
    setSelectedChoice('')
  }

  const goToNextStep = () => {
    if (!currentStep) return

    let nextStepId: string | undefined

    if (currentStep.type === 'choice' && selectedChoice) {
      const choice = currentStep.choices?.find(c => c.value === selectedChoice)
      nextStepId = choice?.nextStep
    } else {
      nextStepId = currentStep.nextStep
    }

    if (nextStepId && currentStepId) {
      setHistory(prev => [...prev, currentStepId])
      setCurrentStepId(nextStepId)
      setSelectedChoice('')
    }
  }

  const goBack = () => {
    if (history.length > 0) {
      const previousStepId = history[history.length - 1]
      setHistory(prev => prev.slice(0, -1))
      setCurrentStepId(previousStepId)
      setSelectedChoice('')
    } else {
      setSelectedCategory(null)
      setCurrentStepId(null)
    }
  }

  const reset = () => {
    setSelectedCategory(null)
    setCurrentStepId(null)
    setHistory([])
    setSelectedChoice('')
  }

  const handleAction = async () => {
    if (currentStep?.action) {
      await currentStep.action()
      if (currentStep.nextStep) {
        goToNextStep()
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="border-accent/50 text-accent hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <FirstAid className="mr-2" weight="bold" />
          Troubleshooting
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FirstAid weight="bold" className="text-accent" size={24} />
            Troubleshooting Wizard
          </DialogTitle>
          <DialogDescription>
            Step-by-step guidance to resolve common issues
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {!selectedCategory ? (
            <div className="space-y-4">
              <p className="text-sm text-white">
                What type of issue are you experiencing?
              </p>

              <div className="grid gap-3">
                <Card 
                  className="cursor-pointer hover:bg-accent/10 hover:border-accent/50 transition-colors"
                  onClick={() => startTroubleshooting('chart-generation')}
                >
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                      <XCircle weight="fill" className="text-red-500" />
                      Chart Generation Problems
                    </CardTitle>
                    <CardDescription className="text-xs text-white">
                      Errors when trying to generate a natal chart
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card 
                  className="cursor-pointer hover:bg-accent/10 hover:border-accent/50 transition-colors"
                  onClick={() => startTroubleshooting('library-error')}
                >
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                      <Warning weight="fill" className="text-yellow-500" />
                      Library/Engine Errors
                    </CardTitle>
                    <CardDescription className="text-xs text-white">
                      Swiss Ephemeris or calculation engine issues
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card 
                  className="cursor-pointer hover:bg-accent/10 hover:border-accent/50 transition-colors"
                  onClick={() => startTroubleshooting('location-search')}
                >
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                      <Globe weight="bold" className="text-blue-400" />
                      Location Search Issues
                    </CardTitle>
                    <CardDescription className="text-xs text-white">
                      Can't find or select birth location
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card 
                  className="cursor-pointer hover:bg-accent/10 hover:border-accent/50 transition-colors"
                  onClick={() => startTroubleshooting('calculation-accuracy')}
                >
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                      <Info weight="fill" className="text-purple-400" />
                      Calculation Accuracy
                    </CardTitle>
                    <CardDescription className="text-xs text-white">
                      Chart data seems incorrect or inaccurate
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card 
                  className="cursor-pointer hover:bg-accent/10 hover:border-accent/50 transition-colors"
                  onClick={() => startTroubleshooting('performance')}
                >
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                      <ArrowsClockwise weight="bold" className="text-orange-400" />
                      Performance Issues
                    </CardTitle>
                    <CardDescription className="text-xs text-white">
                      App is slow or unresponsive
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card 
                  className="cursor-pointer hover:bg-accent/10 hover:border-accent/50 transition-colors"
                  onClick={() => startTroubleshooting('other')}
                >
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                      <Sparkle weight="fill" className="text-accent" />
                      Other Issues
                    </CardTitle>
                    <CardDescription className="text-xs text-white">
                      Something else not listed above
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          ) : currentStep ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  Step {history.length + 1}
                </Badge>
                {currentStep.isTerminal && (
                  <Badge variant="default" className="text-xs bg-accent">
                    Solution
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-white">{currentStep.title}</h3>
                <p className="text-sm text-white">{currentStep.description}</p>
              </div>

              <Separator />

              <div className="space-y-4">
                {currentStep.content}

                {currentStep.type === 'choice' && currentStep.choices && (
                  <RadioGroup value={selectedChoice} onValueChange={setSelectedChoice}>
                    <div className="space-y-2">
                      {currentStep.choices.map((choice) => (
                        <div key={choice.value} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/30 cursor-pointer">
                          <RadioGroupItem value={choice.value} id={choice.value} />
                          <Label htmlFor={choice.value} className="text-sm cursor-pointer flex-1 text-white">
                            {choice.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                {currentStep.type === 'action' && currentStep.action && (
                  <Button 
                    onClick={handleAction} 
                    className="w-full"
                    size="lg"
                  >
                    {currentStep.actionLabel || 'Continue'}
                    <ArrowRight className="ml-2" weight="bold" />
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </ScrollArea>

        <Separator />

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            disabled={!selectedCategory}
          >
            <ArrowLeft className="mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            {currentStep?.isTerminal ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setIsOpen(false)
                  reset()
                }}
              >
                <CheckCircle className="mr-2" weight="fill" />
                Done
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                >
                  Start Over
                </Button>
                {currentStep?.type === 'info' && currentStep?.nextStep && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={goToNextStep}
                  >
                    Continue
                    <ArrowRight className="ml-2" weight="bold" />
                  </Button>
                )}
                {currentStep?.type === 'choice' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={goToNextStep}
                    disabled={!selectedChoice}
                  >
                    Continue
                    <ArrowRight className="ml-2" weight="bold" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
