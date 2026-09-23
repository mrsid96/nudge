import type { Unsubscribe } from 'firebase/firestore'
import type { LocalLabel, SyncOperation } from '@/db/schemas'
import type { LabelRepository } from '@/db/repositories/labelRepository'
import { MetadataRepository } from '@/db/repositories/metadataRepository'
import { SyncRepository } from '@/db/repositories/syncRepository'
import type { TodoRepository } from '@/db/repositories/todoRepository'
import { stampToMillis } from '@/db/serialization'
import { FirestoreLabelService } from '@/services/firestore/firestoreLabelService'
import { FirestoreTodoService } from '@/services/firestore/firestoreTodoService'
import type { UpdateTodoInput } from '@/services/firestore/types'
import { localTodoToCreateInput } from '@/services/local/todoMutations'
import type { Label, Todo } from '@/types'
import { remoteToLocalTodo, resolveTodoMerge } from './conflictResolver'
import { nextRetryState, shouldProcessOp } from './syncQueue'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'

export const SYNC_INTERVAL_MS = 15 * 60 * 1000
const SYNC_DEBOUNCE_MS = 300

export interface SyncEngineDeps {
  userId: string
  todoRepo: TodoRepository
  labelRepo: LabelRepository
  onDataChange: () => void
}

export class SyncEngine {
  private readonly userId: string
  private readonly todoRepo: TodoRepository
  private readonly labelRepo: LabelRepository
  private readonly syncRepo: SyncRepository
  private readonly metadataRepo: MetadataRepository
  private readonly remoteTodos: FirestoreTodoService
  private readonly remoteLabels: FirestoreLabelService
  private readonly onDataChange: () => void

  private firestoreUnsub: Unsubscribe | null = null
  private intervalId: number | null = null
  private syncDebounceId: number | null = null
  private syncing = false
  private stopped = false

  constructor(deps: SyncEngineDeps) {
    this.userId = deps.userId
    this.todoRepo = deps.todoRepo
    this.labelRepo = deps.labelRepo
    this.onDataChange = deps.onDataChange
    this.syncRepo = new SyncRepository()
    this.metadataRepo = new MetadataRepository()
    this.remoteTodos = new FirestoreTodoService(deps.userId)
    this.remoteLabels = new FirestoreLabelService(deps.userId)
  }

  async initialize(): Promise<void> {
    await this.syncRepo.resetStuckOperations(this.userId)

    const bootstrapped = await this.metadataRepo.isBootstrapped(this.userId)
    const localCount = (await this.todoRepo.getAllLocal()).length

    if (!bootstrapped && localCount === 0) {
      await this.bootstrapFromRemote()
    }
  }

  start(): void {
    this.stopped = false

    this.firestoreUnsub = this.remoteTodos.subscribeAll(
      (remoteTodos) => void this.applyRemoteSnapshot(remoteTodos),
      (error) => console.warn('Firestore listener error:', error),
    )

    this.intervalId = window.setInterval(() => void this.sync(), SYNC_INTERVAL_MS)
    window.addEventListener('online', this.handleOnline)
    document.addEventListener('visibilitychange', this.handleVisibility)

    void this.sync()
  }

  stop(): void {
    this.stopped = true
    this.firestoreUnsub?.()
    this.firestoreUnsub = null
    if (this.intervalId) window.clearInterval(this.intervalId)
    if (this.syncDebounceId) window.clearTimeout(this.syncDebounceId)
    window.removeEventListener('online', this.handleOnline)
    document.removeEventListener('visibilitychange', this.handleVisibility)
  }

  scheduleSync(): void {
    if (this.stopped) return
    if (this.syncDebounceId) window.clearTimeout(this.syncDebounceId)
    this.syncDebounceId = window.setTimeout(() => void this.sync(), SYNC_DEBOUNCE_MS)
  }

  async sync(): Promise<void> {
    if (this.stopped || this.syncing) return
    if (!navigator.onLine) return

    this.syncing = true
    try {
      await this.syncPendingChanges()
      await this.pullRemoteChanges()
      await this.metadataRepo.setLastSyncedAt(this.userId, Date.now())
      this.onDataChange()
    } finally {
      this.syncing = false
    }
  }

  async countPending(): Promise<number> {
    return this.syncRepo.countPending(this.userId)
  }

  async getLastSyncedAt(): Promise<number | null> {
    return this.metadataRepo.getLastSyncedAt(this.userId)
  }

  private handleOnline = (): void => {
    void this.sync()
  }

  private handleVisibility = (): void => {
    if (document.visibilityState === 'visible') void this.sync()
  }

  private async bootstrapFromRemote(): Promise<void> {
    try {
      const [remoteTodos, remoteLabels] = await Promise.all([
        this.remoteTodos.fetchAll(),
        this.remoteLabels.fetchAll(),
      ])

      await this.todoRepo.bulkPut(remoteTodos.map((t) => remoteToLocalTodo(t)))
      await this.labelRepo.bulkPut(
        remoteLabels.map((l) => ({
          ...l,
          userId: this.userId,
          syncStatus: 'synced' as const,
          localUpdatedAt: stampToMillis(l.createdAt),
          serverUpdatedAt: stampToMillis(l.createdAt),
        })),
      )
      await this.metadataRepo.markBootstrapped(this.userId)
    } catch (error) {
      console.warn('Bootstrap from Firestore failed — using local data:', error)
    }
  }

  private async syncPendingChanges(): Promise<void> {
    const pending = await this.syncRepo.getPending(this.userId)

    for (const op of pending) {
      if (!shouldProcessOp(op)) continue

      await this.syncRepo.updateStatus(op.id, 'syncing')

      try {
        await this.applyOperation(op)
        await this.syncRepo.remove(op.id)

        if (op.entityType === 'todo' && op.operation !== 'delete') {
          const local = await this.todoRepo.getLocalById(op.entityId)
          if (local) {
            await this.todoRepo.upsertFromRemote({
              ...local,
              syncStatus: 'synced',
              serverUpdatedAt: Date.now(),
            })
          }
        }
      } catch (error) {
        const patch = nextRetryState(op, error instanceof Error ? error : new Error('Sync failed'))
        await this.syncRepo.updateStatus(op.id, patch.status ?? 'pending', patch)
      }
    }
  }

  private async applyOperation(op: SyncOperation): Promise<void> {
    if (op.entityType === 'todo') {
      await this.applyTodoOperation(op)
      return
    }
    if (op.entityType === 'label') {
      await this.applyLabelOperation(op)
    }
  }

  private async applyTodoOperation(op: SyncOperation): Promise<void> {
    switch (op.operation) {
      case 'create': {
        const local = await this.todoRepo.getLocalById(op.entityId)
        if (!local) return
        await this.remoteTodos.createWithId(op.entityId, localTodoToCreateInput(local))
        return
      }
      case 'update': {
        const local = await this.todoRepo.getLocalById(op.entityId)
        const payload = (op.payload ?? {}) as UpdateTodoInput
        await this.remoteTodos.update(op.entityId, payload, local ?? undefined)
        return
      }
      case 'delete': {
        await this.remoteTodos.delete(op.entityId)
        await this.todoRepo.removeSyncedDelete(op.entityId)
        return
      }
    }
  }

  private async applyLabelOperation(op: SyncOperation): Promise<void> {
    if (op.operation !== 'create') return
    const payload = op.payload as { name: string; color?: string }
    await this.remoteLabels.createWithId(op.entityId, payload.name, payload.color)
  }

  private async pullRemoteChanges(): Promise<void> {
    const [remoteTodos, remoteLabels] = await Promise.all([
      this.remoteTodos.fetchAll(),
      this.remoteLabels.fetchAll(),
    ])
    await this.mergeRemoteTodos(remoteTodos)
    await this.mergeRemoteLabels(remoteLabels)
  }

  private async applyRemoteSnapshot(remoteTodos: Todo[]): Promise<void> {
    await this.mergeRemoteTodos(remoteTodos)
    this.onDataChange()
  }

  private async mergeRemoteTodos(remoteTodos: Todo[]): Promise<void> {
    const localMap = new Map((await this.todoRepo.getAllLocal()).map((t) => [t.id, t]))
    const remoteIds = new Set(remoteTodos.map((t) => t.id))

    for (const remote of remoteTodos) {
      const local = localMap.get(remote.id)
      const hasPending = await this.syncRepo.hasPendingForEntity(this.userId, remote.id)
      const merged = resolveTodoMerge(local, remote, hasPending)
      if (merged) await this.todoRepo.upsertFromRemote(merged)
    }

    // Remove local copies of remotely deleted todos (no pending local ops)
    for (const [id, local] of localMap) {
      if (!remoteIds.has(id) && !local.deleted) {
        const hasPending = await this.syncRepo.hasPendingForEntity(this.userId, id)
        if (!hasPending) await this.todoRepo.removeSyncedDelete(id)
      }
    }
  }

  private async mergeRemoteLabels(remoteLabels: Label[]): Promise<void> {
    const localLabels = await this.labelRepo.getAllLocal()
    const localNames = new Set(localLabels.map((l) => l.name))

    for (const remote of remoteLabels) {
      if (localNames.has(remote.name)) continue
      const label: LocalLabel = {
        ...remote,
        userId: this.userId,
        syncStatus: 'synced',
        localUpdatedAt: stampToMillis(remote.createdAt),
        serverUpdatedAt: stampToMillis(remote.createdAt),
      }
      await this.labelRepo.bulkPut([label])
    }
  }
}
