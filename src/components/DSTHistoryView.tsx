import { getDSTRuleChanges } from '@/lib/dst-historical-rules'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { CalendarBlank, Clock } from '@phosphor-icons/react'

interface DSTHistoryViewProps {
  timezone: string
  timezoneName: string
}

export function DSTHistoryView({ timezone, timezoneName }: DSTHistoryViewProps) {
  const ruleChanges = getDSTRuleChanges(timezone)

  if (ruleChanges.length === 0) {
    return (
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock weight="bold" className="text-accent" />
            DST Rule History
          </CardTitle>
          <CardDescription>
            No historical DST rule information available for {timezoneName}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock weight="bold" className="text-accent" />
          DST Rule History
        </CardTitle>
        <CardDescription>
          Historical daylight saving time changes for {timezoneName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {ruleChanges.map((change, index) => (
              <div
                key={index}
                className="relative pl-8 pb-4 border-l-2 border-accent/30 last:border-l-0 last:pb-0"
              >
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-accent border-2 border-background" />
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs border-accent/50 text-accent">
                      <CalendarBlank weight="bold" size={12} className="mr-1" />
                      {change.year}
                    </Badge>
                    {index === 0 && (
                      <Badge className="text-xs bg-accent/20 text-accent border-accent/50">
                        Current
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-foreground leading-relaxed">
                    {change.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
