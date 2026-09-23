import type { Label, Todo } from '@/types'

export type SyncEntityStatus = 'synced' | 'pending' | 'failed'

export interface SyncMetadata {
  syncStatus: SyncEntityStatus
  localUpdatedAt: number
  serverUpdatedAt?: number
}

export interface LocalTodo extends Todo, SyncMetadata {
  deleted?: boolean
}

export interface LocalLabel extends Label, SyncMetadata {
  userId: string
}

export type SyncEntityType = 'todo' | 'label'
export type SyncOpType = 'create' | 'update' | 'delete'
export type SyncOpStatus = 'pending' | 'syncing' | 'failed'

export interface SyncOperation {
  id: string
  userId: string
  entityType: SyncEntityType
  entityId: string
  operation: SyncOpType
  payload?: unknown
  createdAt: number
  retryCount: number
  status: SyncOpStatus
  lastError?: string
  nextRetryAt?: number
}

export interface DbMetadata {
  id?: number
  userId: string
  key: string
  value: string | number | boolean
}
