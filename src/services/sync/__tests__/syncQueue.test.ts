import { describe, expect, it } from 'vitest'
import { getRetryDelay, nextRetryState, shouldProcessOp } from '../syncQueue'
import type { SyncOperation } from '@/db/schemas'

function makeOp(overrides: Partial<SyncOperation> = {}): SyncOperation {
  return {
    id: 'op-1',
    userId: 'user-1',
    entityType: 'todo',
    entityId: 'todo-1',
    operation: 'create',
    createdAt: Date.now(),
    retryCount: 0,
    status: 'pending',
    ...overrides,
  }
}

describe('syncQueue', () => {
  it('uses exponential backoff delays', () => {
    expect(getRetryDelay(0)).toBe(0)
    expect(getRetryDelay(1)).toBe(2000)
    expect(getRetryDelay(2)).toBe(5000)
    expect(getRetryDelay(4)).toBe(30000)
  })

  it('respects nextRetryAt', () => {
    const op = makeOp({ nextRetryAt: Date.now() + 60_000 })
    expect(shouldProcessOp(op)).toBe(false)
  })

  it('marks failed after max retries', () => {
    const op = makeOp({ retryCount: 4 })
    const next = nextRetryState(op, new Error('network'))
    expect(next.status).toBe('failed')
    expect(next.lastError).toBe('network')
  })
})
