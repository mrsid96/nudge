import type { Todo } from '@/types'
import { timestampToDate } from '@/utils/dates'

const CHECK_INTERVAL_MS = 30_000
const notifiedKey = 'nudge_notified_reminders'

function notificationKey(todo: Todo): string {
  const reminder = timestampToDate(todo.reminderAt)
  const due = timestampToDate(todo.dueAt)
  const fireAt = reminder ?? due
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

function isDue(todo: Todo): boolean {
  if (todo.status === 'completed' || todo.status === 'archived') return false
  const reminder = timestampToDate(todo.reminderAt)
  const due = timestampToDate(todo.dueAt)
  const fireAt = reminder ?? due
  if (!fireAt) return false
  return fireAt <= new Date()
}

function getNotificationTitle(todo: Todo): string {
  if (todo.type === 'follow_up') return 'Follow-up reminder'
  if (todo.type === 'waiting') return 'Check on waiting item'
  return 'Task reminder'
}

export function showBrowserNotification(todo: Todo): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const key = notificationKey(todo)
  if (getNotifiedSet().has(key)) return

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
}

export function checkDueReminders(todos: Todo[]): void {
  if (Notification.permission !== 'granted') return

  for (const todo of todos) {
    if (isDue(todo)) {
      showBrowserNotification(todo)
    }
  }
}

export function startReminderWatcher(getTodos: () => Todo[]): () => void {
  const tick = () => checkDueReminders(getTodos())
  tick()
  const interval = setInterval(tick, CHECK_INTERVAL_MS)
  return () => clearInterval(interval)
}
