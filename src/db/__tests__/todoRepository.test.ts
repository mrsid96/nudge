import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/database'
import { TodoRepository } from '@/db/repositories/todoRepository'
import { buildLocalTodo } from '@/services/local/todoMutations'

const USER_ID = 'test-user'

describe('TodoRepository', () => {
  beforeEach(async () => {
    await db.todos.clear()
    await db.syncQueue.clear()
  })

  it('creates and reads todos from IndexedDB', async () => {
    const repo = new TodoRepository(USER_ID)
    const todo = buildLocalTodo(USER_ID, 'todo-1', { title: 'Follow up with Rahul' })
    await repo.create(todo)

    const all = await repo.getAll()
    expect(all).toHaveLength(1)
    expect(all[0].title).toBe('Follow up with Rahul')
  })

  it('updates todos locally without Firestore', async () => {
    const repo = new TodoRepository(USER_ID)
    const todo = buildLocalTodo(USER_ID, 'todo-2', { title: 'Draft email' })
    await repo.create(todo)

    await repo.update('todo-2', { title: 'Send email' }, { title: 'Send email' })
    const updated = await repo.getById('todo-2')
    expect(updated?.title).toBe('Send email')
  })

  it('queues sync operations on create', async () => {
    const repo = new TodoRepository(USER_ID)
    const todo = buildLocalTodo(USER_ID, 'todo-3', { title: 'Queued task' })
    await repo.create(todo)

    const ops = await db.syncQueue.where('userId').equals(USER_ID).toArray()
    expect(ops).toHaveLength(1)
    expect(ops[0].operation).toBe('create')
    expect(ops[0].entityId).toBe('todo-3')
  })

  it('search does not use Firestore', async () => {
    const repo = new TodoRepository(USER_ID)
    await repo.create(buildLocalTodo(USER_ID, 'a', { title: 'campaign review', labels: ['backend'] }))
    await repo.create(buildLocalTodo(USER_ID, 'b', { title: 'other task' }))

    const results = await repo.search('#backend')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('a')
  })
})
