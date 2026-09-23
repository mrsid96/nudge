import { describe, it, expect } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import { getFollowUpTodos, sortTodos } from '../todoFilters'
import type { Todo } from '@/types'

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  const now = Timestamp.now()
  return {
    id: '1',
    userId: 'user1',
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

describe('todoFilters', () => {
  it('filters follow-up todos', () => {
    const todos = [
      makeTodo({ type: 'follow_up' }),
      makeTodo({ id: '2', type: 'task' }),
    ]
    expect(getFollowUpTodos(todos)).toHaveLength(1)
  })

  it('sorts urgent before low priority', () => {
    const todos = [
      makeTodo({ id: '1', priority: 'low' }),
      makeTodo({ id: '2', priority: 'urgent' }),
    ]
    const sorted = sortTodos(todos)
    expect(sorted[0].priority).toBe('urgent')
  })
})
