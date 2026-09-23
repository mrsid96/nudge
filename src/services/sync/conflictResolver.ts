import type { LocalTodo } from '@/db/schemas'
import { rehydrateLocalTodo, stampToMillis } from '@/db/serialization'
import type { Todo } from '@/types'

export function remoteToLocalTodo(
  remote: Todo,
  syncStatus: LocalTodo['syncStatus'] = 'synced',
): LocalTodo {
  return rehydrateLocalTodo({
    ...remote,
    userId: remote.userId,
    syncStatus,
    localUpdatedAt: stampToMillis(remote.updatedAt),
    serverUpdatedAt: stampToMillis(remote.updatedAt),
  })
}

export function resolveTodoMerge(
  local: LocalTodo | undefined,
  remote: Todo,
  hasPendingOps: boolean,
): LocalTodo | null {
  if (local?.deleted && !hasPendingOps) {
    return null
  }

  if (hasPendingOps && local) {
    return rehydrateLocalTodo(local)
  }

  if (!local) {
    return remoteToLocalTodo(remote)
  }

  const remoteUpdated = stampToMillis(remote.updatedAt)
  const localUpdated = local.localUpdatedAt

  if (remoteUpdated > localUpdated) {
    return remoteToLocalTodo(remote)
  }

  return rehydrateLocalTodo(local)
}
