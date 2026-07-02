import type { EmailNotificationSettings } from '@/components/EmailNotificationSettings'
import type { ChartData } from '@/lib/astrology-types'
import { ZODIAC_SIGNS } from '@/lib/astrology-types'

interface BlogPost {
  id: string
  title: string
  content: string
  transitType: string
  publishedUrl?: string
  publishStatus?: 'draft' | 'published' | 'scheduled' | 'failed'
  publishError?: string
}

export interface ChartEmailNotificationSettings {
  enabled: boolean
  recipientEmails: string[]
  notifyOnSuccess: boolean
  notifyOnFailure: boolean
  includeChartDetails: boolean
}

function getZodiacSign(longitude: number): string {
  const signIndex = Math.floor(longitude / 30)
  return ZODIAC_SIGNS[signIndex]
}

export async function sendPublicationNotification(
  post: BlogPost,
  settings: EmailNotificationSettings,
  success: boolean
): Promise<void> {
  if (!settings.enabled || settings.recipientEmails.length === 0) {
    return
  }

  if (success && !settings.notifyOnSuccess) {
    return
  }

  if (!success && !settings.notifyOnFailure) {
    return
  }

  const emailContent = generateEmailContent(post, settings, success)

  for (const email of settings.recipientEmails) {
    try {
      await sendEmail(email, emailContent)
    } catch (error) {
      console.error(`Failed to send notification to ${email}:`, error)
    }
  }
}

function generateEmailContent(
  post: BlogPost,
  settings: EmailNotificationSettings,
  success: boolean
): EmailContent {
  const subject = success
    ? `✅ Blog Post Published: ${post.title}`
    : `❌ Blog Post Publication Failed: ${post.title}`

  let body = success
    ? `<h2 style="color: #10b981;">✅ Post Successfully Published</h2>`
    : `<h2 style="color: #ef4444;">❌ Post Publication Failed</h2>`

  body += `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a2e; color: #ffffff;">
      <div style="background-color: #252542; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #a78bfa;">${post.title}</h3>
        <p style="color: #9ca3af; margin: 8px 0;">
          <strong>Transit Type:</strong> ${formatTransitType(post.transitType)}
        </p>
  `

  if (success && post.publishedUrl) {
    body += `
        <p style="margin: 16px 0;">
          <a href="${post.publishedUrl}" 
             style="display: inline-block; background-color: #a78bfa; color: #ffffff; 
                    padding: 12px 24px; text-decoration: none; border-radius: 6px;
                    font-weight: bold;">
            View Published Post →
          </a>
        </p>
    `
  }

  if (!success && post.publishError) {
    body += `
        <div style="background-color: #4c1d1d; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0; color: #fca5a5;"><strong>Error Details:</strong></p>
          <p style="margin: 8px 0 0 0; color: #fca5a5;">${escapeHtml(post.publishError)}</p>
        </div>
    `
  }

  if (success && settings.includePostPreview) {
    const preview = post.content.substring(0, 300) + (post.content.length > 300 ? '...' : '')
    body += `
        <div style="background-color: #1a1a2e; padding: 16px; margin: 16px 0; border-radius: 4px; border: 1px solid #374151;">
          <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
            Post Preview
          </p>
          <p style="margin: 0; color: #d1d5db; line-height: 1.6;">
            ${escapeHtml(preview)}
          </p>
        </div>
    `
  }

  body += `
      </div>
      
      <div style="text-align: center; color: #6b7280; font-size: 12px; padding-top: 20px; border-top: 1px solid #374151;">
        <p style="margin: 0;">
          Psychic Link Charts - Blog Post Notification
        </p>
        <p style="margin: 8px 0 0 0;">
          ${new Date().toLocaleString()}
        </p>
      </div>
    </div>
  `

  return {
    subject,
    body,
  }
}

function formatTransitType(transitType: string): string {
  const types: Record<string, string> = {
    'mercury-retrograde': 'Mercury Retrograde',
    'venus-retrograde': 'Venus Retrograde',
    'mars-retrograde': 'Mars Retrograde',
    'jupiter-transit': 'Jupiter Transit',
    'saturn-transit': 'Saturn Transit',
    'uranus-transit': 'Uranus Transit',
    'neptune-transit': 'Neptune Transit',
    'pluto-transit': 'Pluto Transit',
    'solar-eclipse': 'Solar Eclipse',
    'lunar-eclipse': 'Lunar Eclipse',
    'new-moon': 'New Moon',
    'full-moon': 'Full Moon',
  }
  return types[transitType] || transitType
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

interface EmailContent {
  subject: string
  body: string
}

async function sendEmail(to: string, content: EmailContent): Promise<void> {
  console.log(`[Email Notification] Simulating email send to: ${to}`)
  console.log(`[Email Notification] Subject: ${content.subject}`)
  console.log(`[Email Notification] Body preview: ${content.body.substring(0, 100)}...`)
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[Email Notification] Email successfully "sent" to ${to}`)
      resolve()
    }, 500)
  })
}

export function createNotificationHistory(
  post: BlogPost,
  success: boolean,
  recipientEmails: string[]
): NotificationHistoryEntry {
  return {
    id: Date.now().toString(),
    postId: post.id,
    postTitle: post.title,
    success,
    recipientEmails,
    timestamp: Date.now(),
    errorMessage: success ? undefined : post.publishError,
  }
}

export interface NotificationHistoryEntry {
  id: string
  postId: string
  postTitle: string
  success: boolean
  recipientEmails: string[]
  timestamp: number
  errorMessage?: string
}

export async function sendChartGenerationNotification(
  chart: ChartData | null,
  settings: ChartEmailNotificationSettings,
  success: boolean,
  orderInfo?: {
    orderId: string
    customerName: string
    customerEmail: string
  },
  errorMessage?: string
): Promise<void> {
  if (!settings.enabled || settings.recipientEmails.length === 0) {
    return
  }

  if (success && !settings.notifyOnSuccess) {
    return
  }

  if (!success && !settings.notifyOnFailure) {
    return
  }

  const emailContent = generateChartEmailContent(chart, settings, success, orderInfo, errorMessage)

  for (const email of settings.recipientEmails) {
    try {
      await sendEmail(email, emailContent)
    } catch (error) {
      console.error(`Failed to send notification to ${email}:`, error)
    }
  }
}

function generateChartEmailContent(
  chart: ChartData | null,
  settings: ChartEmailNotificationSettings,
  success: boolean,
  orderInfo?: {
    orderId: string
    customerName: string
    customerEmail: string
  },
  errorMessage?: string
): EmailContent {
  const subject = success
    ? `✅ Chart Generated from WooCommerce Order #${orderInfo?.orderId || 'Unknown'}`
    : `❌ Chart Generation Failed for Order #${orderInfo?.orderId || 'Unknown'}`

  let body = success
    ? `<h2 style="color: #10b981;">✅ Chart Successfully Generated</h2>`
    : `<h2 style="color: #ef4444;">❌ Chart Generation Failed</h2>`

  body += `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a2e; color: #ffffff;">
      <div style="background-color: #252542; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #a78bfa;">WooCommerce Order Details</h3>
        <p style="color: #9ca3af; margin: 8px 0;">
          <strong>Order ID:</strong> #${orderInfo?.orderId || 'Unknown'}
        </p>
        <p style="color: #9ca3af; margin: 8px 0;">
          <strong>Customer:</strong> ${orderInfo?.customerName || 'Unknown'}
        </p>
        <p style="color: #9ca3af; margin: 8px 0;">
          <strong>Email:</strong> ${orderInfo?.customerEmail || 'Unknown'}
        </p>
  `

  if (success && chart && settings.includeChartDetails) {
    const sunPlanet = chart.planets.find(p => p.name === 'Sun')
    const moonPlanet = chart.planets.find(p => p.name === 'Moon')
    const ascendantSign = getZodiacSign(chart.ascendant)
    
    body += `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #374151;">
          <h4 style="color: #a78bfa; margin-bottom: 12px;">Chart Details</h4>
          <p style="color: #9ca3af; margin: 8px 0;">
            <strong>Name:</strong> ${escapeHtml(chart.name)}
          </p>
          <p style="color: #9ca3af; margin: 8px 0;">
            <strong>Birth Date:</strong> ${chart.date}
          </p>
          <p style="color: #9ca3af; margin: 8px 0;">
            <strong>Birth Time:</strong> ${chart.time}
          </p>
          <p style="color: #9ca3af; margin: 8px 0;">
            <strong>Location:</strong> ${escapeHtml(chart.location)}
          </p>
          <p style="color: #9ca3af; margin: 8px 0;">
            <strong>Sun Sign:</strong> ${sunPlanet?.sign || 'N/A'}
          </p>
          <p style="color: #9ca3af; margin: 8px 0;">
            <strong>Moon Sign:</strong> ${moonPlanet?.sign || 'N/A'}
          </p>
          <p style="color: #9ca3af; margin: 8px 0;">
            <strong>Rising Sign:</strong> ${ascendantSign}
          </p>
        </div>
    `
  }

  if (!success && errorMessage) {
    body += `
        <div style="background-color: #4c1d1d; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0; color: #fca5a5;"><strong>Error Details:</strong></p>
          <p style="margin: 8px 0 0 0; color: #fca5a5;">${escapeHtml(errorMessage)}</p>
        </div>
    `
  }

  body += `
      </div>
      
      <div style="text-align: center; color: #6b7280; font-size: 12px; padding-top: 20px; border-top: 1px solid #374151;">
        <p style="margin: 0;">
          Psychic Link Charts - WooCommerce Integration
        </p>
        <p style="margin: 8px 0 0 0;">
          ${new Date().toLocaleString()}
        </p>
      </div>
    </div>
  `

  return {
    subject,
    body,
  }
}

export function createChartNotificationHistory(
  chart: ChartData | null,
  success: boolean,
  recipientEmails: string[],
  orderInfo?: {
    orderId: string
    customerName: string
    customerEmail: string
  },
  errorMessage?: string
): ChartNotificationHistoryEntry {
  return {
    id: Date.now().toString(),
    chartId: chart?.id || 'unknown',
    chartName: chart?.name || orderInfo?.customerName || 'Unknown',
    orderId: orderInfo?.orderId || 'unknown',
    success,
    recipientEmails,
    timestamp: Date.now(),
    errorMessage: success ? undefined : errorMessage,
  }
}

export interface ChartNotificationHistoryEntry {
  id: string
  chartId: string
  chartName: string
  orderId: string
  success: boolean
  recipientEmails: string[]
  timestamp: number
  errorMessage?: string
}
