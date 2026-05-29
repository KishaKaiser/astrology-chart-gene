import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Copy, Download, PencilSimple, GearSix, Upload, Check, Clock, Calendar, Trash } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useKV } from '@github/spark/hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

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
}

interface WordPressSettings {
  siteUrl: string
  username: string
  applicationPassword: string
}

const TRANSIT_TYPES = [
  { value: 'mercury-retrograde', label: 'Mercury Retrograde', description: 'Communication, technology, and travel disruptions' },
  { value: 'venus-retrograde', label: 'Venus Retrograde', description: 'Love, relationships, and values review' },
  { value: 'mars-retrograde', label: 'Mars Retrograde', description: 'Energy, motivation, and action reassessment' },
  { value: 'jupiter-transit', label: 'Jupiter Transit', description: 'Growth, expansion, and opportunities' },
  { value: 'saturn-transit', label: 'Saturn Transit', description: 'Responsibility, structure, and life lessons' },
  { value: 'uranus-transit', label: 'Uranus Transit', description: 'Change, innovation, and breakthroughs' },
  { value: 'neptune-transit', label: 'Neptune Transit', description: 'Dreams, spirituality, and illusions' },
  { value: 'pluto-transit', label: 'Pluto Transit', description: 'Transformation, power, and deep change' },
  { value: 'solar-eclipse', label: 'Solar Eclipse', description: 'New beginnings and powerful initiations' },
  { value: 'lunar-eclipse', label: 'Lunar Eclipse', description: 'Endings, revelations, and emotional releases' },
  { value: 'new-moon', label: 'New Moon', description: 'Fresh starts and setting intentions' },
  { value: 'full-moon', label: 'Full Moon', description: 'Culmination, completion, and illumination' },
]

export function BlogPostGenerator() {
  const [savedPosts, setSavedPosts] = useKV<BlogPost[]>('blog-posts', [])
  const [wpSettings, setWpSettings] = useKV<WordPressSettings | null>('wordpress-settings', null)
  const [selectedTransit, setSelectedTransit] = useState<string>('')
  const [additionalContext, setAdditionalContext] = useState<string>('')
  const [generatedPost, setGeneratedPost] = useState<{ title: string; content: string } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [publishAsDraft, setPublishAsDraft] = useState(true)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [currentTime, setCurrentTime] = useState(Date.now())
  
  const [tempSiteUrl, setTempSiteUrl] = useState(wpSettings?.siteUrl || '')
  const [tempUsername, setTempUsername] = useState(wpSettings?.username || '')
  const [tempPassword, setTempPassword] = useState(wpSettings?.applicationPassword || '')

  const handleGenerate = async () => {
    if (!selectedTransit) {
      toast.error('Please select a transit type')
      return
    }

    setIsGenerating(true)
    setGeneratedPost(null)

    try {
      const transitInfo = TRANSIT_TYPES.find(t => t.value === selectedTransit)
      
      const prompt = (window.spark.llmPrompt as any)`You are an expert astrologer writing an engaging blog post for a general audience interested in astrology.

Write a comprehensive, informative blog post about ${transitInfo?.label}.

Context: ${transitInfo?.description}
${additionalContext ? `Additional focus areas: ${additionalContext}` : ''}

The blog post should include:
1. An engaging introduction explaining what ${transitInfo?.label} is
2. Key effects and themes people might experience
3. What to expect during this transit
4. Practical advice and tips for navigating this period
5. Do's and don'ts during this transit
6. A positive, empowering conclusion

Write in an accessible, warm tone that balances astrological knowledge with practical wisdom. Use specific examples where helpful.

Return the result as a valid JSON object with this exact structure:
{
  "title": "An engaging, SEO-friendly blog post title",
  "content": "The full blog post content with paragraphs separated by double line breaks (\\n\\n). Use markdown formatting for emphasis."
}`

      const response = await window.spark.llm(prompt, 'gpt-4o', true)
      const parsed = JSON.parse(response)

      if (!parsed.title || !parsed.content) {
        throw new Error('Invalid response structure')
      }

      setGeneratedPost(parsed)
      setEditedTitle(parsed.title)
      setEditedContent(parsed.content)
      toast.success('Blog post generated successfully!')
    } catch (error) {
      console.error('Blog post generation error:', error)
      toast.error('Failed to generate blog post. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = () => {
    if (!generatedPost) return

    const finalTitle = editMode ? editedTitle : generatedPost.title
    const finalContent = editMode ? editedContent : generatedPost.content

    const newPost: BlogPost = {
      id: Date.now().toString(),
      title: finalTitle,
      content: finalContent,
      transitType: selectedTransit,
      createdAt: Date.now(),
    }

    setSavedPosts((current) => [newPost, ...(current || [])])
    toast.success('Blog post saved!')
    setEditMode(false)
  }

  const handleSaveSettings = () => {
    const cleanUrl = tempSiteUrl.trim().replace(/\/$/, '')
    
    if (!cleanUrl || !tempUsername || !tempPassword) {
      toast.error('Please fill in all WordPress settings')
      return
    }

    setWpSettings({
      siteUrl: cleanUrl,
      username: tempUsername,
      applicationPassword: tempPassword,
    })
    
    toast.success('WordPress settings saved!')
    setSettingsOpen(false)
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 30000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!wpSettings || !savedPosts) return

    const checkScheduledPosts = async () => {
      const postsToPublish = savedPosts.filter(
        post => post.publishStatus === 'scheduled' && 
        post.scheduledFor && 
        post.scheduledFor <= currentTime
      )

      for (const post of postsToPublish) {
        await publishScheduledPost(post)
      }
    }

    checkScheduledPosts()
  }, [currentTime, savedPosts, wpSettings])

  const publishScheduledPost = async (post: BlogPost) => {
    if (!wpSettings) return

    try {
      const credentials = btoa(`${wpSettings.username}:${wpSettings.applicationPassword}`)
      const htmlContent = convertMarkdownToHTML(post.content)

      const response = await fetch(`${wpSettings.siteUrl}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          title: post.title,
          content: htmlContent,
          status: 'publish',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()

      setSavedPosts((current) =>
        (current || []).map(p =>
          p.id === post.id
            ? {
                ...p,
                publishStatus: 'published' as const,
                wordpressId: data.id,
                publishedUrl: data.link,
              }
            : p
        )
      )

      toast.success(`"${post.title}" published successfully!`, {
        description: 'Scheduled post went live',
        action: data.link ? {
          label: 'View Post',
          onClick: () => window.open(data.link, '_blank'),
        } : undefined,
      })
    } catch (error) {
      console.error('Scheduled publish error:', error)
      
      setSavedPosts((current) =>
        (current || []).map(p =>
          p.id === post.id
            ? {
                ...p,
                publishStatus: 'failed' as const,
                publishError: error instanceof Error ? error.message : 'Unknown error',
              }
            : p
        )
      )

      toast.error(`Failed to publish scheduled post: "${post.title}"`, {
        description: 'Check WordPress settings and try again',
      })
    }
  }

  const handleSchedulePost = () => {
    if (!scheduleDate || !scheduleTime) {
      toast.error('Please select both date and time')
      return
    }

    if (!generatedPost) return

    const finalTitle = editMode ? editedTitle : generatedPost.title
    const finalContent = editMode ? editedContent : generatedPost.content

    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`)
    const scheduledTimestamp = scheduledDateTime.getTime()

    if (scheduledTimestamp <= Date.now()) {
      toast.error('Scheduled time must be in the future')
      return
    }

    const newPost: BlogPost = {
      id: Date.now().toString(),
      title: finalTitle,
      content: finalContent,
      transitType: selectedTransit,
      createdAt: Date.now(),
      scheduledFor: scheduledTimestamp,
      publishStatus: 'scheduled',
    }

    setSavedPosts((current) => [newPost, ...(current || [])])
    
    toast.success('Post scheduled successfully!', {
      description: `Will publish on ${scheduledDateTime.toLocaleString()}`,
    })
    
    setScheduleDialogOpen(false)
    setScheduleDate('')
    setScheduleTime('')
    setEditMode(false)
  }

  const handleCancelSchedule = (postId: string) => {
    setSavedPosts((current) =>
      (current || []).map(p =>
        p.id === postId
          ? { ...p, publishStatus: 'draft' as const, scheduledFor: undefined }
          : p
      )
    )
    toast.success('Scheduled post cancelled')
  }

  const handleRetryFailed = async (post: BlogPost) => {
    if (!wpSettings) return

    setSavedPosts((current) =>
      (current || []).map(p =>
        p.id === post.id
          ? { ...p, publishStatus: 'scheduled' as const, scheduledFor: Date.now() + 5000, publishError: undefined }
          : p
      )
    )
    
    toast.info('Retrying post publication...')
  }

  const convertMarkdownToHTML = (markdown: string): string => {
    let html = markdown
    
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
    html = html.replace(/\n\n/g, '</p><p>')
    html = `<p>${html}</p>`
    
    return html
  }

  const handlePublishToWordPress = async () => {
    if (!wpSettings) {
      toast.error('Please configure WordPress settings first')
      setSettingsOpen(true)
      return
    }

    if (!generatedPost) return

    const finalTitle = editMode ? editedTitle : generatedPost.title
    const finalContent = editMode ? editedContent : generatedPost.content

    setIsPublishing(true)

    try {
      const credentials = btoa(`${wpSettings.username}:${wpSettings.applicationPassword}`)
      const htmlContent = convertMarkdownToHTML(finalContent)

      const response = await fetch(`${wpSettings.siteUrl}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          title: finalTitle,
          content: htmlContent,
          status: publishAsDraft ? 'draft' : 'publish',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      const updatedPost: BlogPost = {
        id: Date.now().toString(),
        title: finalTitle,
        content: finalContent,
        transitType: selectedTransit,
        createdAt: Date.now(),
        wordpressId: data.id,
        publishedUrl: data.link,
      }

      setSavedPosts((current) => [updatedPost, ...(current || [])])
      
      toast.success(
        publishAsDraft 
          ? 'Blog post saved as draft in WordPress!' 
          : 'Blog post published to WordPress!',
        {
          description: data.link ? 'Click to view' : undefined,
          action: data.link ? {
            label: 'View Post',
            onClick: () => window.open(data.link, '_blank'),
          } : undefined,
        }
      )
    } catch (error) {
      console.error('WordPress publish error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to publish to WordPress: ${errorMessage}`, {
        description: 'Check your WordPress settings and permissions',
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleCopy = () => {
    if (!generatedPost) return

    const finalTitle = editMode ? editedTitle : generatedPost.title
    const finalContent = editMode ? editedContent : generatedPost.content
    const fullText = `${finalTitle}\n\n${finalContent}`

    navigator.clipboard.writeText(fullText)
    toast.success('Blog post copied to clipboard!')
  }

  const handleDownload = () => {
    if (!generatedPost) return

    const finalTitle = editMode ? editedTitle : generatedPost.title
    const finalContent = editMode ? editedContent : generatedPost.content
    const fullText = `${finalTitle}\n\n${finalContent}`

    const blob = new Blob([fullText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Blog post downloaded!')
  }

  const handleDeletePost = (postId: string) => {
    setSavedPosts((current) => (current || []).filter(p => p.id !== postId))
    toast.success('Blog post deleted')
  }

  const handleLoadPost = (post: BlogPost) => {
    setGeneratedPost({ title: post.title, content: post.content })
    setEditedTitle(post.title)
    setEditedContent(post.content)
    setSelectedTransit(post.transitType)
    setEditMode(false)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Blog Post Generator</h2>
            <p className="text-white/70 mt-1">
              Generate engaging blog posts about astrological transits
            </p>
          </div>
          
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <GearSix className="mr-2" weight="bold" />
                WordPress Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-white">
              <DialogHeader>
                <DialogTitle className="text-white">WordPress Connection Settings</DialogTitle>
                <DialogDescription className="text-white/70">
                  Configure your WordPress site details to publish blog posts directly
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="wp-site-url" className="text-white">WordPress Site URL</Label>
                  <Input
                    id="wp-site-url"
                    type="url"
                    placeholder="https://yoursite.com"
                    value={tempSiteUrl}
                    onChange={(e) => setTempSiteUrl(e.target.value)}
                    className="bg-background text-white border-border"
                  />
                  <p className="text-xs text-white/60">
                    Your WordPress site URL (without trailing slash)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wp-username" className="text-white">Username</Label>
                  <Input
                    id="wp-username"
                    type="text"
                    placeholder="admin"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    className="bg-background text-white border-border"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wp-password" className="text-white">Application Password</Label>
                  <Input
                    id="wp-password"
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="bg-background text-white border-border font-mono"
                  />
                  <p className="text-xs text-white/60">
                    Generate an application password in WordPress: Users → Profile → Application Passwords
                  </p>
                </div>
                
                <div className="pt-2">
                  <Button onClick={handleSaveSettings} className="w-full">
                    <Check className="mr-2" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {savedPosts && savedPosts.some(p => p.publishStatus === 'scheduled') && (
          <Card className="border-accent/30 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Clock weight="bold" className="text-accent" />
                Scheduled Posts
              </CardTitle>
              <CardDescription className="text-white/70">
                Posts queued for automatic publishing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedPosts
                  .filter(p => p.publishStatus === 'scheduled')
                  .sort((a, b) => (a.scheduledFor || 0) - (b.scheduledFor || 0))
                  .map((post) => {
                    const transitInfo = TRANSIT_TYPES.find(t => t.value === post.transitType)
                    const timeUntil = post.scheduledFor ? post.scheduledFor - currentTime : 0
                    const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60))
                    const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60))
                    
                    return (
                      <div
                        key={post.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-accent/30"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{post.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {transitInfo?.label} • Publishes {new Date(post.scheduledFor!).toLocaleString()}
                          </p>
                          <p className="text-xs text-accent mt-1">
                            {timeUntil > 0 ? `Publishing in ${hoursUntil}h ${minutesUntil}m` : 'Publishing soon...'}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelSchedule(post.id)}
                          className="text-white/70 hover:text-white"
                        >
                          Cancel
                        </Button>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Generate New Post</CardTitle>
            <CardDescription className="text-white/70">
              Select a transit type and generate engaging content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="transit-type" className="text-white">Transit Type</Label>
              <Select value={selectedTransit} onValueChange={setSelectedTransit}>
                <SelectTrigger id="transit-type" className="bg-card text-white border-border">
                  <SelectValue placeholder="Select a transit..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {TRANSIT_TYPES.map((transit) => (
                    <SelectItem key={transit.value} value={transit.value} className="text-white">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{transit.label}</span>
                        <span className="text-xs text-muted-foreground">{transit.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional-context" className="text-white">
                Additional Context (Optional)
              </Label>
              <Textarea
                id="additional-context"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Add any specific themes, zodiac signs, or focus areas you'd like emphasized..."
                className="min-h-[100px] bg-card text-white border-border"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedTransit}
              className="w-full"
            >
              {isGenerating ? 'Generating...' : 'Generate Blog Post'}
            </Button>
          </CardContent>
        </Card>

        {generatedPost && (
          <Card className="border-accent/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-white">Generated Post</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditMode(!editMode)
                      if (!editMode) {
                        setEditedTitle(generatedPost.title)
                        setEditedContent(generatedPost.content)
                      }
                    }}
                  >
                    <PencilSimple className="mr-2" />
                    {editMode ? 'Cancel Edit' : 'Edit'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSave}>
                    Save Post
                  </Button>
                  {wpSettings && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={handlePublishToWordPress}
                        disabled={isPublishing}
                        className="bg-accent hover:bg-accent/90"
                      >
                        <Upload className="mr-2" />
                        {isPublishing ? 'Publishing...' : 'Publish Now'}
                      </Button>
                      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Clock className="mr-2" weight="bold" />
                            Schedule
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border text-white">
                          <DialogHeader>
                            <DialogTitle className="text-white">Schedule Post</DialogTitle>
                            <DialogDescription className="text-white/70">
                              Choose when to automatically publish this post to WordPress
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="schedule-date" className="text-white">Date</Label>
                              <Input
                                id="schedule-date"
                                type="date"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                className="bg-background text-white border-border"
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="schedule-time" className="text-white">Time</Label>
                              <Input
                                id="schedule-time"
                                type="time"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className="bg-background text-white border-border"
                              />
                            </div>
                            
                            <div className="pt-2">
                              <Button onClick={handleSchedulePost} className="w-full">
                                <Calendar className="mr-2" />
                                Schedule Post
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
              </div>
              {wpSettings && (
                <div className="flex items-center gap-2 mt-4">
                  <Switch
                    id="publish-draft"
                    checked={publishAsDraft}
                    onCheckedChange={setPublishAsDraft}
                  />
                  <Label htmlFor="publish-draft" className="text-white cursor-pointer">
                    Publish as draft for immediate publishing (not used for scheduled posts)
                  </Label>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {editMode ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-title" className="text-white">Title</Label>
                    <Input
                      id="edit-title"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="bg-card text-white border-border text-lg font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-content" className="text-white">Content</Label>
                    <Textarea
                      id="edit-content"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="min-h-[400px] bg-card text-white border-border font-mono text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-white">{generatedPost.title}</h3>
                  <div className="prose prose-invert max-w-none">
                    {generatedPost.content.split('\n\n').map((paragraph, idx) => (
                      <p key={idx} className="text-white/90 leading-relaxed mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {savedPosts && savedPosts.length > 0 && (
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-white">Saved Blog Posts</CardTitle>
              <CardDescription className="text-white/70">
                {savedPosts.length} saved post{savedPosts.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedPosts.map((post) => {
                  const transitInfo = TRANSIT_TYPES.find(t => t.value === post.transitType)
                  const isScheduled = post.publishStatus === 'scheduled'
                  const isPublished = post.publishStatus === 'published'
                  const isFailed = post.publishStatus === 'failed'
                  
                  return (
                    <div
                      key={post.id}
                      className="flex items-start justify-between p-4 rounded-lg bg-card/50 border border-border hover:border-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleLoadPost(post)}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-white truncate">{post.title}</h4>
                          {isScheduled && post.scheduledFor && (
                            <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
                              <Clock className="mr-1" size={12} weight="bold" />
                              Scheduled: {new Date(post.scheduledFor).toLocaleString()}
                            </Badge>
                          )}
                          {isPublished && post.wordpressId && (
                            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                              <Check className="mr-1" size={12} weight="bold" />
                              Published
                            </Badge>
                          )}
                          {isFailed && (
                            <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">
                              Failed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {transitInfo?.label} • {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                        {post.publishedUrl && (
                          <a
                            href={post.publishedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:underline mt-1 inline-block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View on WordPress →
                          </a>
                        )}
                        {isFailed && post.publishError && (
                          <p className="text-xs text-destructive mt-1">
                            Error: {post.publishError}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {isScheduled && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelSchedule(post.id)}
                            className="text-white/70 hover:text-white"
                          >
                            Cancel Schedule
                          </Button>
                        )}
                        {isFailed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetryFailed(post)}
                            className="text-accent hover:bg-accent/10"
                          >
                            Retry
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash weight="bold" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
