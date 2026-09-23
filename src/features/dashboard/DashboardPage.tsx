import { useSearchParams } from 'react-router-dom'
import { QuickCapture } from '@/components/QuickCapture/QuickCapture'
import { TodoSection } from '@/components/TodoList/TodoSection'
import { useAuth } from '@/app/providers/AuthProvider'
import { useTodos } from '@/hooks/useTodos'
import { useTodoActions } from '@/hooks/useTodoActions'
import {
  getAttentionTodos,
  getOverdueTodos,
  getTodayTodos,
  getUpcomingTodos,
  sortTodos,
} from '@/services/todoFilters'
import { getGreeting } from '@/utils/dates'
import { format } from 'date-fns'
import { timestampToDate } from '@/utils/dates'
import type { Todo } from '@/types'

function groupByTime(todos: Todo[]): Map<string, Todo[]> {
  const groups = new Map<string, Todo[]>()
  for (const todo of todos) {
    const date = timestampToDate(todo.reminderAt) ?? timestampToDate(todo.dueAt)
    const key = date ? format(date, 'h:mm a') : 'No time'
    const existing = groups.get(key) ?? []
    existing.push(todo)
    groups.set(key, existing)
  }
  return groups
}

export function DashboardPage() {
  const { user } = useAuth()
  const { todos, loading } = useTodos()
  const { createFromCapture, complete, snooze, archive, deleteTodo } = useTodoActions()
  const [searchParams, setSearchParams] = useSearchParams()
  const autoFocus = searchParams.get('capture') === '1'

  const sorted = sortTodos(todos)
  const attention = getAttentionTodos(sorted)
  const overdue = getOverdueTodos(sorted)
  const today = getTodayTodos(sorted)
  const upcoming = getUpcomingTodos(sorted)
  const todayGroups = groupByTime(today)

  const firstName = user?.displayName?.split(' ')[0] ?? 'there'

  function selectTask(id: string) {
    setSearchParams({ task: id })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-xl font-semibold">{getGreeting(firstName)}</h1>

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
        onComplete={complete}
        onSnooze={snooze}
        onArchive={archive}
        onDelete={deleteTodo}
        onSelect={selectTask}
      />

      {overdue.length > 0 && overdue.length !== attention.length && (
        <TodoSection
          title="Overdue"
          count={overdue.length}
          todos={overdue}
          loading={loading}
          onComplete={complete}
          onSnooze={snooze}
          onArchive={archive}
          onDelete={deleteTodo}
          onSelect={selectTask}
        />
      )}

      {today.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
            Today
          </h2>
          {Array.from(todayGroups.entries()).map(([time, items]) => (
            <div key={time} className="mb-4">
              <p className="mb-2 text-xs text-text-muted">{time}</p>
              <TodoSection
                title=""
                todos={items}
                onComplete={complete}
                onSnooze={snooze}
                onArchive={archive}
                onDelete={deleteTodo}
                onSelect={selectTask}
              />
            </div>
          ))}
        </section>
      )}

      <TodoSection
        title="Upcoming"
        count={upcoming.length}
        todos={upcoming.slice(0, 10)}
        loading={loading}
        emptyMessage="Nothing upcoming"
        onComplete={complete}
        onSnooze={snooze}
        onArchive={archive}
        onDelete={deleteTodo}
        onSelect={selectTask}
      />
    </div>
  )
}
