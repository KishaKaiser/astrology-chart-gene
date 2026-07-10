import { useMemo, useState } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Check, Copy, FilePdf, Link, PaperPlaneTilt, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface PLCMSConfig {
  apiBaseUrl: string
  apiKey: string
  enabled: boolean
}

interface PLCMSEvent {
  id: string
  reportId: string
  orderId: string
  customerName: string
  status: 'completed' | 'failed'
  timestamp: number
  reportUrl?: string
  fileName?: string
  error?: string
}

interface PLCMSReportResponse {
  reportId?: string
  status?: string
  reportUrl?: string
  fileName?: string
  message?: string
}

const defaultConfig: PLCMSConfig = {
  apiBaseUrl: 'http://localhost:4000/api/pl-cms/generate-report',
  apiKey: '',
  enabled: false,
}

const samplePayload = {
  reportId: 'plcms-test-001',
  orderId: 'PLCMS-1001',
  productName: 'Natal Chart Report',
  formData: {
    fullName: 'Test Customer',
    birthDate: '1990-05-15',
    birthTime: '14:30',
    birthCity: 'New York',
    birthState: 'NY',
    birthCountry: 'USA',
    birthLatitude: 40.7128,
    birthLongitude: -74.006,
    timezone: '-04:00',
    notes: 'Generated from the PL_CMS integration test.',
  },
}

export function PLCMSIntegration() {
  const [config, setConfig] = useKV<PLCMSConfig>('pl-cms-config', defaultConfig)
  const [events, setEvents] = useKV<PLCMSEvent[]>('pl-cms-events', [])
  const [testing, setTesting] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const currentConfig = config || defaultConfig
  const currentEvents = events || []
  const completedEvents = currentEvents.filter((event) => event.status === 'completed').length
  const failedEvents = currentEvents.filter((event) => event.status === 'failed').length

  const payloadText = useMemo(() => JSON.stringify(samplePayload, null, 2), [])
  const curlExample = useMemo(() => {
    const endpoint = currentConfig.apiBaseUrl || defaultConfig.apiBaseUrl
    return [
      `curl -X POST "${endpoint}"`,
      '  -H "Content-Type: application/json"',
      '  -H "Authorization: Bearer YOUR_PL_CMS_API_KEY"',
      `  -d '${JSON.stringify(samplePayload)}'`,
    ].join('\n')
  }, [currentConfig.apiBaseUrl])

  const handleSaveConfig = () => {
    setConfig({ ...currentConfig })
    toast.success('PL_CMS configuration saved')
  }

  const handleCopyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleGenerateSampleReport = async () => {
    if (!currentConfig.apiBaseUrl) {
      toast.error('Enter the PL_CMS report endpoint first')
      return
    }

    setTesting(true)
    const reportId = `plcms-test-${Date.now()}`
    const payload = {
      ...samplePayload,
      reportId,
      orderId: `PLCMS-${Math.floor(Math.random() * 100000)}`,
    }

    try {
      const response = await fetch(currentConfig.apiBaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentConfig.apiKey ? { Authorization: `Bearer ${currentConfig.apiKey}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      const result = (await response.json().catch(() => ({}))) as PLCMSReportResponse

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      setEvents((current) => [
        {
          id: reportId,
          reportId,
          orderId: payload.orderId,
          customerName: payload.formData.fullName,
          status: 'completed',
          timestamp: Date.now(),
          reportUrl: result.reportUrl,
          fileName: result.fileName,
        },
        ...(current || []),
      ])
      toast.success('PL_CMS sample report generated')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setEvents((current) => [
        {
          id: reportId,
          reportId,
          orderId: payload.orderId,
          customerName: payload.formData.fullName,
          status: 'failed',
          timestamp: Date.now(),
          error: errorMessage,
        },
        ...(current || []),
      ])
      toast.error(`PL_CMS test failed: ${errorMessage}`)
    } finally {
      setTesting(false)
    }
  }

  const handleClearEvents = () => {
    setEvents([])
    toast.success('PL_CMS history cleared')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">PL_CMS Integration</h2>
        <p className="text-muted-foreground">
          Connect PL_CMS orders to the astrology report service endpoint.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge variant={currentConfig.enabled ? 'default' : 'secondary'}>
                {currentConfig.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{completedEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{failedEvents}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup" className="gap-2">
            <Link weight="bold" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="payload" className="gap-2">
            <PaperPlaneTilt weight="bold" />
            Payload
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <FilePdf weight="bold" />
            History ({currentEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>PL_CMS Report Endpoint</CardTitle>
              <CardDescription>
                Configure the endpoint PL_CMS should call when a chart report is ordered.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pl-cms-endpoint">Report Endpoint URL</Label>
                <Input
                  id="pl-cms-endpoint"
                  placeholder="https://your-api.com/api/pl-cms/generate-report"
                  value={currentConfig.apiBaseUrl}
                  onChange={(event) =>
                    setConfig((current) => ({ ...(current || defaultConfig), apiBaseUrl: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pl-cms-api-key">API Key</Label>
                <Input
                  id="pl-cms-api-key"
                  type="password"
                  placeholder="Matches PL_CMS_API_KEY or ASTROLOGY_SERVICE_TOKEN"
                  value={currentConfig.apiKey}
                  onChange={(event) =>
                    setConfig((current) => ({ ...(current || defaultConfig), apiKey: event.target.value }))
                  }
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label htmlFor="pl-cms-enabled">Enable Integration</Label>
                  <p className="text-xs text-muted-foreground">
                    Marks this endpoint as the active PL_CMS report target.
                  </p>
                </div>
                <Switch
                  id="pl-cms-enabled"
                  checked={currentConfig.enabled}
                  onCheckedChange={(checked) =>
                    setConfig((current) => ({ ...(current || defaultConfig), enabled: checked }))
                  }
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSaveConfig} className="flex-1">
                  Save Configuration
                </Button>
                <Button
                  onClick={handleGenerateSampleReport}
                  variant="outline"
                  disabled={testing}
                  className="flex-1"
                >
                  {testing ? 'Generating...' : 'Generate Sample Report'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription>
              The matching backend route is <strong>/api/pl-cms/generate-report</strong>. If an API key is configured on
              the server, PL_CMS must send it as a Bearer token or as the <strong>x-api-key</strong> header.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="payload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>PL_CMS Request Body</CardTitle>
              <CardDescription>
                Send this JSON shape from PL_CMS when an astrology report product is purchased.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <Textarea value={payloadText} readOnly className="min-h-[360px] font-mono text-xs" />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleCopyToClipboard(payloadText, 'payload')}
                >
                  {copiedField === 'payload' ? <Check className="text-green-400" weight="bold" /> : <Copy weight="bold" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>cURL Example</CardTitle>
              <CardDescription>
                Use this to verify PL_CMS can reach the report service from the server environment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2">
                <Textarea value={curlExample} readOnly className="min-h-[140px] font-mono text-xs" />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleCopyToClipboard(curlExample, 'curl')}
                >
                  {copiedField === 'curl' ? <Check className="text-green-400" weight="bold" /> : <Copy weight="bold" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {currentEvents.length} total request{currentEvents.length !== 1 ? 's' : ''}
            </p>
            {currentEvents.length > 0 && (
              <Button onClick={handleClearEvents} variant="outline" size="sm">
                <Trash className="mr-2" weight="bold" />
                Clear History
              </Button>
            )}
          </div>

          <ScrollArea className="h-[520px] rounded-md border">
            <div className="p-4 space-y-3">
              {currentEvents.length === 0 ? (
                <div className="text-center py-12">
                  <FilePdf className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
                  <p className="text-muted-foreground">No PL_CMS report requests yet</p>
                </div>
              ) : (
                currentEvents.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white">{event.customerName}</h4>
                            <Badge variant={event.status === 'completed' ? 'default' : 'destructive'}>
                              {event.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Order #{event.orderId}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Report {event.reportId} • {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {event.reportUrl && (
                          <Button asChild variant="outline" size="sm">
                            <a href={event.reportUrl} target="_blank" rel="noreferrer">
                              Open PDF
                            </a>
                          </Button>
                        )}
                      </div>
                      {event.fileName && (
                        <p className="text-xs text-muted-foreground mt-3">File: {event.fileName}</p>
                      )}
                      {event.error && (
                        <Alert variant="destructive" className="mt-3">
                          <AlertDescription>{event.error}</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
