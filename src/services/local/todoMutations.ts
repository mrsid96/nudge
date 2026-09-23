import { Timestamp } from 'firebase/firestore'
import type { LocalTodo } from '@/db/schemas'
import { timestampToDate } from '@/db/serialization'
import { parseNaturalLanguage } from '@/parser/naturalLanguageParser'
import { buildSearchText } from '@/utils/searchText'
import type { CreateTodoInput } from '@/services/firestore/types'

export function buildLocalTodo(
  userId: string,
  todoId: string,
  input: CreateTodoInput,
): LocalTodo {
  const now = Timestamp.now()

  return {
    id: todoId,
    userId,
    title: input.title,
    description: input.description,
    status: 'active',
    type: input.type ?? 'task',
    priority: input.priority ?? 'none',
    labels: input.labels ?? [],
    person: input.person,
    project: input.project,
    dueAt: input.dueAt ? Timestamp.fromDate(input.dueAt) : undefined,
    reminderAt: input.reminderAt ? Timestamp.fromDate(input.reminderAt) : undefined,
    createdAt: now,
    updatedAt: now,
    searchText: buildSearchText({
      title: input.title,
      description: input.description,
      person: input.person,
      project: input.project,
      labels: input.labels,
      type: input.type,
    }),
    source: input.source ? { type: input.source } : { type: 'manual' },
    syncStatus: 'pending',
    localUpdatedAt: Date.now(),
  }
}

export function buildFromCapture(userId: string, text: string): { todo: LocalTodo; labels: string[] } {
  const parsed = parseNaturalLanguage(text)
  const todo = buildLocalTodo(userId, crypto.randomUUID(), {
    title: parsed.title || text,
    type: parsed.type,
    priority: parsed.priority,
    labels: parsed.labels,
    person: parsed.person,
    reminderAt: parsed.reminderAt,
    dueAt: parsed.dueAt,
    source: 'quick_capture',
  })
  return { todo, labels: parsed.labels ?? [] }
}

export function localTodoToCreateInput(todo: LocalTodo): CreateTodoInput {
  return {
    title: todo.title,
    description: todo.description,
    type: todo.type,
    priority: todo.priority,
    labels: todo.labels,
    person: todo.person,
    project: todo.project,
    dueAt: timestampToDate(todo.dueAt),
    reminderAt: timestampToDate(todo.reminderAt),
    source: todo.source?.type,
  }
}
