import type { Todo } from '@/types'
import { deserializeTodo, serializeTodo } from './todoSerialization'

const STORAGE_VERSION = 'nudge:v1'

export type PendingOperationType = 'create' | 'update' | 'delete'

export interface PendingOperation {
  id: string
  type: PendingOperationType
  todoId: string
  payload?: Record<string, unknown>
  createdAt: number
}

function todosKey(userId: string): string {
  return `${STORAGE_VERSION}:${userId}:todos`
}

function pendingKey(userId: string): string {
  return `${STORAGE_VERSION}:${userId}:pending`
}

function lastSyncKey(userId: string): string {
  return `${STORAGE_VERSION}:${userId}:lastSync`
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export class LocalTodoStore {
  constructor(private readonly userId: string) {}

  getTodos(): Todo[] {
    const stored = readJson<ReturnType<typeof serializeTodo>[]>(todosKey(this.userId), [])
    return stored.map(deserializeTodo)
  }

  setTodos(todos: Todo[]): void {
    writeJson(todosKey(this.userId), todos.map(serializeTodo))
  }

  getPendingOps(): PendingOperation[] {
    return readJson<PendingOperation[]>(pendingKey(this.userId), [])
  }

  setPendingOps(ops: PendingOperation[]): void {
    writeJson(pendingKey(this.userId), ops)
  }

  addPendingOp(op: PendingOperation): void {
    const ops = this.getPendingOps()
    ops.push(op)
    this.setPendingOps(ops)
  }

  removePendingOps(opIds: string[]): void {
    if (opIds.length === 0) return
    const ids = new Set(opIds)
    this.setPendingOps(this.getPendingOps().filter((op) => !ids.has(op.id)))
  }

  getLastSyncedAt(): number | null {
    const value = localStorage.getItem(lastSyncKey(this.userId))
    return value ? Number(value) : null
  }

  setLastSyncedAt(timestamp: number): void {
    localStorage.setItem(lastSyncKey(this.userId), String(timestamp))
  }

  upsertTodo(todo: Todo): void {
    const todos = this.getTodos()
    const index = todos.findIndex((t) => t.id === todo.id)
    if (index === -1) {
      todos.unshift(todo)
    } else {
      todos[index] = todo
    }
    this.setTodos(todos)
  }

  patchTodo(todoId: string, patch: Partial<Todo>): Todo | null {
    const todos = this.getTodos()
    const index = todos.findIndex((t) => t.id === todoId)
    if (index === -1) return null
    const updated = { ...todos[index], ...patch }
    todos[index] = updated
    this.setTodos(todos)
    return updated
  }

  removeTodo(todoId: string): void {
    this.setTodos(this.getTodos().filter((t) => t.id !== todoId))
  }

  getTodo(todoId: string): Todo | null {
    return this.getTodos().find((t) => t.id === todoId) ?? null
  }
}

export const SYNC_INTERVAL_MS = 15 * 60 * 1000
