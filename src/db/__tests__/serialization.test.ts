import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'
import { rehydrateLocalTodo, rehydrateTimestamp, toTodo } from '@/db/serialization'
import type { LocalTodo } from '@/db/schemas'

function makeLocalTodo(): LocalTodo {
  const now = Timestamp.now()
  return {
    id: '1',
    userId: 'user-1',
    title: 'Follow up tomorrow',
    status: 'active',
    type: 'follow_up',
    priority: 'none',
    labels: [],
    searchText: 'follow up tomorrow',
    createdAt: now,
    updatedAt: now,
    reminderAt: Timestamp.fromDate(new Date('2026-09-24T09:00:00')),
    syncStatus: 'pending',
    localUpdatedAt: Date.now(),
  }
}

describe('serialization', () => {
  it('rehydrates plain timestamp objects from IndexedDB', () => {
    const raw = { seconds: 1_700_000_000, nanoseconds: 0 }
    const ts = rehydrateTimestamp(raw)
    expect(ts?.toDate()).toEqual(new Timestamp(raw.seconds, raw.nanoseconds).toDate())
  })

  it('round-trips todos with dates through IDB shape', () => {
    const original = makeLocalTodo()
    const stored = JSON.parse(JSON.stringify(original)) as LocalTodo
    const todo = toTodo(stored)

    expect(todo.reminderAt?.toDate()).toEqual(original.reminderAt?.toDate())
    expect(typeof todo.reminderAt?.toDate).toBe('function')
  })

  it('rehydrateLocalTodo restores all timestamp fields', () => {
    const stored = JSON.parse(JSON.stringify(makeLocalTodo())) as LocalTodo
    const hydrated = rehydrateLocalTodo(stored)
    expect(hydrated.reminderAt?.toMillis()).toBeGreaterThan(0)
  })
})
