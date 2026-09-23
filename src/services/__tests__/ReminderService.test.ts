import { describe, expect, it, beforeEach, vi } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import type { Todo } from '@/types'
import {
  checkDueReminders,
  clearNotified,
  getNextReminderCheckDelay,
  shouldNotify,
} from '@/services/ReminderService'

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 'todo-1',
    userId: 'user-1',
    title: 'Test task',
    type: 'task',
    status: 'active',
    priority: 'none',
    labels: [],
    searchText: 'test task',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  }
}

describe('ReminderService', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal('Notification', {
      permission: 'granted',
    })
  })

  it('skips snoozed tasks until snoozedUntil passes', () => {
    const future = new Date(Date.now() + 60_000)
    const todo = makeTodo({
      status: 'snoozed',
      snoozedUntil: Timestamp.fromDate(future),
      reminderAt: Timestamp.fromDate(future),
    })
    expect(shouldNotify(todo)).toBe(false)
  })

  it('fires for due reminders not yet notified', () => {
    const past = new Date(Date.now() - 1_000)
    const todo = makeTodo({ reminderAt: Timestamp.fromDate(past) })
    const show = vi.fn()
    vi.stubGlobal('Notification', class {
      static permission = 'granted'
      constructor(_title: string, _opts: unknown) {
        show()
      }
      onclick: (() => void) | null = null
      close() {}
    })

    checkDueReminders([todo])
    expect(show).toHaveBeenCalledOnce()
  })

  it('does not re-fire after notification was shown', () => {
    const past = new Date(Date.now() - 1_000)
    const todo = makeTodo({ reminderAt: Timestamp.fromDate(past) })
    let count = 0
    vi.stubGlobal('Notification', class {
      static permission = 'granted'
      constructor() {
        count++
      }
      onclick: (() => void) | null = null
      close() {}
    })

    checkDueReminders([todo])
    checkDueReminders([todo])
    expect(count).toBe(1)
  })

  it('schedules immediately when a due reminder is pending', () => {
    const past = new Date(Date.now() - 1_000)
    const todo = makeTodo({ reminderAt: Timestamp.fromDate(past) })
    expect(getNextReminderCheckDelay([todo])).toBe(0)
  })

  it('schedules for the next future reminder', () => {
    const inFiveMinutes = new Date(Date.now() + 5 * 60_000)
    const todo = makeTodo({ reminderAt: Timestamp.fromDate(inFiveMinutes) })
    const delay = getNextReminderCheckDelay([todo])
    expect(delay).toBeGreaterThan(4 * 60_000)
    expect(delay).toBeLessThanOrEqual(5 * 60_000)
  })

  it('clears notified keys when reminder changes', () => {
    const past = new Date(Date.now() - 1_000)
    const todo = makeTodo({ reminderAt: Timestamp.fromDate(past) })
    let count = 0
    vi.stubGlobal('Notification', class {
      static permission = 'granted'
      constructor() {
        count++
      }
      onclick: (() => void) | null = null
      close() {}
    })

    checkDueReminders([todo])
    expect(count).toBe(1)

    clearNotified(todo.id)
    checkDueReminders([todo])
    expect(count).toBe(2)
  })
})
