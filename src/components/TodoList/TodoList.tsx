import { TodoCard } from '@/components/TodoCard/TodoCard'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Todo } from '@/types'

interface TodoListProps {
  todos: Todo[]
  loading?: boolean
  emptyMessage?: string
  onComplete: (id: string, title: string) => void
  onSnooze: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onSelect: (id: string) => void
}

export function TodoList({
  todos,
  loading,
  emptyMessage = 'No tasks yet',
  onComplete,
  onSnooze,
  onArchive,
  onDelete,
  onSelect,
}: TodoListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">{emptyMessage}</p>
    )
  }

  return (
    <div className="space-y-3">
      {todos.map((todo) => (
        <TodoCard
          key={todo.id}
          todo={todo}
          onComplete={onComplete}
          onSnooze={onSnooze}
          onArchive={onArchive}
          onDelete={onDelete}
          onClick={onSelect}
        />
      ))}
    </div>
  )
}
