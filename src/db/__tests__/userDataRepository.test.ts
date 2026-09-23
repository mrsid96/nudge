import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/database'
import { TodoRepository } from '@/db/repositories/todoRepository'
import { clearUserData } from '@/db/repositories/userDataRepository'
import { buildLocalTodo } from '@/services/local/todoMutations'

describe('userDataRepository', () => {
  beforeEach(async () => {
    await db.todos.clear()
    await db.labels.clear()
    await db.syncQueue.clear()
    await db.metadata.clear()
  })

  it('isolates data between user accounts', async () => {
    const userA = new TodoRepository('user-a')
    const userB = new TodoRepository('user-b')

    await userA.create(buildLocalTodo('user-a', 'a1', { title: 'User A task' }))
    await userB.create(buildLocalTodo('user-b', 'b1', { title: 'User B task' }))

    expect(await userA.getAll()).toHaveLength(1)
    expect(await userB.getAll()).toHaveLength(1)

    await clearUserData('user-a')

    expect(await userA.getAll()).toHaveLength(0)
    expect(await userB.getAll()).toHaveLength(1)
  })
})
