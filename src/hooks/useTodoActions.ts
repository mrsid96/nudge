import { Timestamp } from 'firebase/firestore'
import { addDays, setHours, setMinutes, startOfDay } from 'date-fns'
import { useCallback } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useToast } from '@/app/providers/ToastProvider'
import { useTodos } from '@/app/providers/TodosProvider'
import { buildFromCapture } from '@/services/local/todoMutations'
import { clearNotified } from '@/services/ReminderService'
import type { UpdateTodoInput } from '@/services/firestore/types'

export type { UpdateTodoInput }

export function useTodoActions() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { todoRepository, labelRepository, ready, refreshLocal } = useTodos()

  const requireRepos = useCallback(() => {
    if (!ready || !todoRepository || !labelRepository) {
      throw new Error('Still loading — try again in a moment')
    }
    return { todoRepository, labelRepository }
  }, [ready, todoRepository, labelRepository])

  const afterMutation = useCallback(async () => {
    await refreshLocal()
  }, [refreshLocal])

  const handleError = useCallback(
    (err: unknown, fallback = 'Something went wrong') => {
      const message = err instanceof Error ? err.message : fallback
      showToast(message)
    },
    [showToast],
  )

  const createFromCapture = useCallback(
    async (text: string) => {
      try {
        if (!user) throw new Error('Not signed in')
        const { todoRepository, labelRepository } = requireRepos()
        const { todo, labels } = buildFromCapture(user.uid, text)
        await todoRepository.create(todo)
        if (labels.length) await labelRepository.ensureLabelsExist(labels)
        await afterMutation()
      } catch (err) {
        handleError(err, 'Failed to save task')
        throw err
      }
    },
    [user, requireRepos, afterMutation, handleError],
  )

  const complete = useCallback(
    async (id: string, title?: string) => {
      try {
        const { todoRepository } = requireRepos()
        const now = Timestamp.now()
        await todoRepository.update(id, {
          status: 'completed',
          completedAt: now,
          updatedAt: now,
        }, { status: 'completed' })
        await afterMutation()
        showToast(title ? `Completed "${title}"` : 'Task completed', {
          label: 'Undo',
          onClick: async () => {
            await todoRepository.update(id, {
              status: 'active',
              completedAt: undefined,
              updatedAt: Timestamp.now(),
            }, { status: 'active' })
            clearNotified(id)
            await afterMutation()
          },
        })
      } catch (err) {
        handleError(err)
      }
    },
    [requireRepos, afterMutation, showToast, handleError],
  )

  const uncomplete = useCallback(
    async (id: string) => {
      try {
        const { todoRepository } = requireRepos()
        await todoRepository.update(id, {
          status: 'active',
          completedAt: undefined,
          updatedAt: Timestamp.now(),
        }, { status: 'active' })
        clearNotified(id)
        await afterMutation()
      } catch (err) {
        handleError(err)
      }
    },
    [requireRepos, afterMutation, handleError],
  )

  const snooze = useCallback(
    async (id: string) => {
      try {
        const { todoRepository } = requireRepos()
        const tomorrow = setMinutes(setHours(addDays(startOfDay(new Date()), 1), 9), 0)
        await todoRepository.update(id, {
          status: 'snoozed',
          reminderAt: Timestamp.fromDate(tomorrow),
          snoozedUntil: Timestamp.fromDate(tomorrow),
          updatedAt: Timestamp.now(),
        }, { status: 'snoozed', reminderAt: tomorrow, snoozedUntil: tomorrow })
        clearNotified(id)
        await afterMutation()
      } catch (err) {
        handleError(err)
      }
    },
    [requireRepos, afterMutation, handleError],
  )

  const archive = useCallback(
    async (id: string) => {
      try {
        const { todoRepository } = requireRepos()
        await todoRepository.update(id, {
          status: 'archived',
          updatedAt: Timestamp.now(),
        }, { status: 'archived' })
        await afterMutation()
      } catch (err) {
        handleError(err)
      }
    },
    [requireRepos, afterMutation, handleError],
  )

  const deleteTodo = useCallback(
    async (id: string) => {
      try {
        const { todoRepository } = requireRepos()
        await todoRepository.delete(id)
        await afterMutation()
      } catch (err) {
        handleError(err)
      }
    },
    [requireRepos, afterMutation, handleError],
  )

  const updateTodo = useCallback(
    async (id: string, patch: UpdateTodoInput) => {
      try {
        const { todoRepository } = requireRepos()
        const localPatch: Record<string, unknown> = { updatedAt: Timestamp.now() }
        if (patch.title !== undefined) localPatch.title = patch.title
        if (patch.description !== undefined) localPatch.description = patch.description
        if (patch.status !== undefined) localPatch.status = patch.status
        if (patch.type !== undefined) localPatch.type = patch.type
        if (patch.priority !== undefined) localPatch.priority = patch.priority
        if (patch.labels !== undefined) localPatch.labels = patch.labels
        if (patch.person !== undefined) localPatch.person = patch.person
        if (patch.project !== undefined) localPatch.project = patch.project
        if (patch.dueAt !== undefined) {
          localPatch.dueAt = patch.dueAt ? Timestamp.fromDate(patch.dueAt) : undefined
          clearNotified(id)
        }
        if (patch.reminderAt !== undefined) {
          localPatch.reminderAt = patch.reminderAt ? Timestamp.fromDate(patch.reminderAt) : undefined
          clearNotified(id)
        }
        if (patch.snoozedUntil !== undefined) {
          localPatch.snoozedUntil = patch.snoozedUntil
            ? Timestamp.fromDate(patch.snoozedUntil)
            : undefined
        }
        await todoRepository.update(id, localPatch, patch)
        await afterMutation()
      } catch (err) {
        handleError(err)
      }
    },
    [requireRepos, afterMutation, handleError],
  )

  return { createFromCapture, complete, uncomplete, snooze, archive, deleteTodo, updateTodo }
}
