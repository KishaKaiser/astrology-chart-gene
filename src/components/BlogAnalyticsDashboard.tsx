import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { 
  ChartBar, 
  TrendUp, 
  CalendarCheck, 
  CheckCircle, 
  XCircle, 
  Clock,
  Article,
  CalendarBlank,
  Lightning
} from '@phosphor-icons/react'

interface BlogPost {
  id: string
  title: string
  content: string
  transitType: string
  createdAt: number
  wordpressId?: number
  publishedUrl?: string
  scheduledFor?: number
  publishStatus?: 'draft' | 'published' | 'scheduled' | 'failed'
  publishError?: string
  fromRecurring?: string
}

interface RecurringSchedule {
  id: string
  transitType: string
  frequency: 'weekly' | 'monthly'
  dayOfWeek?: number
  dayOfMonth?: number
  time: string
  isActive: boolean
  additionalContext?: string
  createdAt: number
  lastGeneratedAt?: number
  nextScheduledAt?: number
}

interface BlogAnalyticsDashboardProps {
  posts: BlogPost[]
  schedules: RecurringSchedule[]
}

const TRANSIT_TYPES = [
  { value: 'mercury-retrograde', label: 'Mercury Retrograde' },
  { value: 'venus-retrograde', label: 'Venus Retrograde' },
  { value: 'mars-retrograde', label: 'Mars Retrograde' },
  { value: 'jupiter-transit', label: 'Jupiter Transit' },
  { value: 'saturn-transit', label: 'Saturn Transit' },
  { value: 'uranus-transit', label: 'Uranus Transit' },
  { value: 'neptune-transit', label: 'Neptune Transit' },
  { value: 'pluto-transit', label: 'Pluto Transit' },
  { value: 'solar-eclipse', label: 'Solar Eclipse' },
  { value: 'lunar-eclipse', label: 'Lunar Eclipse' },
  { value: 'new-moon', label: 'New Moon' },
  { value: 'full-moon', label: 'Full Moon' },
]

export function BlogAnalyticsDashboard({ posts, schedules }: BlogAnalyticsDashboardProps) {
  const analytics = useMemo(() => {
    const totalPosts = posts.length
    const publishedPosts = posts.filter(p => p.publishStatus === 'published').length
    const scheduledPosts = posts.filter(p => p.publishStatus === 'scheduled').length
    const failedPosts = posts.filter(p => p.publishStatus === 'failed').length
    const draftPosts = posts.filter(p => !p.publishStatus || p.publishStatus === 'draft').length

    const successRate = totalPosts > 0 ? (publishedPosts / totalPosts) * 100 : 0
    const failureRate = totalPosts > 0 ? (failedPosts / totalPosts) * 100 : 0

    const activeSchedules = schedules.filter(s => s.isActive).length
    const totalSchedules = schedules.length

    const recurringPosts = posts.filter(p => p.fromRecurring).length

    const now = Date.now()
    const last30Days = now - (30 * 24 * 60 * 60 * 1000)
    const last7Days = now - (7 * 24 * 60 * 60 * 1000)

    const postsLast30Days = posts.filter(p => p.createdAt >= last30Days).length
    const postsLast7Days = posts.filter(p => p.createdAt >= last7Days).length
    const publishedLast30Days = posts.filter(
      p => p.publishStatus === 'published' && p.createdAt >= last30Days
    ).length
    const publishedLast7Days = posts.filter(
      p => p.publishStatus === 'published' && p.createdAt >= last7Days
    ).length

    const transitBreakdown = TRANSIT_TYPES.map(transit => {
      const transitPosts = posts.filter(p => p.transitType === transit.value)
      const published = transitPosts.filter(p => p.publishStatus === 'published').length
      return {
        transit: transit.label,
        total: transitPosts.length,
        published,
        percentage: transitPosts.length > 0 ? (published / transitPosts.length) * 100 : 0,
      }
    }).filter(t => t.total > 0).sort((a, b) => b.total - a.total)

    const upcomingScheduled = posts
      .filter(p => p.publishStatus === 'scheduled' && p.scheduledFor && p.scheduledFor > now)
      .sort((a, b) => (a.scheduledFor || 0) - (b.scheduledFor || 0))
      .slice(0, 5)

    const recentlyPublished = posts
      .filter(p => p.publishStatus === 'published')
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)

    const postsPerMonth = posts.reduce((acc, post) => {
      const date = new Date(post.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      acc[monthKey] = (acc[monthKey] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const monthlyData = Object.entries(postsPerMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => {
        const [year, monthNum] = month.split('-')
        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'short' })
        return { month: `${monthName} ${year.slice(2)}`, count }
      })

    return {
      totalPosts,
      publishedPosts,
      scheduledPosts,
      failedPosts,
      draftPosts,
      successRate,
      failureRate,
      activeSchedules,
      totalSchedules,
      recurringPosts,
      postsLast30Days,
      postsLast7Days,
      publishedLast30Days,
      publishedLast7Days,
      transitBreakdown,
      upcomingScheduled,
      recentlyPublished,
      monthlyData,
    }
  }, [posts, schedules])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h2 className="text-3xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-white/70 mt-1">
            Track your blog post performance and scheduling insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-accent/20 bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                  <p className="text-3xl font-bold text-white mt-1">{analytics.totalPosts}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.postsLast30Days} in last 30 days
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Article weight="bold" className="text-accent" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="text-3xl font-bold text-green-400 mt-1">{analytics.publishedPosts}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.successRate.toFixed(0)}% success rate
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle weight="bold" className="text-green-400" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="text-3xl font-bold text-accent mt-1">{analytics.scheduledPosts}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.activeSchedules} active schedules
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Clock weight="bold" className="text-accent" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-3xl font-bold text-destructive mt-1">{analytics.failedPosts}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.failureRate.toFixed(0)}% failure rate
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                  <XCircle weight="bold" className="text-destructive" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <TrendUp weight="bold" className="text-accent" />
                Recent Activity
              </CardTitle>
              <CardDescription className="text-white/70">
                Last 30 days performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                  <span className="text-sm text-white/70">Posts Created (7 days)</span>
                  <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
                    {analytics.postsLast7Days}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                  <span className="text-sm text-white/70">Posts Created (30 days)</span>
                  <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
                    {analytics.postsLast30Days}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                  <span className="text-sm text-white/70">Published (7 days)</span>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                    {analytics.publishedLast7Days}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                  <span className="text-sm text-white/70">Published (30 days)</span>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                    {analytics.publishedLast30Days}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                  <span className="text-sm text-white/70">From Recurring Schedules</span>
                  <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
                    {analytics.recurringPosts}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Lightning weight="fill" className="text-accent" />
                Recurring Schedules
              </CardTitle>
              <CardDescription className="text-white/70">
                Automated content generation status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                  <p className="text-2xl font-bold text-accent">{analytics.activeSchedules}</p>
                  <p className="text-sm text-white/70 mt-1">Active Schedules</p>
                </div>
                <div className="p-4 rounded-lg bg-card/50 border border-border">
                  <p className="text-2xl font-bold text-white">{analytics.totalSchedules}</p>
                  <p className="text-sm text-white/70 mt-1">Total Schedules</p>
                </div>
              </div>
              {analytics.totalSchedules > 0 && (
                <div className="p-3 rounded-lg bg-card/50 border border-border">
                  <p className="text-sm text-white/70 mb-2">Schedule Status</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-500"
                        style={{ width: `${(analytics.activeSchedules / analytics.totalSchedules) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-white font-medium">
                      {((analytics.activeSchedules / analytics.totalSchedules) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {analytics.recurringPosts} posts generated from recurring schedules
              </p>
            </CardContent>
          </Card>
        </div>

        {analytics.transitBreakdown.length > 0 && (
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <ChartBar weight="bold" className="text-accent" />
                Content by Transit Type
              </CardTitle>
              <CardDescription className="text-white/70">
                Post distribution and success rates by topic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.transitBreakdown.map((transit, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{transit.transit}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {transit.published}/{transit.total} published
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            transit.percentage >= 75
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : transit.percentage >= 50
                              ? 'bg-accent/20 text-accent border-accent/30'
                              : 'bg-muted/20 text-muted-foreground border-muted/30'
                          }
                        >
                          {transit.percentage.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-accent/60 transition-all duration-500"
                          style={{ width: `${(transit.total / analytics.totalPosts) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground min-w-[3rem] text-right">
                        {transit.total} posts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {analytics.monthlyData.length > 0 && (
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <CalendarBlank weight="bold" className="text-accent" />
                Publishing Trend
              </CardTitle>
              <CardDescription className="text-white/70">
                Posts created over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-4 h-48">
                {analytics.monthlyData.map((data, idx) => {
                  const maxCount = Math.max(...analytics.monthlyData.map(d => d.count))
                  const heightPercent = (data.count / maxCount) * 100
                  
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="relative w-full flex flex-col items-center justify-end flex-1">
                        <div className="absolute bottom-0 w-full text-center mb-2">
                          <span className="text-sm font-semibold text-white">{data.count}</span>
                        </div>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPercent}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.1 }}
                          className="w-full bg-gradient-to-t from-accent to-accent/60 rounded-t-lg min-h-[20px]"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{data.month}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analytics.upcomingScheduled.length > 0 && (
            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <CalendarCheck weight="bold" className="text-accent" />
                  Upcoming Scheduled Posts
                </CardTitle>
                <CardDescription className="text-white/70">
                  Next {analytics.upcomingScheduled.length} scheduled publications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.upcomingScheduled.map((post) => {
                    const transitInfo = TRANSIT_TYPES.find(t => t.value === post.transitType)
                    const timeUntil = post.scheduledFor ? post.scheduledFor - Date.now() : 0
                    const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60))
                    const daysUntil = Math.floor(hoursUntil / 24)
                    
                    return (
                      <div
                        key={post.id}
                        className="p-3 rounded-lg bg-card/50 border border-accent/30 hover:border-accent/50 transition-colors"
                      >
                        <h4 className="font-medium text-white text-sm truncate">{post.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {transitInfo?.label}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-white/70">
                            {new Date(post.scheduledFor!).toLocaleString()}
                          </span>
                          <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30 text-xs">
                            {daysUntil > 0 ? `${daysUntil}d` : `${hoursUntil}h`}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {analytics.recentlyPublished.length > 0 && (
            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <CheckCircle weight="bold" className="text-green-400" />
                  Recently Published
                </CardTitle>
                <CardDescription className="text-white/70">
                  Latest successful publications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.recentlyPublished.map((post) => {
                    const transitInfo = TRANSIT_TYPES.find(t => t.value === post.transitType)
                    
                    return (
                      <div
                        key={post.id}
                        className="p-3 rounded-lg bg-card/50 border border-green-500/30 hover:border-green-500/50 transition-colors"
                      >
                        <h4 className="font-medium text-white text-sm truncate">{post.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {transitInfo?.label}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-white/70">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                          {post.publishedUrl && (
                            <a
                              href={post.publishedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-accent hover:underline"
                            >
                              View →
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {analytics.totalPosts === 0 && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <ChartBar weight="bold" className="text-muted-foreground mx-auto mb-4" size={48} />
              <h3 className="text-xl font-semibold text-white mb-2">No Analytics Data Yet</h3>
              <p className="text-white/70">
                Start creating and publishing blog posts to see analytics and performance insights here.
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
