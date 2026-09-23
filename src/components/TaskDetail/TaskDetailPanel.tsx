import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LabelChip } from '@/components/LabelChip/LabelChip'
import { ReminderPicker } from '@/components/ReminderPicker/ReminderPicker'
import { CommentTrail } from '@/components/CommentTrail/CommentTrail'
import { useTodos } from '@/hooks/useTodos'
import { useTodoActions } from '@/hooks/useTodoActions'
import type { Todo, TodoPriority, TodoType } from '@/types'
import { formatReminderDate, timestampToDate } from '@/utils/dates'
import { clearNotified } from '@/services/ReminderService'

interface TaskDetailPanelProps {
  taskId: string
  onClose: () => void
}

const TYPES: TodoType[] = ['task', 'follow_up', 'waiting', 'idea', 'reminder']
const PRIORITIES: TodoPriority[] = ['none', 'low', 'medium', 'high', 'urgent']

export function TaskDetailPanel({ taskId, onClose }: TaskDetailPanelProps) {
  const { user } = useAuth()
  const { todos, loading } = useTodos()
  const { updateTodo, complete } = useTodoActions()
  const [draft, setDraft] = useState<Todo | null>(null)
  const [showSnooze, setShowSnooze] = useState(false)

  const todo = todos.find((t) => t.id === taskId) ?? draft

  useEffect(() => {
    const match = todos.find((t) => t.id === taskId)
    if (match) setDraft(match)
  }, [todos, taskId])

  if (!user) return null

  function handleUpdate(field: string, value: unknown) {
    if (!todo) return
    updateTodo(todo.id, { [field]: value } as Parameters<typeof updateTodo>[1])
    setDraft({ ...todo, [field]: value } as Todo)
  }

  function handleComplete() {
    if (!todo) return
    complete(taskId, todo.title)
    onClose()
  }

  function handleSnooze(date: Date) {
    updateTodo(taskId, {
      status: 'snoozed',
      reminderAt: date,
      snoozedUntil: date,
    })
    clearNotified(taskId)
    setShowSnooze(false)
    onClose()
  }

  if (loading) {
    return (
      <aside className="w-full border-l border-border bg-surface p-6 md:w-96">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-3/4 rounded bg-elevated" />
          <div className="h-4 w-1/2 rounded bg-elevated" />
        </div>
      </aside>
    )
  }

  if (!todo) {
    return (
      <aside className="w-full border-l border-border bg-surface p-6 md:w-96">
        <p className="text-text-muted">Task not found</p>
      </aside>
    )
  }

  const reminder = timestampToDate(todo.reminderAt)

  return (
    <aside className="fixed inset-0 z-50 bg-bg md:static md:inset-auto md:w-96 md:border-l md:border-border md:bg-surface">
      <div className="flex h-full flex-col overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Task Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:bg-elevated hover:text-text"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-text-muted">Title</label>
            <Input
              value={todo.title}
              onChange={(e) => setDraft({ ...todo, title: e.target.value })}
              onBlur={() => handleUpdate('title', todo.title)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-text-muted">Type</label>
            <select
              value={todo.type}
              onChange={(e) => handleUpdate('type', e.target.value)}
              className="w-full rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-text-muted">Person</label>
            <Input
              value={todo.person ?? ''}
              onChange={(e) => setDraft({ ...todo, person: e.target.value })}
              onBlur={() => handleUpdate('person', todo.person || null)}
              placeholder="Name"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-text-muted">Priority</label>
            <select
              value={todo.priority}
              onChange={(e) => handleUpdate('priority', e.target.value)}
              className="w-full rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {todo.labels.length > 0 && (
            <div>
              <label className="mb-1 block text-xs text-text-muted">Labels</label>
              <div className="flex flex-wrap gap-1.5">
                {todo.labels.map((l) => (
                  <LabelChip key={l} name={l} />
                ))}
              </div>
            </div>
          )}

          {reminder && (
            <div>
              <label className="mb-1 block text-xs text-text-muted">Reminder</label>
              <p className="text-sm">{formatReminderDate(reminder)}</p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs text-text-muted">Description</label>
            <textarea
              value={todo.description ?? ''}
              onChange={(e) => setDraft({ ...todo, description: e.target.value })}
              onBlur={() => handleUpdate('description', todo.description || null)}
              className="w-full rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm min-h-[80px] resize-y"
              placeholder="Add notes..."
            />
          </div>

          <CommentTrail todoId={todo.id} />
        </div>

        <div className="mt-6 flex gap-2">
          <Button className="flex-1" onClick={handleComplete}>Complete</Button>
          <Button variant="secondary" onClick={() => setShowSnooze(true)}>Snooze</Button>
        </div>

        {showSnooze && (
          <div className="mt-4">
            <ReminderPicker
              onSelect={handleSnooze}
              onCancel={() => setShowSnooze(false)}
            />
          </div>
        )}
      </div>
    </aside>
  )
}
