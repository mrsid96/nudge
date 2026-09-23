import Dexie, { type Table } from 'dexie'
import type { DbMetadata, LocalLabel, LocalTodo, SyncOperation } from './schemas'

export class NudgeDatabase extends Dexie {
  todos!: Table<LocalTodo, string>
  labels!: Table<LocalLabel, string>
  syncQueue!: Table<SyncOperation, string>
  metadata!: Table<DbMetadata, number>

  constructor() {
    super('todo-local-db')
    this.version(1).stores({
      todos: 'id, userId, syncStatus, localUpdatedAt, status, [userId+status]',
      labels: 'id, userId, syncStatus, name, [userId+name]',
      syncQueue: 'id, userId, entityId, status, createdAt, nextRetryAt, [userId+status]',
      metadata: '++id, userId, key, [userId+key]',
    })
  }
}

export const db = new NudgeDatabase()
