import { addDays, setHours, setMinutes, startOfDay } from 'date-fns'
import { useCallback } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import { useTodos } from '@/hooks/useTodos'
import { clearNotified } from '@/services/ReminderService'
import type { UpdateTodoInput } from '@/services/TodoService'

export function useTodoActions() {
  const { showToast } = useToast()
  const { engine, refreshLocal } = useTodos()

  const requireEngine = useCallback(() => {
    if (!engine) throw new Error('Not authenticated')
    return engine
  }, [engine])

  const createFromCapture = useCallback(
    (text: string) => {
      requireEngine().createFromCapture(text)
      refreshLocal()
    },
    [requireEngine, refreshLocal],
  )

  const complete = useCallback(
    (id: string, title?: string) => {
      requireEngine().updateTodo(id, { status: 'completed' })
      refreshLocal()
      showToast(title ? `Completed "${title}"` : 'Task completed', {
        label: 'Undo',
        onClick: () => {
          requireEngine().updateTodo(id, { status: 'active' })
          clearNotified(id)
          refreshLocal()
        },
      })
    },
    [requireEngine, refreshLocal, showToast],
  )

  const uncomplete = useCallback(
    (id: string) => {
      requireEngine().updateTodo(id, { status: 'active' })
      clearNotified(id)
      refreshLocal()
    },
    [requireEngine, refreshLocal],
  )

  const snooze = useCallback(
    (id: string) => {
      const tomorrow = setMinutes(
        setHours(addDays(startOfDay(new Date()), 1), 9),
        0,
      )
      requireEngine().updateTodo(id, {
        status: 'snoozed',
        reminderAt: tomorrow,
        snoozedUntil: tomorrow,
      })
      clearNotified(id)
      refreshLocal()
    },
    [requireEngine, refreshLocal],
  )

  const archive = useCallback(
    (id: string) => {
      requireEngine().updateTodo(id, { status: 'archived' })
      refreshLocal()
    },
    [requireEngine, refreshLocal],
  )

  const deleteTodo = useCallback(
    (id: string) => {
      requireEngine().deleteTodo(id)
      refreshLocal()
    },
    [requireEngine, refreshLocal],
  )

  const updateTodo = useCallback(
    (id: string, patch: UpdateTodoInput) => {
      requireEngine().updateTodo(id, patch)
      refreshLocal()
    },
    [requireEngine, refreshLocal],
  )

  return { createFromCapture, complete, uncomplete, snooze, archive, deleteTodo, updateTodo }
}
