import { TIMEZONE_DATABASE } from './timezone-db'
import { getHistoricalDSTRule, formatHistoricalDSTInfo, type DSTHistoricalRule } from './dst-historical-rules'

export interface DSTResult {
  isDST: boolean
  standardOffset: string
  dstOffset?: string
  effectiveOffset: string
  dstRules?: string
  observesDST: boolean
  dstStartDate?: Date
  dstEndDate?: Date
  historicalRule?: string
  ruleYear?: number
}

function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const firstDay = new Date(year, month, 1)
  const firstWeekday = firstDay.getDay()
  
  let dayOffset = weekday - firstWeekday
  if (dayOffset < 0) {
    dayOffset += 7
  }
  
  const targetDate = 1 + dayOffset + (n - 1) * 7
  return new Date(year, month, targetDate)
}

function getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const lastDay = new Date(year, month + 1, 0)
  const lastDate = lastDay.getDate()
  const lastWeekday = lastDay.getDay()
  
  let dayOffset = lastWeekday - weekday
  if (dayOffset < 0) {
    dayOffset += 7
  }
  
  const targetDate = lastDate - dayOffset
  return new Date(year, month, targetDate, 2, 0, 0)
}

function calculateUSADSTDates(year: number): { start: Date; end: Date } {
  if (year >= 2007) {
    const start = getNthWeekdayOfMonth(year, 2, 0, 2)
    start.setHours(2, 0, 0, 0)
    const end = getNthWeekdayOfMonth(year, 10, 0, 1)
    end.setHours(2, 0, 0, 0)
    return { start, end }
  } else if (year >= 1987) {
    const start = getNthWeekdayOfMonth(year, 3, 0, 1)
    start.setHours(2, 0, 0, 0)
    const end = getLastWeekdayOfMonth(year, 9, 0)
    end.setHours(2, 0, 0, 0)
    return { start, end }
  } else if (year >= 1967) {
    const start = getLastWeekdayOfMonth(year, 3, 0)
    start.setHours(2, 0, 0, 0)
    const end = getLastWeekdayOfMonth(year, 9, 0)
    end.setHours(2, 0, 0, 0)
    return { start, end }
  }
  
  const start = new Date(year, 3, 1, 2, 0, 0)
  const end = new Date(year, 9, 1, 2, 0, 0)
  return { start, end }
}

function calculateEuropeDSTDates(year: number): { start: Date; end: Date } | null {
  if (year < 1996) {
    return null
  }
  
  const start = getLastWeekdayOfMonth(year, 2, 0)
  start.setHours(1, 0, 0, 0)
  
  const end = getLastWeekdayOfMonth(year, 9, 0)
  end.setHours(1, 0, 0, 0)
  
  return { start, end }
}

function calculateAustraliaDSTDates(year: number): { start: Date; end: Date } | null {
  if (year < 1971) {
    return null
  }
  
  const start = getNthWeekdayOfMonth(year, 9, 0, 1)
  start.setHours(2, 0, 0, 0)
  
  const end = getNthWeekdayOfMonth(year + 1, 3, 0, 1)
  end.setHours(3, 0, 0, 0)
  
  return { start, end }
}

function calculateNewZealandDSTDates(year: number): { start: Date; end: Date } | null {
  if (year < 1974) {
    return null
  }
  
  const start = getLastWeekdayOfMonth(year, 8, 0)
  start.setHours(2, 0, 0, 0)
  
  const end = getNthWeekdayOfMonth(year + 1, 3, 0, 1)
  end.setHours(3, 0, 0, 0)
  
  return { start, end }
}

function getDSTDatesForTimezone(timezone: string, date: Date): { start: Date; end: Date } | null {
  const year = date.getFullYear()
  
  if (timezone.startsWith('America/')) {
    if (timezone === 'America/Phoenix' || timezone === 'Pacific/Honolulu') {
      return null
    }
    
    if ((timezone === 'America/Indiana/Indianapolis' || timezone === 'America/Indianapolis') && year < 2006) {
      return null
    }
    
    return calculateUSADSTDates(year)
  }
  
  if (timezone.startsWith('Europe/')) {
    return calculateEuropeDSTDates(year)
  }
  
  if (timezone.startsWith('Australia/')) {
    if (timezone === 'Australia/Brisbane' || timezone === 'Australia/Perth') {
      return null
    }
    return calculateAustraliaDSTDates(year)
  }
  
  if (timezone.startsWith('Pacific/Auckland')) {
    return calculateNewZealandDSTDates(year)
  }
  
  return null
}

export function calculateDST(
  date: Date,
  timezone: string
): DSTResult {
  const tzData = TIMEZONE_DATABASE[timezone]
  
  if (!tzData) {
    return {
      isDST: false,
      standardOffset: '+00:00',
      effectiveOffset: '+00:00',
      observesDST: false
    }
  }
  
  const observesDST = tzData.dstObserved || false
  const standardOffset = tzData.offset
  const dstOffset = tzData.dstOffset
  const dstRules = tzData.dstRules
  
  const historicalRule = getHistoricalDSTRule(timezone, date)
  const historicalRuleDescription = historicalRule ? historicalRule.description : undefined
  const ruleYear = date.getFullYear()
  
  if (!observesDST) {
    return {
      isDST: false,
      standardOffset,
      effectiveOffset: standardOffset,
      observesDST: false,
      dstRules,
      historicalRule: historicalRuleDescription,
      ruleYear
    }
  }
  
  const dstDates = getDSTDatesForTimezone(timezone, date)
  
  if (!dstDates) {
    return {
      isDST: false,
      standardOffset,
      dstOffset,
      effectiveOffset: standardOffset,
      observesDST: true,
      dstRules,
      historicalRule: historicalRuleDescription,
      ruleYear
    }
  }
  
  const { start, end } = dstDates
  
  let isDST = false
  if (start < end) {
    isDST = date >= start && date < end
  } else {
    isDST = date >= start || date < end
  }
  
  return {
    isDST,
    standardOffset,
    dstOffset,
    effectiveOffset: isDST && dstOffset ? dstOffset : standardOffset,
    observesDST: true,
    dstRules,
    dstStartDate: start,
    dstEndDate: end,
    historicalRule: historicalRuleDescription,
    ruleYear
  }
}

export function parseDateTimeWithDST(
  dateString: string,
  timeString: string,
  timezone: string
): { date: Date; dstInfo: DSTResult } {
  const [year, month, day] = dateString.split('-').map(Number)
  const [hours, minutes] = timeString.split(':').map(Number)
  
  const localDate = new Date(year, month - 1, day, hours, minutes, 0)
  
  const dstInfo = calculateDST(localDate, timezone)
  
  return {
    date: localDate,
    dstInfo
  }
}

export function formatDSTInfo(dstInfo: DSTResult): string {
  if (!dstInfo.observesDST) {
    return `Standard Time: UTC${dstInfo.standardOffset} (No DST observed)`
  }
  
  if (dstInfo.isDST) {
    return `Daylight Saving Time: UTC${dstInfo.effectiveOffset} (DST Active)`
  }
  
  return `Standard Time: UTC${dstInfo.effectiveOffset} (DST Inactive)`
}

export function formatDSTDetails(dstInfo: DSTResult): string[] {
  const details: string[] = []
  
  if (!dstInfo.observesDST) {
    details.push('This location does not observe Daylight Saving Time')
    details.push(`Standard offset: UTC${dstInfo.standardOffset}`)
    if (dstInfo.historicalRule) {
      details.push(`Historical context (${dstInfo.ruleYear}): ${dstInfo.historicalRule}`)
    }
    return details
  }
  
  details.push(dstInfo.isDST ? '✓ DST was active on this date' : '✗ DST was not active on this date')
  details.push(`Standard offset: UTC${dstInfo.standardOffset}`)
  
  if (dstInfo.dstOffset) {
    details.push(`DST offset: UTC${dstInfo.dstOffset}`)
  }
  
  details.push(`Effective offset: UTC${dstInfo.effectiveOffset}`)
  
  if (dstInfo.dstRules) {
    details.push(`DST schedule: ${dstInfo.dstRules}`)
  }
  
  if (dstInfo.dstStartDate && dstInfo.dstEndDate) {
    const startStr = dstInfo.dstStartDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })
    const endStr = dstInfo.dstEndDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })
    details.push(`DST period: ${startStr} to ${endStr}`)
  }
  
  if (dstInfo.historicalRule) {
    details.push(`Historical rule (${dstInfo.ruleYear}): ${dstInfo.historicalRule}`)
  }
  
  return details
}

export function adjustTimeForDST(
  dateString: string,
  timeString: string,
  timezone: string,
  isDSTInput: boolean
): string {
  const result = parseDateTimeWithDST(dateString, timeString, timezone)
  
  if (!result.dstInfo.observesDST) {
    return timeString
  }
  
  const actuallyDST = result.dstInfo.isDST
  
  if (isDSTInput && !actuallyDST) {
    const [hours, minutes] = timeString.split(':').map(Number)
    const adjustedHours = (hours - 1 + 24) % 24
    return `${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }
  
  if (!isDSTInput && actuallyDST) {
    const [hours, minutes] = timeString.split(':').map(Number)
    const adjustedHours = (hours + 1) % 24
    return `${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }
  
  return timeString
}
