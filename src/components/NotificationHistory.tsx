import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, EnvelopeSimple, Clock } from '@phosphor-icons/react'
import type { NotificationHistoryEntry } from '@/lib/email-notifications'

interface NotificationHistoryProps {
  history: NotificationHistoryEntry[]
}

export function NotificationHistory({ history }: NotificationHistoryProps) {
  if (history.length === 0) {
    return (
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Clock weight="bold" className="text-accent" />
            Notification History
          </CardTitle>
          <CardDescription className="text-white/70">
            Email notification delivery history
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <EnvelopeSimple weight="bold" className="text-muted-foreground mx-auto mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No Notifications Sent Yet</h3>
          <p className="text-white/70">
            When scheduled posts are published, email notifications will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-accent/20">
      <CardHeader>
        <CardTitle className="text-xl text-white flex items-center gap-2">
          <Clock weight="bold" className="text-accent" />
          Notification History
        </CardTitle>
        <CardDescription className="text-white/70">
          {history.length} email notification{history.length !== 1 ? 's' : ''} sent
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.map((entry) => (
            <div
              key={entry.id}
              className={`p-4 rounded-lg border transition-colors ${
                entry.success
                  ? 'bg-green-500/5 border-green-500/30 hover:border-green-500/50'
                  : 'bg-destructive/5 border-destructive/30 hover:border-destructive/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {entry.success ? (
                      <CheckCircle weight="bold" className="text-green-400" size={20} />
                    ) : (
                      <XCircle weight="bold" className="text-destructive" size={20} />
                    )}
                    <h4 className="font-semibold text-white">{entry.postTitle}</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <EnvelopeSimple weight="bold" className="text-muted-foreground" size={14} />
                      <span className="text-sm text-white/70">
                        Sent to {entry.recipientEmails.length} recipient{entry.recipientEmails.length !== 1 ? 's' : ''}:
                      </span>
                      {entry.recipientEmails.map((email, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="bg-accent/10 text-accent border-accent/30 text-xs"
                        >
                          {email}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>

                    {!entry.success && entry.errorMessage && (
                      <div className="mt-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
                        <strong>Publication Error:</strong> {entry.errorMessage}
                      </div>
                    )}
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={
                    entry.success
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-destructive/20 text-destructive border-destructive/30'
                  }
                >
                  {entry.success ? 'Success' : 'Failed'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
