import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Copy, Download, PencilSimple, GearSix, Upload, Check, Clock, Calendar, Trash, Repeat, CalendarPlus, Play, Pause, Plus, ChartBar, Bell, Image as ImageIcon, Sparkle } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useKV } from '@/hooks/use-kv'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BlogAnalyticsDashboard } from '@/components/BlogAnalyticsDashboard'
import { EmailNotificationSettings, type EmailNotificationSettings as EmailNotificationSettingsType } from '@/components/EmailNotificationSettings'
import { NotificationHistory } from '@/components/NotificationHistory'
import { sendPublicationNotification, createNotificationHistory, type NotificationHistoryEntry } from '@/lib/email-notifications'
import { MysticalImageGeneratorEmbed } from '@/components/MysticalImageGeneratorEmbed'
import { llm, llmPrompt } from "@/lib/llm"

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
  featuredImagePrompt?: string
  featuredImageUrl?: string
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
  const [recurringSchedules, setRecurringSchedules] = useKV<RecurringSchedule[]>('recurring-schedules', [])
  const [emailSettings, setEmailSettings] = useKV<EmailNotificationSettingsType>('email-notification-settings', {
    enabled: false,
    recipientEmails: [],
    notifyOnSuccess: true,
    notifyOnFailure: true,
    includePostPreview: true,
  })
  const [notificationHistory, setNotificationHistory] = useKV<NotificationHistoryEntry[]>('notification-history', [])
  const [selectedTransit, setSelectedTransit] = useState<string>('')
  const [additionalContext, setAdditionalContext] = useState<string>('')
  const [generatedPost, setGeneratedPost] = useState<{ title: string; content: string; imagePrompt?: string } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [editedImagePrompt, setEditedImagePrompt] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('')
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [publishAsDraft, setPublishAsDraft] = useState(true)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState<'weekly' | 'monthly'>('weekly')
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState<number>(1)
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState<number>(1)
  const [recurringTime, setRecurringTime] = useState('09:00')
  const [recurringTransit, setRecurringTransit] = useState('')
  const [recurringContext, setRecurringContext] = useState('')
  const [activeView, setActiveView] = useState<'generator' | 'analytics' | 'notifications'>('generator')
  
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
      
      const promptText = llmPrompt`You are an expert astrologer writing an engaging blog post for a general audience interested in astrology.

Write a comprehensive blog post about ${transitInfo?.label || selectedTransit}.

Context: ${transitInfo?.description || 'astrological transit'}
${additionalContext ? `Additional focus areas: ${additionalContext}` : ''}

The blog post should include:
1. An engaging introduction explaining what ${transitInfo?.label || selectedTransit} is
2. Key effects and themes people might experience
3. What to expect during this transit
4. Practical advice and tips for navigating this period
5. Do's and don'ts during this transit
6. A positive, empowering conclusion

Write in an accessible, warm tone that balances astrological knowledge with practical wisdom.

IMPORTANT: Keep the content concise (around 500-800 words total) to ensure complete generation.

Also create a visual description for a featured image that captures the essence of this transit in a mystical, celestial style.

Return ONLY a valid JSON object with this EXACT structure (no additional text before or after):
{
  "title": "An engaging, SEO-friendly blog post title (one line)",
  "content": "The complete blog post content. Write 4-6 paragraphs. Separate paragraphs with TWO newline characters. Keep total length under 800 words.",
  "imagePrompt": "A detailed image generation prompt (2-3 sentences) describing a mystical, celestial scene that embodies the energy and themes of ${transitInfo?.label || selectedTransit}. Include visual elements like cosmic imagery, astrological symbols, colors, and atmosphere that match the transit's essence."
}

Ensure all quotes and special characters in the JSON are properly escaped. Do not include any text outside the JSON object.`

      const response = await llm(promptText, true)
      
      console.log('LLM Response (first 500 chars):', response.substring(0, 500))
      console.log('LLM Response (last 500 chars):', response.substring(Math.max(0, response.length - 500)))
      
      let parsed: any
      try {
        parsed = JSON.parse(response)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Response length:', response.length)
        
        const jsonMatch = response.match(/\{[\s\S]*"title"[\s\S]*"content"[\s\S]*\}/)
        if (jsonMatch) {
          console.log('Attempting to extract JSON from response...')
          parsed = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Could not parse blog post response. The response may be incomplete or incorrectly formatted. Please try again.')
        }
      }

      if (!parsed.title || !parsed.content) {
        throw new Error('Invalid response structure - missing title or content')
      }

      if (parsed.content.length < 100) {
        throw new Error('Generated content is too short. Please try again.')
      }

      setGeneratedPost(parsed)
      setEditedTitle(parsed.title)
      setEditedContent(parsed.content)
      setEditedImagePrompt(parsed.imagePrompt || '')
      setGeneratedImageUrl('')
      toast.success('Blog post generated successfully!')
    } catch (error) {
      console.error('Blog post generation error:', error)
      if (error instanceof Error) {
        const errorMsg = error.message
        if (errorMsg.includes('Unterminated string') || errorMsg.includes('JSON')) {
          toast.error('Failed to generate complete blog post. Please try again.', {
            description: 'The AI response was incomplete or improperly formatted. This usually resolves on retry.'
          })
        } else {
          toast.error(`Failed to generate blog post: ${errorMsg}`)
        }
      } else {
        toast.error('Failed to generate blog post. Please try again.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = () => {
    if (!generatedPost) return

    const finalTitle = editMode ? editedTitle : generatedPost.title
    const finalContent = editMode ? editedContent : generatedPost.content
    const finalImagePrompt = editMode ? editedImagePrompt : (generatedPost.imagePrompt || '')

    const newPost: BlogPost = {
      id: Date.now().toString(),
      title: finalTitle,
      content: finalContent,
      transitType: selectedTransit,
      createdAt: Date.now(),
      featuredImagePrompt: finalImagePrompt,
      featuredImageUrl: generatedImageUrl || undefined,
    }

    setSavedPosts((current) => [newPost, ...(current || [])])
    toast.success('Blog post saved!')
    setEditMode(false)
  }

  const handleGenerateImageDescription = async () => {
    if (!generatedPost) return
    
    const finalTitle = editMode ? editedTitle : generatedPost.title
    const finalImagePrompt = editMode ? editedImagePrompt : (generatedPost.imagePrompt || '')
    
    if (!finalImagePrompt) {
      toast.error('No image prompt available. Try regenerating the blog post.')
      return
    }

    setImageDialogOpen(true)
  }

  const handleGenerateImage = () => {
    setImageDialogOpen(true)
  }

  const handleCopyImagePrompt = () => {
    const finalImagePrompt = editMode ? editedImagePrompt : (generatedPost?.imagePrompt || '')
    
    if (!finalImagePrompt) {
      toast.error('No image prompt available')
      return
    }

    navigator.clipboard.writeText(finalImagePrompt)
    toast.success('Image prompt copied to clipboard!', {
      description: 'Use this with DALL-E, Midjourney, Stable Diffusion, or other AI image generators'
    })
  }

  const handleImageUrlSubmit = () => {
    if (generatedImageUrl) {
      toast.success('Featured image URL saved!')
      setImageDialogOpen(false)
    } else {
      toast.error('Please enter an image URL')
    }
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

  useEffect(() => {
    if (!recurringSchedules || !wpSettings) return

    const checkRecurringSchedules = async () => {
      const now = currentTime
      
      for (const schedule of recurringSchedules) {
        if (!schedule.isActive) continue
        
        if (!schedule.nextScheduledAt || schedule.nextScheduledAt <= now) {
          await generateRecurringPost(schedule)
          updateNextScheduledTime(schedule)
        }
      }
    }

    checkRecurringSchedules()
  }, [currentTime, recurringSchedules, wpSettings])

  const calculateNextScheduledTime = (schedule: RecurringSchedule): number => {
    const now = new Date()
    const [hours, minutes] = schedule.time.split(':').map(Number)
    
    if (schedule.frequency === 'weekly') {
      const nextDate = new Date(now)
      const currentDay = nextDate.getDay()
      const targetDay = schedule.dayOfWeek || 1
      
      let daysUntil = targetDay - currentDay
      if (daysUntil <= 0 || (daysUntil === 0 && (now.getHours() > hours || (now.getHours() === hours && now.getMinutes() >= minutes)))) {
        daysUntil += 7
      }
      
      nextDate.setDate(nextDate.getDate() + daysUntil)
      nextDate.setHours(hours, minutes, 0, 0)
      
      return nextDate.getTime()
    } else {
      const nextDate = new Date(now)
      const targetDay = schedule.dayOfMonth || 1
      
      if (now.getDate() > targetDay || (now.getDate() === targetDay && (now.getHours() > hours || (now.getHours() === hours && now.getMinutes() >= minutes)))) {
        nextDate.setMonth(nextDate.getMonth() + 1)
      }
      
      nextDate.setDate(Math.min(targetDay, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()))
      nextDate.setHours(hours, minutes, 0, 0)
      
      return nextDate.getTime()
    }
  }

  const updateNextScheduledTime = (schedule: RecurringSchedule) => {
    const nextTime = calculateNextScheduledTime(schedule)
    
    setRecurringSchedules((current) =>
      (current || []).map(s =>
        s.id === schedule.id
          ? { ...s, lastGeneratedAt: Date.now(), nextScheduledAt: nextTime }
          : s
      )
    )
  }

  const generateRecurringPost = async (schedule: RecurringSchedule) => {
    try {
      const transitInfo = TRANSIT_TYPES.find(t => t.value === schedule.transitType)
      
      const promptText = llmPrompt`You are an expert astrologer writing an engaging blog post for a general audience interested in astrology.

Write a comprehensive blog post about ${transitInfo?.label || schedule.transitType}.

Context: ${transitInfo?.description || 'astrological transit'}
${schedule.additionalContext ? `Additional focus areas: ${schedule.additionalContext}` : ''}

The blog post should include:
1. An engaging introduction explaining what ${transitInfo?.label || schedule.transitType} is
2. Key effects and themes people might experience
3. What to expect during this transit
4. Practical advice and tips for navigating this period
5. Do's and don'ts during this transit
6. A positive, empowering conclusion

Write in an accessible, warm tone that balances astrological knowledge with practical wisdom.

IMPORTANT: Keep the content concise (around 500-800 words total) to ensure complete generation.

Also create a visual description for a featured image that captures the essence of this transit in a mystical, celestial style.

Return ONLY a valid JSON object with this EXACT structure (no additional text before or after):
{
  "title": "An engaging, SEO-friendly blog post title (one line)",
  "content": "The complete blog post content. Write 4-6 paragraphs. Separate paragraphs with TWO newline characters. Keep total length under 800 words.",
  "imagePrompt": "A detailed image generation prompt (2-3 sentences) describing a mystical, celestial scene that embodies the energy and themes of ${transitInfo?.label || schedule.transitType}. Include visual elements like cosmic imagery, astrological symbols, colors, and atmosphere that match the transit's essence."
}

Ensure all quotes and special characters in the JSON are properly escaped. Do not include any text outside the JSON object.`

      const response = await llm(promptText, true)
      
      console.log('Recurring post LLM Response (first 500 chars):', response.substring(0, 500))
      
      let parsed: any
      try {
        parsed = JSON.parse(response)
      } catch (parseError) {
        console.error('JSON parse error for recurring post:', parseError)
        
        const jsonMatch = response.match(/\{[\s\S]*"title"[\s\S]*"content"[\s\S]*\}/)
        if (jsonMatch) {
          console.log('Attempting to extract JSON from recurring response...')
          parsed = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Could not parse blog post response. Please try again.')
        }
      }

      if (!parsed.title || !parsed.content) {
        throw new Error('Invalid response structure - missing title or content')
      }

      const publishTime = calculateNextScheduledTime(schedule)

      const newPost: BlogPost = {
        id: Date.now().toString(),
        title: parsed.title,
        content: parsed.content,
        transitType: schedule.transitType,
        createdAt: Date.now(),
        scheduledFor: publishTime,
        publishStatus: 'scheduled',
        fromRecurring: schedule.id,
        featuredImagePrompt: parsed.imagePrompt || undefined,
      }

      setSavedPosts((current) => [newPost, ...(current || [])])
      
      console.log(`Generated recurring post for schedule ${schedule.id}: ${parsed.title}`)
      toast.success('Recurring post generated!', {
        description: `"${parsed.title}" scheduled for ${new Date(publishTime).toLocaleString()}`,
      })
    } catch (error) {
      console.error('Failed to generate recurring post:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMsg.includes('Unterminated string') || errorMsg.includes('JSON')) {
        toast.error('Failed to generate recurring post', {
          description: 'Response was incomplete. Will retry on next schedule.',
        })
      } else {
        toast.error('Failed to generate recurring post', {
          description: errorMsg,
        })
      }
    }
  }

  const handleCreateRecurringSchedule = () => {
    if (!recurringTransit) {
      toast.error('Please select a transit type')
      return
    }

    if (!wpSettings) {
      toast.error('Please configure WordPress settings first')
      setSettingsOpen(true)
      return
    }

    const newSchedule: RecurringSchedule = {
      id: Date.now().toString(),
      transitType: recurringTransit,
      frequency: recurringFrequency,
      dayOfWeek: recurringFrequency === 'weekly' ? recurringDayOfWeek : undefined,
      dayOfMonth: recurringFrequency === 'monthly' ? recurringDayOfMonth : undefined,
      time: recurringTime,
      isActive: true,
      additionalContext: recurringContext,
      createdAt: Date.now(),
    }

    newSchedule.nextScheduledAt = calculateNextScheduledTime(newSchedule)

    setRecurringSchedules((current) => [...(current || []), newSchedule])
    
    toast.success('Recurring schedule created!', {
      description: `Will generate ${recurringFrequency} posts starting ${new Date(newSchedule.nextScheduledAt).toLocaleDateString()}`,
    })
    
    setRecurringDialogOpen(false)
    setRecurringTransit('')
    setRecurringContext('')
    setRecurringFrequency('weekly')
    setRecurringDayOfWeek(1)
    setRecurringDayOfMonth(1)
    setRecurringTime('09:00')
  }

  const handleToggleSchedule = (scheduleId: string) => {
    setRecurringSchedules((current) =>
      (current || []).map(s =>
        s.id === scheduleId
          ? { ...s, isActive: !s.isActive }
          : s
      )
    )
    
    const schedule = recurringSchedules?.find(s => s.id === scheduleId)
    if (schedule) {
      toast.success(schedule.isActive ? 'Schedule paused' : 'Schedule activated')
    }
  }

  const handleDeleteSchedule = (scheduleId: string) => {
    setRecurringSchedules((current) => (current || []).filter(s => s.id !== scheduleId))
    toast.success('Recurring schedule deleted')
  }

  const getDayName = (dayNum: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayNum]
  }

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th'
    switch (day % 10) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }

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

      const updatedPost = {
        ...post,
        publishStatus: 'published' as const,
        wordpressId: data.id,
        publishedUrl: data.link,
      }

      setSavedPosts((current) =>
        (current || []).map(p =>
          p.id === post.id ? updatedPost : p
        )
      )

      if (emailSettings) {
        await sendPublicationNotification(updatedPost, emailSettings, true)
        const historyEntry = createNotificationHistory(updatedPost, true, emailSettings.recipientEmails)
        setNotificationHistory((current) => [historyEntry, ...(current || [])])
      }

      toast.success(`"${post.title}" published successfully!`, {
        description: 'Scheduled post went live',
        action: data.link ? {
          label: 'View Post',
          onClick: () => window.open(data.link, '_blank'),
        } : undefined,
      })
    } catch (error) {
      console.error('Scheduled publish error:', error)
      
      const failedPost = {
        ...post,
        publishStatus: 'failed' as const,
        publishError: error instanceof Error ? error.message : 'Unknown error',
      }

      setSavedPosts((current) =>
        (current || []).map(p =>
          p.id === post.id ? failedPost : p
        )
      )

      if (emailSettings) {
        await sendPublicationNotification(failedPost, emailSettings, false)
        const historyEntry = createNotificationHistory(failedPost, false, emailSettings.recipientEmails)
        setNotificationHistory((current) => [historyEntry, ...(current || [])])
      }

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
    const finalImagePrompt = editMode ? editedImagePrompt : (generatedPost.imagePrompt || '')

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
      featuredImagePrompt: finalImagePrompt,
      featuredImageUrl: generatedImageUrl || undefined,
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
    setGeneratedPost({ 
      title: post.title, 
      content: post.content,
      imagePrompt: post.featuredImagePrompt 
    })
    setEditedTitle(post.title)
    setEditedContent(post.content)
    setEditedImagePrompt(post.featuredImagePrompt || '')
    setGeneratedImageUrl(post.featuredImageUrl || '')
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
          
          <div className="flex items-center gap-2">
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'generator' | 'analytics' | 'notifications')} className="mr-4">
              <TabsList>
                <TabsTrigger value="generator" className="gap-2">
                  <PencilSimple weight="bold" />
                  Generator
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <ChartBar weight="bold" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2 relative">
                  <Bell weight="bold" />
                  Notifications
                  {emailSettings?.enabled && emailSettings?.recipientEmails?.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full" />
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Dialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Repeat className="mr-2" weight="bold" />
                  New Recurring Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Create Recurring Schedule</DialogTitle>
                  <DialogDescription className="text-white/70">
                    Set up automatic weekly or monthly blog post generation and publishing
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="recurring-transit" className="text-white">Transit Type</Label>
                    <Select value={recurringTransit} onValueChange={setRecurringTransit}>
                      <SelectTrigger id="recurring-transit" className="bg-background text-white border-border">
                        <SelectValue placeholder="Select a transit..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border max-h-[300px]">
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
                    <Label htmlFor="recurring-frequency" className="text-white">Frequency</Label>
                    <Select value={recurringFrequency} onValueChange={(v) => setRecurringFrequency(v as 'weekly' | 'monthly')}>
                      <SelectTrigger id="recurring-frequency" className="bg-background text-white border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="weekly" className="text-white">Weekly</SelectItem>
                        <SelectItem value="monthly" className="text-white">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {recurringFrequency === 'weekly' && (
                    <div className="space-y-2">
                      <Label htmlFor="recurring-day-week" className="text-white">Day of Week</Label>
                      <Select value={recurringDayOfWeek.toString()} onValueChange={(v) => setRecurringDayOfWeek(Number(v))}>
                        <SelectTrigger id="recurring-day-week" className="bg-background text-white border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="0" className="text-white">Sunday</SelectItem>
                          <SelectItem value="1" className="text-white">Monday</SelectItem>
                          <SelectItem value="2" className="text-white">Tuesday</SelectItem>
                          <SelectItem value="3" className="text-white">Wednesday</SelectItem>
                          <SelectItem value="4" className="text-white">Thursday</SelectItem>
                          <SelectItem value="5" className="text-white">Friday</SelectItem>
                          <SelectItem value="6" className="text-white">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {recurringFrequency === 'monthly' && (
                    <div className="space-y-2">
                      <Label htmlFor="recurring-day-month" className="text-white">Day of Month</Label>
                      <Select value={recurringDayOfMonth.toString()} onValueChange={(v) => setRecurringDayOfMonth(Number(v))}>
                        <SelectTrigger id="recurring-day-month" className="bg-background text-white border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border max-h-[300px]">
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={day.toString()} className="text-white">
                              {day}{getOrdinalSuffix(day)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="recurring-time" className="text-white">Time</Label>
                    <Input
                      id="recurring-time"
                      type="time"
                      value={recurringTime}
                      onChange={(e) => setRecurringTime(e.target.value)}
                      className="bg-background text-white border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recurring-context" className="text-white">
                      Additional Context (Optional)
                    </Label>
                    <Textarea
                      id="recurring-context"
                      value={recurringContext}
                      onChange={(e) => setRecurringContext(e.target.value)}
                      placeholder="Add any specific themes or focus areas to include in all generated posts..."
                      className="min-h-[80px] bg-background text-white border-border"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <Button onClick={handleCreateRecurringSchedule} className="w-full">
                      <CalendarPlus className="mr-2" weight="bold" />
                      Create Recurring Schedule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

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
        </div>

        {activeView === 'analytics' ? (
          <BlogAnalyticsDashboard posts={savedPosts || []} schedules={recurringSchedules || []} />
        ) : activeView === 'notifications' ? (
          <div className="space-y-6">
            <EmailNotificationSettings onSave={(settings) => setEmailSettings(settings)} />
            <NotificationHistory history={notificationHistory || []} />
          </div>
        ) : (
          <>
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

        {recurringSchedules && recurringSchedules.length > 0 && (
          <Card className="border-accent/30 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Repeat weight="bold" className="text-accent" />
                Recurring Schedules
              </CardTitle>
              <CardDescription className="text-white/70">
                Automated content generation and publishing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recurringSchedules.map((schedule) => {
                  const transitInfo = TRANSIT_TYPES.find(t => t.value === schedule.transitType)
                  const nextDate = schedule.nextScheduledAt ? new Date(schedule.nextScheduledAt) : null
                  const timeUntil = schedule.nextScheduledAt ? schedule.nextScheduledAt - currentTime : 0
                  const daysUntil = Math.floor(timeUntil / (1000 * 60 * 60 * 24))
                  const hoursUntil = Math.floor((timeUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                  
                  return (
                    <div
                      key={schedule.id}
                      className={`flex items-start justify-between p-4 rounded-lg bg-card/50 border transition-all ${
                        schedule.isActive 
                          ? 'border-accent/30 hover:border-accent/50' 
                          : 'border-border/30 opacity-60'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-white">{transitInfo?.label}</h4>
                          <Badge variant="outline" className={schedule.isActive ? 'bg-accent/20 text-accent border-accent/30' : 'bg-muted/20 text-muted-foreground border-muted/30'}>
                            {schedule.frequency === 'weekly' 
                              ? `Every ${getDayName(schedule.dayOfWeek || 1)}` 
                              : `${schedule.dayOfMonth}${getOrdinalSuffix(schedule.dayOfMonth || 1)} of each month`
                            }
                          </Badge>
                          <Badge variant="outline" className="bg-card/50 text-white/70 border-border/30">
                            {schedule.time}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {transitInfo?.description}
                        </p>
                        {schedule.isActive && nextDate && (
                          <p className="text-xs text-accent mt-2">
                            Next post: {nextDate.toLocaleString()} 
                            {timeUntil > 0 && ` (in ${daysUntil}d ${hoursUntil}h)`}
                          </p>
                        )}
                        {!schedule.isActive && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Schedule paused
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleSchedule(schedule.id)}
                          className={schedule.isActive ? 'text-white/70 hover:text-white' : 'text-accent hover:text-accent hover:bg-accent/10'}
                        >
                          {schedule.isActive ? (
                            <>
                              <Pause weight="bold" className="mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play weight="bold" className="mr-1" />
                              Resume
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
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
                        setEditedImagePrompt(generatedPost.imagePrompt || '')
                      }
                    }}
                  >
                    <PencilSimple className="mr-2" />
                    {editMode ? 'Cancel Edit' : 'Edit'}
                  </Button>
                  <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Sparkle className="mr-2" weight="fill" />
                        Generate Image
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border text-white max-w-5xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-white text-2xl">Generate Featured Image</DialogTitle>
                        <DialogDescription className="text-white/70">
                          Create a stunning mystical or solar image for your blog post
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Tabs defaultValue="generator" className="py-4">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="generator">Custom Generator</TabsTrigger>
                          <TabsTrigger value="external">External URL</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="generator" className="space-y-4 mt-4">
                          <MysticalImageGeneratorEmbed onImageGenerated={(dataUrl) => {
                            setGeneratedImageUrl(dataUrl)
                            toast.success('Image generated! You can use it for your blog post.')
                          }} />
                        </TabsContent>
                        
                        <TabsContent value="external" className="space-y-4 mt-4">
                          <Card className="bg-accent/10 border-accent/30">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold flex-shrink-0">
                                  1
                                </div>
                                <div className="flex-1 space-y-3">
                                  <div>
                                    <h4 className="text-white font-semibold mb-1">Image Prompt</h4>
                                    <p className="text-sm text-white/70 mb-3">
                                      Use this prompt with external AI image generators if preferred
                                    </p>
                                  </div>
                                  <div className="relative">
                                    <Textarea
                                      value={editMode ? editedImagePrompt : (generatedPost.imagePrompt || '')}
                                      readOnly={!editMode}
                                      onChange={(e) => editMode && setEditedImagePrompt(e.target.value)}
                                      className="min-h-[100px] bg-background text-white border-border pr-10 text-sm"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="absolute top-2 right-2 hover:bg-accent/20"
                                      onClick={handleCopyImagePrompt}
                                    >
                                      <Copy weight="bold" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-accent/10 border-accent/30">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold flex-shrink-0">
                                  2
                                </div>
                                <div className="flex-1 space-y-3">
                                  <div>
                                    <h4 className="text-white font-semibold mb-1">Paste Image URL</h4>
                                    <p className="text-sm text-white/70 mb-3">
                                      After generating your image externally, paste the direct URL here
                                    </p>
                                  </div>
                                  
                                  {generatedImageUrl && (
                                    <div className="space-y-2">
                                      <Label className="text-white text-xs">Preview</Label>
                                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                                        <img 
                                          src={generatedImageUrl} 
                                          alt="Featured" 
                                          className="w-full h-full object-cover"
                                          onError={() => toast.error('Failed to load image. Please check the URL.')}
                                        />
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="space-y-2">
                                    <Input
                                      id="image-url"
                                      type="url"
                                      placeholder="https://example.com/your-generated-image.jpg"
                                      value={generatedImageUrl}
                                      onChange={(e) => setGeneratedImageUrl(e.target.value)}
                                      className="bg-background text-white border-border"
                                    />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                      
                      <div className="flex gap-3 pt-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setImageDialogOpen(false)} 
                          className="flex-1"
                        >
                          Close
                        </Button>
                        <Button 
                          onClick={handleImageUrlSubmit} 
                          className="flex-1"
                          disabled={!generatedImageUrl}
                        >
                          <Check className="mr-2" />
                          Use This Image
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
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
              {generatedImageUrl && (
                <div className="space-y-2">
                  <Label className="text-white">Featured Image</Label>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-accent/30 bg-muted">
                    <img 
                      src={generatedImageUrl} 
                      alt="Featured" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {(generatedPost.imagePrompt || editedImagePrompt) && !generatedImageUrl && (
                <Card className="bg-accent/10 border-accent/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Sparkle className="text-accent mt-1 flex-shrink-0" size={24} weight="fill" />
                      <div className="flex-1">
                        <p className="text-sm text-white/90 font-medium mb-1">
                          Ready to Generate Featured Image
                        </p>
                        <p className="text-xs text-white/70 mb-3">
                          An AI image prompt has been created for this post. Click "Generate Image" above to create a stunning featured image.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleGenerateImage}
                          className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                        >
                          <Sparkle className="mr-2" weight="fill" />
                          Generate Image Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                  <div className="space-y-2">
                    <Label htmlFor="edit-image-prompt" className="text-white">Image Generation Prompt (Optional)</Label>
                    <Textarea
                      id="edit-image-prompt"
                      value={editedImagePrompt}
                      onChange={(e) => setEditedImagePrompt(e.target.value)}
                      placeholder="Describe the visual style and elements for the featured image..."
                      className="min-h-[100px] bg-card text-white border-border text-sm"
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
                          {(post.featuredImagePrompt || post.featuredImageUrl) && (
                            <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                              <ImageIcon className="mr-1" size={12} weight="fill" />
                              Image
                            </Badge>
                          )}
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
          </>
        )}
      </motion.div>
    </div>
  )
}
