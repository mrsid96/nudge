import {
  addDays,
  addHours,
  addMinutes,
  addWeeks,
  nextMonday,
  nextTuesday,
  nextWednesday,
  nextThursday,
  nextFriday,
  nextSaturday,
  nextSunday,
  setHours,
  setMinutes,
  startOfDay,
} from 'date-fns'

const DAY_MAP: Record<string, (date: Date) => Date> = {
  monday: nextMonday,
  mon: nextMonday,
  tuesday: nextTuesday,
  tue: nextTuesday,
  wednesday: nextWednesday,
  wed: nextWednesday,
  thursday: nextThursday,
  thu: nextThursday,
  friday: nextFriday,
  fri: nextFriday,
  saturday: nextSaturday,
  sat: nextSaturday,
  sunday: nextSunday,
  sun: nextSunday,
}

export interface DateParseResult {
  date?: Date
  remainingText: string
}

function parseTime(text: string, baseDate: Date): { date: Date; matched: string } | null {
  const patterns = [
    /(?:at\s+)?(\d{1,2}):(\d{2})\s*(am|pm)?/i,
    /(?:at\s+)?(\d{1,2})\s*(am|pm)/i,
    /(?:at\s+)?(\d{1,2})\s*o'?clock/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (!match) continue

    let hours = parseInt(match[1], 10)
    const minutes = match[2] && !match[2].match(/am|pm/i) ? parseInt(match[2], 10) : 0
    const meridiem = (match[3] ?? match[2])?.toLowerCase()

    if (meridiem === 'pm' && hours < 12) hours += 12
    if (meridiem === 'am' && hours === 12) hours = 0
    if (!meridiem && hours <= 7) hours += 12

    const date = setMinutes(setHours(baseDate, hours), minutes)
    return { date, matched: match[0] }
  }

  const morningMatch = text.match(/\b(morning)\b/i)
  if (morningMatch) {
    return { date: setMinutes(setHours(baseDate, 9), 0), matched: morningMatch[0] }
  }

  const afternoonMatch = text.match(/\b(afternoon)\b/i)
  if (afternoonMatch) {
    return { date: setMinutes(setHours(baseDate, 14), 0), matched: afternoonMatch[0] }
  }

  const tonightMatch = text.match(/\b(tonight)\b/i)
  if (tonightMatch) {
    return { date: setMinutes(setHours(baseDate, 20), 0), matched: tonightMatch[0] }
  }

  return null
}

export function parseDateExpression(text: string, now = new Date()): DateParseResult {
  let remaining = text
  let baseDate: Date | undefined

  const relativePatterns: Array<{ regex: RegExp; getDate: (n: Date, amount: number) => Date }> = [
    { regex: /\bin\s+(\d+)\s+minutes?\b/i, getDate: (n, a) => addMinutes(n, a) },
    { regex: /\bin\s+(\d+)\s+hours?\b/i, getDate: (n, a) => addHours(n, a) },
    { regex: /\bin\s+(\d+)\s+days?\b/i, getDate: (n, a) => addDays(n, a) },
    { regex: /\bin\s+(\d+)\s+weeks?\b/i, getDate: (n, a) => addWeeks(n, a) },
  ]

  for (const { regex, getDate } of relativePatterns) {
    const match = remaining.match(regex)
    if (match) {
      const amount = parseInt(match[1], 10)
      return { date: getDate(now, amount), remainingText: remaining.replace(match[0], '').trim() }
    }
  }

  const absolutePatterns: Array<{ regex: RegExp; getDate: (n: Date) => Date }> = [
    { regex: /\btoday\b/i, getDate: (n) => startOfDay(n) },
    { regex: /\btomorrow\b/i, getDate: (n) => startOfDay(addDays(n, 1)) },
    { regex: /\bnext\s+week\b/i, getDate: (n) => startOfDay(addWeeks(n, 1)) },
    { regex: /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i, getDate: (n) => n },
  ]

  for (const { regex, getDate } of absolutePatterns) {
    const match = remaining.match(regex)
    if (match) {
      if (match[1]) {
        const dayFn = DAY_MAP[match[1].toLowerCase()]
        baseDate = dayFn ? dayFn(now) : getDate(now)
      } else {
        baseDate = getDate(now)
      }
      remaining = remaining.replace(match[0], '').trim()
      break
    }
  }

  if (!baseDate) {
    const dayOnlyMatch = remaining.match(
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i,
    )
    if (dayOnlyMatch) {
      const dayFn = DAY_MAP[dayOnlyMatch[1].toLowerCase()]
      if (dayFn) {
        baseDate = dayFn(now)
        remaining = remaining.replace(dayOnlyMatch[0], '').trim()
      }
    }
  }

  if (baseDate) {
    const timeResult = parseTime(remaining, baseDate)
    if (timeResult) {
      remaining = remaining.replace(timeResult.matched, '').trim()
      return { date: timeResult.date, remainingText: remaining }
    }
    return { date: setMinutes(setHours(baseDate, 9), 0), remainingText: remaining }
  }

  const timeOnly = parseTime(remaining, now)
  if (timeOnly) {
    remaining = remaining.replace(timeOnly.matched, '').trim()
    return { date: timeOnly.date, remainingText: remaining }
  }

  const remindMatch = remaining.match(/\bremind\s+me\b/i)
  if (remindMatch) {
    remaining = remaining.replace(remindMatch[0], '').trim()
    const nested = parseDateExpression(remaining, now)
    return { date: nested.date, remainingText: nested.remainingText }
  }

  const checkAgainMatch = remaining.match(/,?\s*check\s+again\s+/i)
  if (checkAgainMatch) {
    remaining = remaining.replace(checkAgainMatch[0], ', ').trim()
    const nested = parseDateExpression(remaining, now)
    return { date: nested.date, remainingText: nested.remainingText.replace(/^,\s*/, '') }
  }

  return { remainingText: remaining }
}
