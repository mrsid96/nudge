import type { Todo } from '@/types'
import { isDueToday, isOverdue, timestampToDate } from '@/utils/dates'
import { isToday, isTomorrow, startOfDay, isAfter } from 'date-fns'

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
}

export function getAttentionTodos(todos: Todo[]): Todo[] {
  return todos.filter((todo) => {
    if (todo.status !== 'active' && todo.status !== 'snoozed') return false
    const reminder = timestampToDate(todo.reminderAt)
    const due = timestampToDate(todo.dueAt)
    if (reminder && (isOverdue(reminder) || isDueToday(reminder))) return true
    if (due && (isOverdue(due) || isDueToday(due))) return true
    if (todo.type === 'follow_up' || todo.type === 'waiting') return true
    return false
  })
}

export function getOverdueTodos(todos: Todo[]): Todo[] {
  return todos.filter((todo) => {
    if (todo.status === 'completed' || todo.status === 'archived') return false
    const reminder = timestampToDate(todo.reminderAt)
    const due = timestampToDate(todo.dueAt)
    return (reminder && isOverdue(reminder)) || (due && isOverdue(due))
  })
}

export function getTodayTodos(todos: Todo[]): Todo[] {
  return todos.filter((todo) => {
    if (todo.status !== 'active' && todo.status !== 'snoozed') return false
    const reminder = timestampToDate(todo.reminderAt)
    const due = timestampToDate(todo.dueAt)
    return (reminder && isToday(reminder)) || (due && isToday(due))
  })
}

export function getUpcomingTodos(todos: Todo[]): Todo[] {
  const tomorrow = startOfDay(new Date())
  tomorrow.setDate(tomorrow.getDate() + 1)

  return todos.filter((todo) => {
    if (todo.status !== 'active' && todo.status !== 'snoozed') return false
    const reminder = timestampToDate(todo.reminderAt)
    const due = timestampToDate(todo.dueAt)
    const date = reminder ?? due
    return date && isAfter(date, tomorrow) && !isTomorrow(date)
  })
}

export function getFollowUpTodos(todos: Todo[]): Todo[] {
  return todos.filter(
    (t) => t.type === 'follow_up' && t.status !== 'completed' && t.status !== 'archived',
  )
}

export function getWaitingTodos(todos: Todo[]): Todo[] {
  return todos.filter(
    (t) => t.type === 'waiting' && t.status !== 'completed' && t.status !== 'archived',
  )
}

export function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    const aReminder = timestampToDate(a.reminderAt)
    const bReminder = timestampToDate(b.reminderAt)
    const aDue = timestampToDate(a.dueAt)
    const bDue = timestampToDate(b.dueAt)

    const aOverdue = (aReminder && isOverdue(aReminder)) || (aDue && isOverdue(aDue))
    const bOverdue = (bReminder && isOverdue(bReminder)) || (bDue && isOverdue(bDue))
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1

    const aToday = (aReminder && isToday(aReminder)) || (aDue && isToday(aDue))
    const bToday = (bReminder && isToday(bReminder)) || (bDue && isToday(bDue))
    if (aToday && !bToday) return -1
    if (!aToday && bToday) return 1

    const aPriority = PRIORITY_ORDER[a.priority] ?? 4
    const bPriority = PRIORITY_ORDER[b.priority] ?? 4
    if (aPriority !== bPriority) return aPriority - bPriority

    const aDate = aReminder ?? aDue
    const bDate = bReminder ?? bDue
    if (aDate && bDate) return aDate.getTime() - bDate.getTime()
    if (aDate) return -1
    if (bDate) return 1

    return b.createdAt.toMillis() - a.createdAt.toMillis()
  })
}
