import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TodoSection } from '@/components/TodoList/TodoSection'
import { useTodos } from '@/hooks/useTodos'
import { useTodoActions } from '@/hooks/useTodoActions'
import {
  getFollowUpTodos,
  getTodayTodos,
  getUpcomingTodos,
  getWaitingTodos,
  sortTodos,
} from '@/services/todoFilters'
import { searchTodos } from '@/services/SearchService'

interface TodoViewPageProps {
  title: string
  filter: 'inbox' | 'today' | 'upcoming' | 'follow-ups' | 'waiting'
}

export function TodoViewPage({ title, filter }: TodoViewPageProps) {
  const { todos, loading } = useTodos()
  const { complete, snooze, archive, deleteTodo } = useTodoActions()
  const [, setSearchParams] = useSearchParams()

  const filtered = useMemo(() => {
    const sorted = sortTodos(todos)
    switch (filter) {
      case 'today':
        return getTodayTodos(sorted)
      case 'upcoming':
        return getUpcomingTodos(sorted)
      case 'follow-ups':
        return getFollowUpTodos(sorted)
      case 'waiting':
        return getWaitingTodos(sorted)
      default:
        return sorted.filter((t) => t.status === 'active' || t.status === 'snoozed')
    }
  }, [todos, filter])

  function selectTask(id: string) {
    setSearchParams({ task: id })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-xl font-semibold">{title}</h1>
      <TodoSection
        title=""
        todos={filtered}
        loading={loading}
        emptyMessage={`No ${title.toLowerCase()} tasks`}
        onComplete={complete}
        onSnooze={snooze}
        onArchive={archive}
        onDelete={deleteTodo}
        onSelect={selectTask}
      />
    </div>
  )
}

export function SearchPage() {
  const { todos, loading } = useTodos()
  const { complete, snooze, archive, deleteTodo } = useTodoActions()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  const results = useMemo(() => searchTodos(todos, query), [todos, query])

  function selectTask(id: string) {
    setSearchParams({ q: query, task: id })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-xl font-semibold">Search</h1>
      <input
        value={query}
        onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {})}
        placeholder="Search tasks... (#label @person status:active)"
        className="mb-6 w-full rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm"
        autoFocus
      />
      <TodoSection
        title=""
        todos={results}
        loading={loading}
        emptyMessage={query ? 'No results found' : 'Enter a search query'}
        onComplete={complete}
        onSnooze={snooze}
        onArchive={archive}
        onDelete={deleteTodo}
        onSelect={selectTask}
      />
    </div>
  )
}
