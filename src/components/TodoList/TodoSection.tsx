import { TodoList } from './TodoList'
import type { Todo } from '@/types'

interface TodoSectionProps {
  title: string
  count?: number
  todos: Todo[]
  loading?: boolean
  emptyMessage?: string
  onComplete: (id: string) => void
  onSnooze: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onSelect: (id: string) => void
}

export function TodoSection({
  title,
  count,
  todos,
  loading,
  emptyMessage,
  onComplete,
  onSnooze,
  onArchive,
  onDelete,
  onSelect,
}: TodoSectionProps) {
  if (!loading && todos.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-muted">
        {title}
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-elevated px-2 py-0.5 text-xs font-normal">
            {count}
          </span>
        )}
      </h2>
      <TodoList
        todos={todos}
        loading={loading}
        emptyMessage={emptyMessage}
        onComplete={onComplete}
        onSnooze={onSnooze}
        onArchive={onArchive}
        onDelete={onDelete}
        onSelect={onSelect}
      />
    </section>
  )
}
