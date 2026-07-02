import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { EnvelopeSimple, Check, X, Bell, BellSlash } from '@phosphor-icons/react'
import { useKV } from '@/hooks/use-kv'

export interface EmailNotificationSettings {
  enabled: boolean
  recipientEmails: string[]
  notifyOnSuccess: boolean
  notifyOnFailure: boolean
  includePostPreview: boolean
}

interface EmailNotificationSettingsProps {
  onSave?: (settings: EmailNotificationSettings) => void
}

export function EmailNotificationSettings({ onSave }: EmailNotificationSettingsProps) {
  const [settings, setSettings] = useKV<EmailNotificationSettings>('email-notification-settings', {
    enabled: false,
    recipientEmails: [],
    notifyOnSuccess: true,
    notifyOnFailure: true,
    includePostPreview: true,
  })
  
  const [emailInput, setEmailInput] = useState('')
  const [isValidEmail, setIsValidEmail] = useState(false)

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    setIsValidEmail(emailRegex.test(emailInput))
  }, [emailInput])

  const handleAddEmail = () => {
    if (!isValidEmail) {
      toast.error('Please enter a valid email address')
      return
    }

    if (!settings) return

    if (settings.recipientEmails.includes(emailInput)) {
      toast.error('This email is already in the list')
      return
    }

    setSettings((current) => ({
      enabled: current?.enabled ?? false,
      notifyOnSuccess: current?.notifyOnSuccess ?? true,
      notifyOnFailure: current?.notifyOnFailure ?? true,
      includePostPreview: current?.includePostPreview ?? true,
      recipientEmails: [...(current?.recipientEmails ?? []), emailInput],
    }))

    setEmailInput('')
    toast.success('Email added to notification list')
  }

  const handleRemoveEmail = (email: string) => {
    setSettings((current) => ({
      enabled: current?.enabled ?? false,
      notifyOnSuccess: current?.notifyOnSuccess ?? true,
      notifyOnFailure: current?.notifyOnFailure ?? true,
      includePostPreview: current?.includePostPreview ?? true,
      recipientEmails: (current?.recipientEmails ?? []).filter(e => e !== email),
    }))
    toast.success('Email removed from notification list')
  }

  const handleToggleSetting = (key: keyof EmailNotificationSettings, value: boolean) => {
    setSettings((current) => ({
      enabled: current?.enabled ?? false,
      notifyOnSuccess: current?.notifyOnSuccess ?? true,
      notifyOnFailure: current?.notifyOnFailure ?? true,
      includePostPreview: current?.includePostPreview ?? true,
      recipientEmails: current?.recipientEmails ?? [],
      [key]: value,
    }))
  }

  const handleSaveSettings = () => {
    if (!settings) return

    if (settings.enabled && settings.recipientEmails.length === 0) {
      toast.error('Please add at least one email address to enable notifications')
      return
    }

    onSave?.(settings)
    toast.success('Email notification settings saved!')
  }

  return (
    <Card className="border-accent/20">
      <CardHeader>
        <CardTitle className="text-xl text-white flex items-center gap-2">
          <EnvelopeSimple weight="bold" className="text-accent" />
          Email Notifications
        </CardTitle>
        <CardDescription className="text-white/70">
          Get notified when scheduled posts are published
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border">
          <div className="flex items-center gap-3">
            {settings?.enabled ? (
              <Bell weight="fill" className="text-accent" size={20} />
            ) : (
              <BellSlash weight="fill" className="text-muted-foreground" size={20} />
            )}
            <div>
              <Label htmlFor="enable-notifications" className="text-white cursor-pointer">
                Enable Email Notifications
              </Label>
              <p className="text-xs text-white/60 mt-0.5">
                Receive emails when scheduled posts are published
              </p>
            </div>
          </div>
          <Switch
            id="enable-notifications"
            checked={settings?.enabled ?? false}
            onCheckedChange={(checked) => handleToggleSetting('enabled', checked)}
          />
        </div>

        {settings?.enabled && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-input" className="text-white">
                  Add Email Recipients
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="email-input"
                    type="email"
                    placeholder="email@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddEmail()
                      }
                    }}
                    className="bg-background text-white border-border"
                  />
                  <Button
                    onClick={handleAddEmail}
                    disabled={!isValidEmail}
                    variant="outline"
                  >
                    <Check weight="bold" className="mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              {(settings?.recipientEmails?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <Label className="text-white">Email Recipients ({settings?.recipientEmails?.length ?? 0})</Label>
                  <div className="flex flex-wrap gap-2">
                    {settings?.recipientEmails?.map((email) => (
                      <Badge
                        key={email}
                        variant="outline"
                        className="bg-accent/20 text-accent border-accent/30 pr-1 pl-3 py-1.5 text-sm"
                      >
                        {email}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEmail(email)}
                          className="h-5 w-5 p-0 ml-2 hover:bg-accent/20"
                        >
                          <X weight="bold" size={14} />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2 border-t border-border/50">
              <Label className="text-white">Notification Preferences</Label>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                <div>
                  <Label htmlFor="notify-success" className="text-white cursor-pointer">
                    Notify on successful publication
                  </Label>
                  <p className="text-xs text-white/60 mt-0.5">
                    Get notified when posts publish successfully
                  </p>
                </div>
                <Switch
                  id="notify-success"
                  checked={settings?.notifyOnSuccess ?? true}
                  onCheckedChange={(checked) => handleToggleSetting('notifyOnSuccess', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                <div>
                  <Label htmlFor="notify-failure" className="text-white cursor-pointer">
                    Notify on publication failure
                  </Label>
                  <p className="text-xs text-white/60 mt-0.5">
                    Get alerted when posts fail to publish
                  </p>
                </div>
                <Switch
                  id="notify-failure"
                  checked={settings?.notifyOnFailure ?? true}
                  onCheckedChange={(checked) => handleToggleSetting('notifyOnFailure', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                <div>
                  <Label htmlFor="include-preview" className="text-white cursor-pointer">
                    Include post preview in email
                  </Label>
                  <p className="text-xs text-white/60 mt-0.5">
                    Show a snippet of the post content
                  </p>
                </div>
                <Switch
                  id="include-preview"
                  checked={settings?.includePostPreview ?? true}
                  onCheckedChange={(checked) => handleToggleSetting('includePostPreview', checked)}
                />
              </div>
            </div>
          </>
        )}

        <div className="pt-2">
          <Button onClick={handleSaveSettings} className="w-full">
            <Check className="mr-2" weight="bold" />
            Save Notification Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
