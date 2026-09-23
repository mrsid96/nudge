import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  startOfDay,
  isSameDay,
} from 'date-fns'
import type { Timestamp } from 'firebase/firestore'
import { stampToMillis, timestampToDate as parseTimestamp } from '@/db/serialization'

type StoredTimestamp = Timestamp | { seconds: number; nanoseconds: number } | null | undefined

export function timestampToDate(ts: StoredTimestamp): Date | undefined {
  return parseTimestamp(ts)
}

export function timestampToMillis(ts: StoredTimestamp): number {
  return stampToMillis(ts)
}

export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function formatReminderDate(date: Date): string {
  if (isToday(date)) {
    return `Today, ${format(date, 'h:mm a')}`
  }
  if (isTomorrow(date)) {
    return `Tomorrow, ${format(date, 'h:mm a')}`
  }
  if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'h:mm a')}`
  }
  return format(date, 'MMM d, h:mm a')
}

export function formatDueDate(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'MMM d, yyyy')
}

export function isOverdue(date: Date): boolean {
  return isPast(date) && !isToday(date)
}

export function isDueToday(date: Date): boolean {
  return isToday(date) || (isPast(date) && isSameDay(date, new Date()))
}

export function isReminderDue(date: Date): boolean {
  return date <= new Date()
}

export function startOfToday(): Date {
  return startOfDay(new Date())
}

export function getGreeting(name: string): string {
  const hour = new Date().getHours()
  if (hour < 12) return `Good morning, ${name}`
  if (hour < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}
