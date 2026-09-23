import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TodoSection } from '@/components/TodoList/TodoSection'
import { useTodos } from '@/hooks/useTodos'
import { useTodoActions } from '@/hooks/useTodoActions'
import { sortTodos } from '@/services/todoFilters'

export function CompletedPage() {
  const { todos, loading } = useTodos()
  const { uncomplete, snooze, archive, deleteTodo } = useTodoActions()
  const [, setSearchParams] = useSearchParams()

  const completed = useMemo(
    () => sortTodos(todos.filter((t) => t.status === 'completed')),
    [todos],
  )

  function selectTask(id: string) {
    setSearchParams({ task: id })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-xl font-semibold">Completed</h1>
      <TodoSection
        title=""
        todos={completed}
        loading={loading}
        emptyMessage="No completed tasks"
        onComplete={(id) => uncomplete(id)}
        onSnooze={snooze}
        onArchive={archive}
        onDelete={deleteTodo}
        onSelect={selectTask}
      />
    </div>
  )
}
