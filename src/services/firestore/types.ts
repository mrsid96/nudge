import type { TodoPriority, TodoStatus, TodoType } from '@/types'

export interface CreateTodoInput {
  title: string
  description?: string
  type?: TodoType
  priority?: TodoPriority
  labels?: string[]
  person?: string
  project?: string
  dueAt?: Date
  reminderAt?: Date
  source?: 'manual' | 'quick_capture'
}

export interface UpdateTodoInput {
  title?: string
  description?: string
  status?: TodoStatus
  type?: TodoType
  priority?: TodoPriority
  labels?: string[]
  person?: string
  project?: string
  dueAt?: Date | null
  reminderAt?: Date | null
  snoozedUntil?: Date | null
}
