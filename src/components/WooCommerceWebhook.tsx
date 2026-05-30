import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Copy, Check, Link, ArrowsClockwise, ClockCounterClockwise, Trash, ShoppingBag } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { generateChartData } from '@/lib/astrology-calc'
import { ChartData } from '@/lib/astrology-types'

interface WooCommerceConfig {
  storeUrl: string
  consumerKey: string
  consumerSecret: string
  webhookSecret: string
  enabled: boolean
}

interface WebhookEvent {
  id: string
  orderId: string
  customerName: string
  customerEmail: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  chartGenerated: boolean
  timestamp: number
  error?: string
  chartId?: string
  orderData?: {
    birthDate?: string
    birthTime?: string
    birthLocation?: string
    latitude?: number
    longitude?: number
    timezone?: string
    notes?: string
  }
}

interface WooCommerceWebhookProps {
  onChartGenerated?: (chart: ChartData) => void
}

export function WooCommerceWebhook({ onChartGenerated }: WooCommerceWebhookProps) {
  const [config, setConfig] = useKV<WooCommerceConfig>('woocommerce-config', {
    storeUrl: '',
    consumerKey: '',
    consumerSecret: '',
    webhookSecret: '',
    enabled: false,
  })
  const [webhookEvents, setWebhookEvents] = useKV<WebhookEvent[]>('webhook-events', [])
  
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [testingConnection, setTestingConnection] = useState(false)
  const [processingEvent, setProcessingEvent] = useState<string | null>(null)

  const webhookUrl = `${window.location.origin}/api/webhook/woocommerce`
  
  const currentConfig = config || {
    storeUrl: '',
    consumerKey: '',
    consumerSecret: '',
    webhookSecret: '',
    enabled: false,
  }
  
  const currentEvents = webhookEvents || []

  const handleCopyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleSaveConfig = () => {
    if (config) {
      setConfig({ ...config })
    }
    toast.success('Configuration saved')
  }

  const handleTestConnection = async () => {
    if (!currentConfig.storeUrl || !currentConfig.consumerKey || !currentConfig.consumerSecret) {
      toast.error('Please fill in all WooCommerce credentials')
      return
    }

    setTestingConnection(true)
    try {
      const cleanUrl = currentConfig.storeUrl.replace(/\/$/, '')
      const url = `${cleanUrl}/wp-json/wc/v3/system_status`
      
      const auth = btoa(`${currentConfig.consumerKey}:${currentConfig.consumerSecret}`)
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      })

      if (response.ok) {
        toast.success('Successfully connected to WooCommerce!')
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      toast.error(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTestingConnection(false)
    }
  }

  const handleProcessEvent = async (event: WebhookEvent) => {
    if (!event.orderData) {
      toast.error('No birth data found in order')
      return
    }

    const { birthDate, birthTime, birthLocation, latitude, longitude, timezone, notes } = event.orderData

    if (!birthDate || !birthTime || !birthLocation || latitude === undefined || longitude === undefined || !timezone) {
      toast.error('Incomplete birth data in order')
      return
    }

    setProcessingEvent(event.id)
    try {
      const chart = await generateChartData(
        event.customerName,
        birthDate,
        birthTime,
        birthLocation,
        latitude,
        longitude,
        timezone,
        notes || `Generated from WooCommerce Order #${event.orderId}`
      )

      setWebhookEvents((current) => {
        const currentArray = current || []
        return currentArray.map((e) =>
          e.id === event.id
            ? { ...e, status: 'completed' as const, chartGenerated: true, chartId: chart.id }
            : e
        )
      })

      toast.success(`Chart generated for ${event.customerName}`)
      
      if (onChartGenerated) {
        onChartGenerated(chart)
      }
    } catch (error) {
      console.error('Chart generation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setWebhookEvents((current) => {
        const currentArray = current || []
        return currentArray.map((e) =>
          e.id === event.id
            ? { ...e, status: 'failed' as const, error: errorMessage }
            : e
        )
      })
      
      toast.error(`Failed to generate chart: ${errorMessage}`)
    } finally {
      setProcessingEvent(null)
    }
  }

  const handleDeleteEvent = (eventId: string) => {
    setWebhookEvents((current) => {
      const currentArray = current || []
      return currentArray.filter((e) => e.id !== eventId)
    })
    toast.success('Event deleted')
  }

  const handleClearAllEvents = () => {
    setWebhookEvents([])
    toast.success('All events cleared')
  }

  const simulateWebhookEvent = () => {
    const mockEvent: WebhookEvent = {
      id: `test-${Date.now()}`,
      orderId: `TEST-${Math.floor(Math.random() * 10000)}`,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      status: 'pending',
      chartGenerated: false,
      timestamp: Date.now(),
      orderData: {
        birthDate: '1990-05-15',
        birthTime: '14:30',
        birthLocation: 'New York, NY, USA',
        latitude: 40.7128,
        longitude: -74.0060,
        timezone: '-04:00',
        notes: 'Test order from webhook simulation',
      },
    }

    setWebhookEvents((current) => [mockEvent, ...(current || [])])
    toast.success('Test webhook event created')
  }

  const pendingEvents = currentEvents.filter((e) => e.status === 'pending').length
  const completedEvents = currentEvents.filter((e) => e.status === 'completed').length
  const failedEvents = currentEvents.filter((e) => e.status === 'failed').length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">WooCommerce Integration</h2>
        <p className="text-muted-foreground">
          Automatically generate charts from WooCommerce orders via webhooks
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">{pendingEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
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
          <TabsTrigger value="events" className="gap-2">
            <ClockCounterClockwise weight="bold" />
            Events ({currentEvents.length})
          </TabsTrigger>
          <TabsTrigger value="instructions" className="gap-2">
            <ArrowsClockwise weight="bold" />
            Instructions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>WooCommerce Credentials</CardTitle>
              <CardDescription>
                Enter your WooCommerce REST API credentials to enable order processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store-url">Store URL</Label>
                <Input
                  id="store-url"
                  placeholder="https://yourstore.com"
                  value={currentConfig.storeUrl}
                  onChange={(e) => setConfig((current) => {
                    const c = current || { storeUrl: '', consumerKey: '', consumerSecret: '', webhookSecret: '', enabled: false }
                    return { ...c, storeUrl: e.target.value }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consumer-key">Consumer Key</Label>
                <Input
                  id="consumer-key"
                  placeholder="ck_..."
                  value={currentConfig.consumerKey}
                  onChange={(e) => setConfig((current) => {
                    const c = current || { storeUrl: '', consumerKey: '', consumerSecret: '', webhookSecret: '', enabled: false }
                    return { ...c, consumerKey: e.target.value }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consumer-secret">Consumer Secret</Label>
                <Input
                  id="consumer-secret"
                  type="password"
                  placeholder="cs_..."
                  value={currentConfig.consumerSecret}
                  onChange={(e) => setConfig((current) => {
                    const c = current || { storeUrl: '', consumerKey: '', consumerSecret: '', webhookSecret: '', enabled: false }
                    return { ...c, consumerSecret: e.target.value }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Webhook Secret (Optional)</Label>
                <Input
                  id="webhook-secret"
                  placeholder="Generate in WooCommerce settings"
                  value={currentConfig.webhookSecret}
                  onChange={(e) => setConfig((current) => {
                    const c = current || { storeUrl: '', consumerKey: '', consumerSecret: '', webhookSecret: '', enabled: false }
                    return { ...c, webhookSecret: e.target.value }
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Used to verify webhook authenticity
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled">Enable Integration</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically process new orders
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={currentConfig.enabled}
                  onCheckedChange={(checked) => setConfig((current) => {
                    const c = current || { storeUrl: '', consumerKey: '', consumerSecret: '', webhookSecret: '', enabled: false }
                    return { ...c, enabled: checked }
                  })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSaveConfig} className="flex-1">
                  Save Configuration
                </Button>
                <Button
                  onClick={handleTestConnection}
                  variant="outline"
                  disabled={testingConnection}
                  className="flex-1"
                >
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhook Endpoint</CardTitle>
              <CardDescription>
                Use this URL in your WooCommerce webhook settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleCopyToClipboard(webhookUrl, 'webhook-url')}
                >
                  {copiedField === 'webhook-url' ? (
                    <Check className="text-green-400" weight="bold" />
                  ) : (
                    <Copy weight="bold" />
                  )}
                </Button>
              </div>
              <Alert>
                <AlertDescription>
                  <strong>Note:</strong> This webhook endpoint is for demonstration purposes. In a production environment, 
                  you would need a backend server to receive and validate webhook requests from WooCommerce.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testing</CardTitle>
              <CardDescription>
                Simulate a webhook event to test chart generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={simulateWebhookEvent} variant="outline" className="w-full">
                <ShoppingBag className="mr-2" weight="bold" />
                Simulate Test Order
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {currentEvents.length} total event{currentEvents.length !== 1 ? 's' : ''}
            </p>
            {currentEvents.length > 0 && (
              <Button onClick={handleClearAllEvents} variant="outline" size="sm">
                <Trash className="mr-2" weight="bold" />
                Clear All
              </Button>
            )}
          </div>

          <ScrollArea className="h-[600px] rounded-md border">
            <div className="p-4 space-y-3">
              {currentEvents.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowsClockwise className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
                  <p className="text-muted-foreground">No webhook events yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Events will appear here when orders are received from WooCommerce
                  </p>
                </div>
              ) : (
                currentEvents.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white">{event.customerName}</h4>
                            <Badge
                              variant={
                                event.status === 'completed'
                                  ? 'default'
                                  : event.status === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {event.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{event.customerEmail}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Order #{event.orderId} • {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash weight="bold" />
                        </Button>
                      </div>

                      {event.orderData && (
                        <div className="text-sm space-y-1 mb-3 p-3 bg-muted/20 rounded-md">
                          <p className="text-muted-foreground">
                            <strong>Birth Date:</strong> {event.orderData.birthDate}
                          </p>
                          <p className="text-muted-foreground">
                            <strong>Birth Time:</strong> {event.orderData.birthTime}
                          </p>
                          <p className="text-muted-foreground">
                            <strong>Location:</strong> {event.orderData.birthLocation}
                          </p>
                        </div>
                      )}

                      {event.error && (
                        <Alert variant="destructive" className="mb-3">
                          <AlertDescription>{event.error}</AlertDescription>
                        </Alert>
                      )}

                      {event.status === 'pending' && (
                        <Button
                          onClick={() => handleProcessEvent(event)}
                          disabled={processingEvent === event.id}
                          className="w-full"
                          size="sm"
                        >
                          {processingEvent === event.id ? 'Processing...' : 'Generate Chart'}
                        </Button>
                      )}

                      {event.status === 'completed' && event.chartId && (
                        <Badge variant="outline" className="w-full justify-center">
                          Chart Generated: {event.chartId}
                        </Badge>
                      )}

                      {event.status === 'failed' && (
                        <Button
                          onClick={() => handleProcessEvent(event)}
                          disabled={processingEvent === event.id}
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          Retry Generation
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="instructions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WooCommerce Setup Instructions</CardTitle>
              <CardDescription>
                Follow these steps to integrate your WooCommerce store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-white mb-2">1. Generate API Keys</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Go to your WordPress admin dashboard</li>
                  <li>Navigate to WooCommerce → Settings → Advanced → REST API</li>
                  <li>Click "Add key"</li>
                  <li>Set description (e.g., "Psychic Link Charts")</li>
                  <li>Set user to an administrator account</li>
                  <li>Set permissions to "Read/Write"</li>
                  <li>Click "Generate API key"</li>
                  <li>Copy the Consumer key and Consumer secret</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">2. Create Webhook</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Go to WooCommerce → Settings → Advanced → Webhooks</li>
                  <li>Click "Add webhook"</li>
                  <li>Set name: "Chart Generation"</li>
                  <li>Set status: "Active"</li>
                  <li>Set topic: "Order created" or "Order updated"</li>
                  <li>Paste the webhook URL from the Setup tab</li>
                  <li>Set secret (optional but recommended)</li>
                  <li>Set API version: "WP REST API Integration v3"</li>
                  <li>Click "Save webhook"</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">3. Product Setup</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Add custom fields to your astrology chart products to collect birth data:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>birth_date (Date field)</li>
                  <li>birth_time (Time field)</li>
                  <li>birth_location (Text field)</li>
                  <li>birth_latitude (Number field - hidden/calculated)</li>
                  <li>birth_longitude (Number field - hidden/calculated)</li>
                  <li>birth_timezone (Text field - hidden/calculated)</li>
                  <li>chart_notes (Textarea field - optional)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">4. Required Plugins</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  You may need these plugins to add custom fields:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>WooCommerce Product Add-Ons</li>
                  <li>Advanced Custom Fields (ACF)</li>
                  <li>Or custom development for order meta data</li>
                </ul>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Important:</strong> This integration requires a backend server to properly receive and 
                  validate webhooks from WooCommerce. The webhook URL shown is for demonstration purposes. 
                  For production use, implement a server endpoint that can receive POST requests, validate the webhook 
                  signature, and forward the data to this application.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
