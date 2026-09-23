import { Timestamp } from 'firebase/firestore'
import type { LocalLabel, LocalTodo } from '@/db/schemas'
import type { Label, Todo } from '@/types'

type StoredTimestamp =
  | Timestamp
  | { seconds: number; nanoseconds: number }
  | null
  | undefined

/** Rehydrate a Firestore Timestamp after IndexedDB round-trip. */
export function rehydrateTimestamp(ts: StoredTimestamp): Timestamp | undefined {
  if (!ts) return undefined
  if (ts instanceof Timestamp) return ts
  if (typeof (ts as Timestamp).toDate === 'function') return ts as Timestamp
  if (typeof ts === 'object' && 'seconds' in ts && 'nanoseconds' in ts) {
    return new Timestamp(ts.seconds, ts.nanoseconds)
  }
  return undefined
}

export function timestampToDate(ts: StoredTimestamp): Date | undefined {
  return rehydrateTimestamp(ts)?.toDate()
}

export function stampToMillis(ts: StoredTimestamp): number {
  return rehydrateTimestamp(ts)?.toMillis() ?? 0
}

export function rehydrateLocalTodo(raw: LocalTodo): LocalTodo {
  return {
    ...raw,
    createdAt: rehydrateTimestamp(raw.createdAt) ?? Timestamp.now(),
    updatedAt: rehydrateTimestamp(raw.updatedAt) ?? Timestamp.now(),
    dueAt: rehydrateTimestamp(raw.dueAt),
    reminderAt: rehydrateTimestamp(raw.reminderAt),
    reminderNotifiedAt: rehydrateTimestamp(raw.reminderNotifiedAt),
    completedAt: rehydrateTimestamp(raw.completedAt),
    snoozedUntil: rehydrateTimestamp(raw.snoozedUntil),
  }
}

export function rehydrateLocalLabel(raw: LocalLabel): LocalLabel {
  return {
    ...raw,
    createdAt: rehydrateTimestamp(raw.createdAt) ?? Timestamp.now(),
  }
}

export function toTodo(local: LocalTodo): Todo {
  const hydrated = rehydrateLocalTodo(local)
  const { syncStatus: _s, localUpdatedAt: _l, serverUpdatedAt: _r, deleted: _d, ...todo } = hydrated
  return todo
}

export function toLabel(local: LocalLabel): Label {
  const { syncStatus: _s, localUpdatedAt: _l, serverUpdatedAt: _r, userId: _u, ...label } =
    rehydrateLocalLabel(local)
  return label
}
