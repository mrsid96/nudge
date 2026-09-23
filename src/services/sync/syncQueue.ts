import type { SyncOperation } from '@/db/schemas'

export const RETRY_DELAYS_MS = [0, 2000, 5000, 15000, 30000]

export function getRetryDelay(retryCount: number): number {
  const index = Math.min(retryCount, RETRY_DELAYS_MS.length - 1)
  return RETRY_DELAYS_MS[index]
}

export function shouldProcessOp(op: SyncOperation): boolean {
  if (op.status === 'syncing') return false
  if (!op.nextRetryAt) return true
  return op.nextRetryAt <= Date.now()
}

export function nextRetryState(op: SyncOperation, error: Error): Partial<SyncOperation> {
  const retryCount = op.retryCount + 1
  const delay = getRetryDelay(retryCount)
  return {
    retryCount,
    status: retryCount >= RETRY_DELAYS_MS.length ? 'failed' : 'pending',
    lastError: error.message,
    nextRetryAt: Date.now() + delay,
  }
}
