import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { TodoService } from '@/services/TodoService'
import type { Todo } from '@/types'

export function useTodos() {
  const { user } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const service = useMemo(
    () => (user ? new TodoService(user.uid) : null),
    [user],
  )

  useEffect(() => {
    if (!service) {
      setTodos([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = service.subscribeActive(
      (data) => {
        setTodos(data)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [service])

  return { todos, loading, error, service }
}
