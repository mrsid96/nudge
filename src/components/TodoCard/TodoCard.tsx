import {
  Archive,
  Bell,
  Check,
  Clock,
  MoreHorizontal,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { LabelChip } from '@/components/LabelChip/LabelChip'
import type { Todo } from '@/types'
import { formatDueDate, formatReminderDate, timestampToDate } from '@/utils/dates'
import { cn } from '@/utils/cn'

const TYPE_LABELS: Record<string, string> = {
  follow_up: 'Follow-up',
  waiting: 'Waiting',
  reminder: 'Reminder',
  idea: 'Idea',
  task: 'Task',
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-danger',
  high: 'text-warning',
  medium: 'text-text-muted',
  low: 'text-text-muted',
  none: '',
}

interface TodoCardProps {
  todo: Todo
  onComplete: (id: string) => void
  onSnooze: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onClick: (id: string) => void
}

export function TodoCard({
  todo,
  onComplete,
  onSnooze,
  onArchive,
  onDelete,
  onClick,
}: TodoCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const reminder = timestampToDate(todo.reminderAt)
  const due = timestampToDate(todo.dueAt)

  return (
    <div
      className="group relative rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border/80 hover:bg-elevated/50"
      onClick={() => onClick(todo.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(todo.id)}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onComplete(todo.id)
          }}
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-success hover:text-success"
          aria-label="Complete task"
        >
          <Check className="h-3 w-3" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                'text-sm font-medium leading-snug',
                todo.priority === 'urgent' && 'text-danger',
                todo.priority === 'high' && PRIORITY_COLORS.high,
              )}
            >
              {todo.priority === 'urgent' && <span className="mr-1">!</span>}
              {todo.title}
            </h3>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(!menuOpen)
                }}
                className="rounded p-1 text-text-muted opacity-0 transition-opacity hover:bg-elevated hover:text-text group-hover:opacity-100"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-border bg-elevated py-1 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface"
                    onClick={() => {
                      onSnooze(todo.id)
                      setMenuOpen(false)
                    }}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Snooze
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface"
                    onClick={() => {
                      onArchive(todo.id)
                      setMenuOpen(false)
                    }}
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archive
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-surface"
                    onClick={() => {
                      onDelete(todo.id)
                      setMenuOpen(false)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {(todo.person || todo.project) && (
            <p className="mt-1 text-xs text-text-muted">
              {[todo.person, todo.project].filter(Boolean).join(' · ')}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {todo.type !== 'task' && (
              <LabelChip name={TYPE_LABELS[todo.type] ?? todo.type} />
            )}
            {todo.labels.map((label) => (
              <LabelChip key={label} name={label} />
            ))}
          </div>

          {(reminder || due) && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
              <Bell className="h-3 w-3" />
              {reminder && <span>{formatReminderDate(reminder)}</span>}
              {due && !reminder && <span>Due {formatDueDate(due)}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
