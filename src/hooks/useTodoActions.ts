import { addDays, setHours, setMinutes, startOfDay } from 'date-fns'
import { useCallback } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { LabelService } from '@/services/LabelService'
import { TodoService } from '@/services/TodoService'
import { parseNaturalLanguage } from '@/parser/naturalLanguageParser'

export function useTodoActions() {
  const { user } = useAuth()

  const getService = useCallback(() => {
    if (!user) throw new Error('Not authenticated')
    return new TodoService(user.uid)
  }, [user])

  const getLabelService = useCallback(() => {
    if (!user) throw new Error('Not authenticated')
    return new LabelService(user.uid)
  }, [user])

  const createFromCapture = useCallback(
    async (text: string) => {
      const service = getService()
      const parsed = parseNaturalLanguage(text)

      if (parsed.labels?.length) {
        await getLabelService().ensureLabelsExist(parsed.labels)
      }

      await service.createFromQuickCapture(text)
    },
    [getService, getLabelService],
  )

  const complete = useCallback(
    async (id: string) => {
      await getService().complete(id)
    },
    [getService],
  )

  const snooze = useCallback(
    async (id: string) => {
      const tomorrow = setMinutes(
        setHours(addDays(startOfDay(new Date()), 1), 9),
        0,
      )
      await getService().snooze(id, tomorrow)
    },
    [getService],
  )

  const archive = useCallback(
    async (id: string) => {
      await getService().archive(id)
    },
    [getService],
  )

  const deleteTodo = useCallback(
    async (id: string) => {
      await getService().delete(id)
    },
    [getService],
  )

  return { createFromCapture, complete, snooze, archive, deleteTodo }
}
