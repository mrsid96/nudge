import { Timestamp } from 'firebase/firestore'
import { parseNaturalLanguage } from '@/parser/naturalLanguageParser'
import { LabelService } from '@/services/LabelService'
import { TodoService, type CreateTodoInput, type UpdateTodoInput } from '@/services/TodoService'
import type { Todo } from '@/types'
import { buildSearchText } from '@/utils/searchText'
import { LocalTodoStore, type PendingOperation } from './LocalTodoStore'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

function buildTodoFromCreate(userId: string, todoId: string, input: CreateTodoInput): Todo {
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
  }
}

export class TodoSyncEngine {
  private readonly userId: string
  private readonly store: LocalTodoStore
  private readonly remote: TodoService

  constructor(userId: string) {
    this.userId = userId
    this.store = new LocalTodoStore(userId)
    this.remote = new TodoService(userId)
  }

  loadTodos(): Todo[] {
    return this.store.getTodos()
  }

  getTodo(todoId: string): Todo | null {
    return this.store.getTodo(todoId)
  }

  createFromCapture(text: string): Todo {
    const parsed = parseNaturalLanguage(text)
    const todo = buildTodoFromCreate(this.userId, crypto.randomUUID(), {
      title: parsed.title || text,
      type: parsed.type,
      priority: parsed.priority,
      labels: parsed.labels,
      person: parsed.person,
      reminderAt: parsed.reminderAt,
      dueAt: parsed.dueAt,
      source: 'quick_capture',
    })

    this.store.upsertTodo(todo)
    this.store.addPendingOp({
      id: crypto.randomUUID(),
      type: 'create',
      todoId: todo.id,
      payload: { input: this.todoToCreateInput(todo) },
      createdAt: Date.now(),
    })

    if (parsed.labels?.length) {
      new LabelService(this.userId).ensureLabelsExist(parsed.labels).catch(console.warn)
    }

    return todo
  }

  updateTodo(todoId: string, input: UpdateTodoInput): Todo | null {
    const existing = this.store.getTodo(todoId)
    if (!existing) return null

    const now = Timestamp.now()
    const patch: Partial<Todo> = { updatedAt: now }

    if (input.title !== undefined) patch.title = input.title
    if (input.description !== undefined) patch.description = input.description
    if (input.status !== undefined) patch.status = input.status
    if (input.type !== undefined) patch.type = input.type
    if (input.priority !== undefined) patch.priority = input.priority
    if (input.labels !== undefined) patch.labels = input.labels
    if (input.person !== undefined) patch.person = input.person
    if (input.project !== undefined) patch.project = input.project
    if (input.dueAt !== undefined) {
      patch.dueAt = input.dueAt ? Timestamp.fromDate(input.dueAt) : undefined
    }
    if (input.reminderAt !== undefined) {
      patch.reminderAt = input.reminderAt ? Timestamp.fromDate(input.reminderAt) : undefined
    }
    if (input.snoozedUntil !== undefined) {
      patch.snoozedUntil = input.snoozedUntil ? Timestamp.fromDate(input.snoozedUntil) : undefined
    }
    if (input.status === 'completed') {
      patch.completedAt = now
    }
    if (input.status === 'active') {
      patch.completedAt = undefined
    }

    const updated = this.store.patchTodo(todoId, patch)
    if (!updated) return null

    this.store.addPendingOp({
      id: crypto.randomUUID(),
      type: 'update',
      todoId,
      payload: input as Record<string, unknown>,
      createdAt: Date.now(),
    })

    return updated
  }

  deleteTodo(todoId: string): void {
    this.store.removeTodo(todoId)
    this.store.addPendingOp({
      id: crypto.randomUUID(),
      type: 'delete',
      todoId,
      createdAt: Date.now(),
    })
  }

  hasPendingChanges(): boolean {
    return this.store.getPendingOps().length > 0
  }

  getLastSyncedAt(): number | null {
    return this.store.getLastSyncedAt()
  }

  async sync(): Promise<void> {
    await this.pushPending()
    await this.pullRemote()
    this.store.setLastSyncedAt(Date.now())
  }

  private async pushPending(): Promise<void> {
    const pending = this.store.getPendingOps()
    const completed: string[] = []

    for (const op of pending) {
      try {
        await this.applyPendingOp(op)
        completed.push(op.id)
      } catch (error) {
        console.warn(`Sync failed for op ${op.id}:`, error)
        throw error
      }
    }

    this.store.removePendingOps(completed)
  }

  private async applyPendingOp(op: PendingOperation): Promise<void> {
    switch (op.type) {
      case 'create': {
        const local = this.store.getTodo(op.todoId)
        if (!local) {
          return
        }
        const input = (op.payload?.input as CreateTodoInput | undefined) ?? this.todoToCreateInput(local)
        await this.remote.createWithId(op.todoId, input)
        return
      }
      case 'update': {
        const payload = (op.payload ?? {}) as UpdateTodoInput
        await this.remote.update(op.todoId, payload)
        return
      }
      case 'delete': {
        await this.remote.delete(op.todoId)
        return
      }
    }
  }

  private async pullRemote(): Promise<void> {
    const remoteTodos = await this.remote.fetchAll()
    const pending = this.store.getPendingOps()
    const pendingTodoIds = new Set(pending.map((op) => op.todoId))
    const localTodos = this.store.getTodos()

    const merged = new Map<string, Todo>()

    for (const todo of remoteTodos) {
      merged.set(todo.id, todo)
    }

    for (const todo of localTodos) {
      if (pendingTodoIds.has(todo.id)) {
        merged.set(todo.id, todo)
      }
    }

    this.store.setTodos([...merged.values()])
  }

  private todoToCreateInput(todo: Todo): CreateTodoInput {
    return {
      title: todo.title,
      description: todo.description,
      type: todo.type,
      priority: todo.priority,
      labels: todo.labels,
      person: todo.person,
      project: todo.project,
      dueAt: todo.dueAt?.toDate(),
      reminderAt: todo.reminderAt?.toDate(),
      source: todo.source?.type,
    }
  }
}
