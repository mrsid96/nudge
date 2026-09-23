import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TodoSection } from '@/components/TodoList/TodoSection'
import { useAuth } from '@/app/providers/AuthProvider'
import { TodoService } from '@/services/TodoService'
import { useTodoActions } from '@/hooks/useTodoActions'
import type { Todo } from '@/types'

export function CompletedPage() {
  const { user } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const { complete, snooze, archive, deleteTodo } = useTodoActions()
  const [, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (!user) return
    const service = new TodoService(user.uid)
    const unsub = service.subscribeCompleted((data) => {
      setTodos(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  function selectTask(id: string) {
    setSearchParams({ task: id })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-xl font-semibold">Completed</h1>
      <TodoSection
        title=""
        todos={todos}
        loading={loading}
        emptyMessage="No completed tasks"
        onComplete={complete}
        onSnooze={snooze}
        onArchive={archive}
        onDelete={deleteTodo}
        onSelect={selectTask}
      />
    </div>
  )
}
