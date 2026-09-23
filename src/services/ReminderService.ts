import type { Todo } from '@/types'
import { timestampToDate } from '@/utils/dates'

const CHECK_INTERVAL_MS = 30_000
const notifiedKey = 'nudge_notified_reminders'

function getNotifiedSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(notifiedKey)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function markNotified(todoId: string): void {
  const set = getNotifiedSet()
  set.add(todoId)
  sessionStorage.setItem(notifiedKey, JSON.stringify([...set]))
}

export function clearNotified(todoId: string): void {
  const set = getNotifiedSet()
  set.delete(todoId)
  sessionStorage.setItem(notifiedKey, JSON.stringify([...set]))
}

function isDue(todo: Todo): boolean {
  if (todo.status === 'completed' || todo.status === 'archived') return false
  const reminder = timestampToDate(todo.reminderAt)
  if (!reminder) return false
  return reminder <= new Date()
}

function getNotificationTitle(todo: Todo): string {
  if (todo.type === 'follow_up') return 'Follow-up reminder'
  if (todo.type === 'waiting') return 'Check on waiting item'
  return 'Task reminder'
}

export function showBrowserNotification(todo: Todo): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (getNotifiedSet().has(todo.id)) return

  const notification = new Notification(getNotificationTitle(todo), {
    body: todo.title,
    icon: '/favicon.svg',
    tag: todo.id,
    data: { taskId: todo.id },
  })

  notification.onclick = () => {
    window.focus()
    window.location.href = `/?task=${todo.id}`
    notification.close()
  }

  markNotified(todo.id)
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
