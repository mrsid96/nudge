import { Timestamp } from 'firebase/firestore'
import { db } from '@/db/database'
import type { LocalTodo } from '@/db/schemas'
import { rehydrateLocalTodo, toTodo } from '@/db/serialization'
import type { Todo } from '@/types'
import { buildSearchText } from '@/utils/searchText'
import { searchTodos } from '@/services/SearchService'
import type { UpdateTodoInput } from '@/services/firestore/types'
import { SyncRepository } from './syncRepository'

export class TodoRepository {
  readonly userId: string

  constructor(
    userId: string,
    private readonly syncRepo = new SyncRepository(),
  ) {
    this.userId = userId
  }

  async getAll(): Promise<Todo[]> {
    const rows = await db.todos.where('userId').equals(this.userId).toArray()
    return rows.filter((t) => !t.deleted).map((row) => toTodo(rehydrateLocalTodo(row)))
  }

  async getAllLocal(): Promise<LocalTodo[]> {
    const rows = await db.todos.where('userId').equals(this.userId).toArray()
    return rows.map(rehydrateLocalTodo)
  }

  async getById(id: string): Promise<Todo | null> {
    const row = await db.todos.get(id)
    if (!row || row.userId !== this.userId || row.deleted) return null
    return toTodo(rehydrateLocalTodo(row))
  }

  async getLocalById(id: string): Promise<LocalTodo | null> {
    const row = await db.todos.get(id)
    if (!row || row.userId !== this.userId) return null
    return rehydrateLocalTodo(row)
  }

  async create(todo: LocalTodo): Promise<void> {
    await db.todos.put(todo)
    await this.enqueue('create', todo.id, { todoId: todo.id })
  }

  async update(
    id: string,
    patch: Partial<LocalTodo>,
    syncPayload?: UpdateTodoInput,
  ): Promise<Todo | null> {
    const existing = await this.getLocalById(id)
    if (!existing || existing.deleted) return null

    const updated: LocalTodo = {
      ...existing,
      ...patch,
      localUpdatedAt: Date.now(),
      syncStatus: 'pending',
      updatedAt: patch.updatedAt ?? Timestamp.now(),
    }

    await db.todos.put(updated)
    await this.enqueue('update', id, syncPayload ?? (patch as Record<string, unknown>))
    return toTodo(updated)
  }

  async delete(id: string): Promise<void> {
    const existing = await this.getLocalById(id)
    if (!existing) return

    await db.todos.put({
      ...existing,
      deleted: true,
      localUpdatedAt: Date.now(),
      syncStatus: 'pending',
    })
    await this.enqueue('delete', id)
  }

  async search(query: string): Promise<Todo[]> {
    return searchTodos(await this.getAll(), query)
  }

  async upsertFromRemote(todo: LocalTodo): Promise<void> {
    await db.todos.put(rehydrateLocalTodo(todo))
  }

  async bulkPut(todos: LocalTodo[]): Promise<void> {
    await db.todos.bulkPut(todos.map(rehydrateLocalTodo))
  }

  async removeSyncedDelete(id: string): Promise<void> {
    await db.todos.delete(id)
  }

  async clearUser(): Promise<void> {
    await db.todos.where('userId').equals(this.userId).delete()
  }

  private async enqueue(
    operation: 'create' | 'update' | 'delete',
    entityId: string,
    payload?: unknown,
  ): Promise<void> {
    await this.syncRepo.add({
      id: crypto.randomUUID(),
      userId: this.userId,
      entityType: 'todo',
      entityId,
      operation,
      payload,
      createdAt: Date.now(),
      retryCount: 0,
      status: 'pending',
    })
  }

  buildSearchTextForTodo(todo: Partial<Todo> & { title: string }): string {
    return buildSearchText({
      title: todo.title,
      description: todo.description,
      person: todo.person,
      project: todo.project,
      labels: todo.labels,
      type: todo.type,
    })
  }
}
