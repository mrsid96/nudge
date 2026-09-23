import { db } from '@/db/database'
import type { SyncOperation, SyncOpStatus } from '@/db/schemas'

export class SyncRepository {
  async getPending(userId: string): Promise<SyncOperation[]> {
    const now = Date.now()
    const ops = await db.syncQueue.where('userId').equals(userId).sortBy('createdAt')
    return ops.filter(
      (op) =>
        (op.status === 'pending' || op.status === 'failed') &&
        (!op.nextRetryAt || op.nextRetryAt <= now),
    )
  }

  async countPending(userId: string): Promise<number> {
    const ops = await db.syncQueue.where('userId').equals(userId).toArray()
    return ops.filter((op) => op.status === 'pending' || op.status === 'failed').length
  }

  async add(op: SyncOperation): Promise<void> {
    await db.syncQueue.put(op)
  }

  async updateStatus(
    id: string,
    status: SyncOpStatus,
    patch: Partial<SyncOperation> = {},
  ): Promise<void> {
    await db.syncQueue.update(id, { status, ...patch })
  }

  async remove(id: string): Promise<void> {
    await db.syncQueue.delete(id)
  }

  /** True when any unsynced operation exists for this entity (including in-flight). */
  async hasPendingForEntity(userId: string, entityId: string): Promise<boolean> {
    const op = await db.syncQueue
      .where('userId')
      .equals(userId)
      .filter((row) => row.entityId === entityId)
      .first()
    return Boolean(op)
  }

  /** Reset ops stuck in `syncing` after a crash or hot reload. */
  async resetStuckOperations(userId: string): Promise<void> {
    const stuck = await db.syncQueue
      .where('userId')
      .equals(userId)
      .filter((row) => row.status === 'syncing')
      .toArray()
    for (const op of stuck) {
      await db.syncQueue.update(op.id, { status: 'pending' })
    }
  }

  async clearUser(userId: string): Promise<void> {
    await db.syncQueue.where('userId').equals(userId).delete()
  }
}
