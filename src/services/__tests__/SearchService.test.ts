import { describe, it, expect } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import { parseSearchQuery, searchTodos, filterTodos } from '../SearchService'
import type { Todo } from '@/types'

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  const now = Timestamp.now()
  return {
    id: '1',
    userId: 'user1',
    title: 'Follow up with Rahul about campaign API',
    status: 'active',
    type: 'follow_up',
    priority: 'high',
    labels: ['backend', 'campaign'],
    person: 'Rahul',
    searchText: 'follow up with rahul about campaign api rahul campaign api backend follow-up',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('SearchService', () => {
  it('parses label search', () => {
    const filters = parseSearchQuery('#backend status:active')
    expect(filters.labels).toEqual(['backend'])
    expect(filters.status).toBe('active')
  })

  it('parses person search', () => {
    const filters = parseSearchQuery('@rahul')
    expect(filters.person).toBe('rahul')
  })

  it('parses type filter', () => {
    const filters = parseSearchQuery('type:follow-up')
    expect(filters.type).toBe('follow_up')
  })

  it('searches by text', () => {
    const todos = [makeTodo(), makeTodo({ id: '2', title: 'Buy groceries', searchText: 'buy groceries' })]
    const results = searchTodos(todos, 'campaign')
    expect(results).toHaveLength(1)
  })

  it('filters by priority', () => {
    const todos = [
      makeTodo(),
      makeTodo({ id: '2', priority: 'low', searchText: 'low task' }),
    ]
    const results = filterTodos(todos, { priority: 'high' })
    expect(results).toHaveLength(1)
  })
})
