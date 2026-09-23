import { useSearchParams } from 'react-router-dom'
import { QuickCapture } from '@/components/QuickCapture/QuickCapture'
import { CaptureDemo } from '@/components/QuickCapture/CaptureDemo'
import { TodoSection } from '@/components/TodoList/TodoSection'
import { useAuth } from '@/app/providers/AuthProvider'
import { useTodos } from '@/hooks/useTodos'
import { useTodoActions } from '@/hooks/useTodoActions'
import { getAttentionTodos, sortTodos } from '@/services/todoFilters'
import { getGreeting } from '@/utils/dates'

export function DashboardPage() {
  const { user } = useAuth()
  const { todos, loading } = useTodos()
  const { createFromCapture, complete, snooze, archive, deleteTodo } = useTodoActions()
  const [searchParams, setSearchParams] = useSearchParams()
  const autoFocus = searchParams.get('capture') === '1'

  const attention = getAttentionTodos(sortTodos(todos))
  const firstName = user?.displayName?.split(' ')[0] ?? 'there'

  function selectTask(id: string) {
    setSearchParams({ task: id })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-xl font-semibold">{getGreeting(firstName)}</h1>

      <CaptureDemo />

      <QuickCapture
        onSubmit={createFromCapture}
        className="mb-8"
        autoFocus={autoFocus}
      />

      <TodoSection
        title="Needs Attention"
        count={attention.length}
        todos={attention}
        loading={loading}
        emptyMessage="Nothing needs your attention right now"
        onComplete={complete}
        onSnooze={snooze}
        onArchive={archive}
        onDelete={deleteTodo}
        onSelect={selectTask}
      />
    </div>
  )
}
