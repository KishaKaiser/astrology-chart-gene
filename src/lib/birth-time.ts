/** Convert a local birth time to an instant, independent of the browser timezone. */
export function birthTimeToUTC(date: string, time: string, timezone: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error('Expected a date in YYYY-MM-DD format and time in HH:MM format')
  }
  const local = new Date(`${date}T${time}:00.000Z`)
  if (!Number.isFinite(local.getTime()) || local.toISOString().slice(0, 16) !== `${date}T${time}`) {
    throw new Error('Invalid calendar date or time')
  }

  const offset = /^([+-])(\d{2}):(\d{2})$/.exec(timezone)
  if (offset) {
    const hours = Number(offset[2])
    const minutes = Number(offset[3])
    if (hours > 23 || minutes > 59) throw new Error('Invalid timezone offset')
    const offsetMinutes = (hours * 60 + minutes) * (offset[1] === '+' ? 1 : -1)
    return new Date(local.getTime() - offsetMinutes * 60_000)
  }

  // Intl uses the runtime's IANA timezone data, including historical DST rules.
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    calendar: 'gregory', numberingSystem: 'latn', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
  const wallTime = (timestamp: number): number => {
    const parts = Object.fromEntries(formatter.formatToParts(timestamp).map(p => [p.type, p.value]))
    return new Date(`${parts.year.padStart(4, '0')}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.000Z`).getTime()
  }
  const target = local.getTime()
  // Sample both sides of a transition so gaps and repeated hours are detected.
  const offsets = new Set([-36, 0, 36].map(hours => {
    const sample = target + hours * 3_600_000
    return wallTime(sample) - sample
  }))
  const candidates = [...offsets].map(offset => target - offset)
    .filter(candidate => wallTime(candidate) === target)
    .sort((a, b) => a - b)
  if (candidates.length === 0) {
    throw new Error(`This local time does not exist in ${timezone} due to a clock change`)
  }
  if (candidates.length > 1) {
    throw new Error(`This local time occurs twice in ${timezone}; specify a numeric UTC offset to select the correct occurrence`)
  }
  return new Date(candidates[0])
}
