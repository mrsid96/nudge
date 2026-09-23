import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'
import { resolveTodoMerge } from '../conflictResolver'
import type { LocalTodo } from '@/db/schemas'
import type { Todo } from '@/types'

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  const now = Timestamp.now()
  return {
    id: '1',
    userId: 'user',
    title: 'Test',
    status: 'active',
    type: 'task',
    priority: 'none',
    labels: [],
    searchText: 'test',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function makeLocal(overrides: Partial<LocalTodo> = {}): LocalTodo {
  const todo = makeTodo()
  return {
    ...todo,
    syncStatus: 'pending',
    localUpdatedAt: Date.now(),
    ...overrides,
  }
}

describe('conflictResolver', () => {
  it('preserves local when pending ops exist', () => {
    const local = makeLocal({ title: 'Local title' })
    const remote = makeTodo({ title: 'Remote title' })
    expect(resolveTodoMerge(local, remote, true)?.title).toBe('Local title')
  })

  it('accepts remote when newer', () => {
    const local = makeLocal({ localUpdatedAt: 1000 })
    const remote = makeTodo({ title: 'Remote', updatedAt: Timestamp.fromMillis(5000) })
    expect(resolveTodoMerge(local, remote, false)?.title).toBe('Remote')
  })
})
