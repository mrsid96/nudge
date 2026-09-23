import type { Todo } from '@/types'
import { timestampToDate } from '@/utils/dates'

const SAFETY_INTERVAL_MS = 60_000
const DEFAULT_POLL_MS = 60_000
const notifiedKey = 'nudge_notified_reminders'

function getFireAt(todo: Todo): Date | undefined {
  const reminder = timestampToDate(todo.reminderAt)
  const due = timestampToDate(todo.dueAt)
  return reminder ?? due
}

function notificationKey(todo: Todo): string {
  const fireAt = getFireAt(todo)
  return `${todo.id}:${fireAt?.getTime() ?? 0}`
}

function getNotifiedSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(notifiedKey)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function markNotified(key: string): void {
  const set = getNotifiedSet()
  set.add(key)
  sessionStorage.setItem(notifiedKey, JSON.stringify([...set]))
}

export function clearNotified(todoId: string): void {
  const set = getNotifiedSet()
  const next = new Set([...set].filter((k) => !k.startsWith(`${todoId}:`)))
  sessionStorage.setItem(notifiedKey, JSON.stringify([...next]))
}

export function shouldNotify(todo: Todo): boolean {
  if (todo.status === 'completed' || todo.status === 'archived') return false

  const snoozedUntil = timestampToDate(todo.snoozedUntil)
  if (snoozedUntil && snoozedUntil > new Date()) return false

  return true
}

function isDue(todo: Todo): boolean {
  if (!shouldNotify(todo)) return false
  const fireAt = getFireAt(todo)
  if (!fireAt) return false
  return fireAt <= new Date()
}

function getNotificationTitle(todo: Todo): string {
  if (todo.type === 'follow_up') return 'Follow-up reminder'
  if (todo.type === 'waiting') return 'Check on waiting item'
  return 'Task reminder'
}

export function showBrowserNotification(todo: Todo): boolean {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false

  const key = notificationKey(todo)
  if (getNotifiedSet().has(key)) return false

  try {
    const notification = new Notification(getNotificationTitle(todo), {
      body: todo.title,
      icon: '/favicon.svg',
      tag: key,
      data: { taskId: todo.id },
    })

    notification.onclick = () => {
      window.focus()
      window.location.href = `/?task=${todo.id}`
      notification.close()
    }

    markNotified(key)
    return true
  } catch (error) {
    console.error('Failed to show notification:', error)
    return false
  }
}

export function sendTestNotification(): boolean {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false

  try {
    new Notification('Nudge test', {
      body: 'Notifications are working.',
      icon: '/favicon.svg',
    })
    return true
  } catch (error) {
    console.error('Failed to show test notification:', error)
    return false
  }
}

export function checkDueReminders(todos: Todo[]): void {
  if (Notification.permission !== 'granted') return

  for (const todo of todos) {
    if (isDue(todo)) {
      showBrowserNotification(todo)
    }
  }
}

/** Milliseconds until the next reminder should be checked. */
export function getNextReminderCheckDelay(todos: Todo[]): number {
  const now = Date.now()
  let nextFuture: number | null = null

  for (const todo of todos) {
    if (!shouldNotify(todo)) continue
    const fireAt = getFireAt(todo)
    if (!fireAt) continue

    const ms = fireAt.getTime()
    if (ms <= now) {
      if (!getNotifiedSet().has(notificationKey(todo))) return 0
      continue
    }

    if (nextFuture === null || ms < nextFuture) nextFuture = ms
  }

  if (nextFuture !== null) return nextFuture - now
  return DEFAULT_POLL_MS
}

export function startReminderWatcher(getTodos: () => Todo[]): () => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const scheduleNext = () => {
    if (timeoutId) clearTimeout(timeoutId)
    const delay = getNextReminderCheckDelay(getTodos())
    timeoutId = setTimeout(tick, delay === 0 ? 0 : Math.max(1_000, delay))
  }

  const tick = () => {
    checkDueReminders(getTodos())
    scheduleNext()
  }

  const onVisible = () => {
    if (document.visibilityState === 'visible') tick()
  }

  tick()
  const safety = setInterval(tick, SAFETY_INTERVAL_MS)
  document.addEventListener('visibilitychange', onVisible)

  return () => {
    if (timeoutId) clearTimeout(timeoutId)
    clearInterval(safety)
    document.removeEventListener('visibilitychange', onVisible)
  }
}
