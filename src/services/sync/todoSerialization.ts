import { Timestamp } from 'firebase/firestore'
import type { Todo } from '@/types'

interface SerializedTimestamp {
  seconds: number
  nanoseconds: number
}

type SerializedTodo = Omit<Todo, 'createdAt' | 'updatedAt' | 'dueAt' | 'reminderAt' | 'reminderNotifiedAt' | 'completedAt' | 'snoozedUntil'> & {
  createdAt: SerializedTimestamp
  updatedAt: SerializedTimestamp
  dueAt?: SerializedTimestamp | null
  reminderAt?: SerializedTimestamp | null
  reminderNotifiedAt?: SerializedTimestamp | null
  completedAt?: SerializedTimestamp | null
  snoozedUntil?: SerializedTimestamp | null
}

function serializeTimestamp(ts: Timestamp): SerializedTimestamp {
  return { seconds: ts.seconds, nanoseconds: ts.nanoseconds }
}

function deserializeTimestamp(ts: SerializedTimestamp): Timestamp {
  return new Timestamp(ts.seconds, ts.nanoseconds)
}

function serializeOptionalTimestamp(ts?: Timestamp | null): SerializedTimestamp | null | undefined {
  if (ts === undefined) return undefined
  if (ts === null) return null
  return serializeTimestamp(ts)
}

function deserializeOptionalTimestamp(
  ts?: SerializedTimestamp | null,
): Timestamp | null | undefined {
  if (ts === undefined) return undefined
  if (ts === null) return null
  return deserializeTimestamp(ts)
}

export function serializeTodo(todo: Todo): SerializedTodo {
  return {
    ...todo,
    createdAt: serializeTimestamp(todo.createdAt),
    updatedAt: serializeTimestamp(todo.updatedAt),
    dueAt: serializeOptionalTimestamp(todo.dueAt),
    reminderAt: serializeOptionalTimestamp(todo.reminderAt),
    reminderNotifiedAt: serializeOptionalTimestamp(todo.reminderNotifiedAt),
    completedAt: serializeOptionalTimestamp(todo.completedAt),
    snoozedUntil: serializeOptionalTimestamp(todo.snoozedUntil),
  }
}

function toOptionalField(ts?: SerializedTimestamp | null): Timestamp | undefined {
  const value = deserializeOptionalTimestamp(ts)
  return value === null ? undefined : value
}

export function deserializeTodo(stored: SerializedTodo): Todo {
  return {
    ...stored,
    createdAt: deserializeTimestamp(stored.createdAt),
    updatedAt: deserializeTimestamp(stored.updatedAt),
    dueAt: toOptionalField(stored.dueAt),
    reminderAt: toOptionalField(stored.reminderAt),
    reminderNotifiedAt: toOptionalField(stored.reminderNotifiedAt),
    completedAt: toOptionalField(stored.completedAt),
    snoozedUntil: toOptionalField(stored.snoozedUntil),
  }
}
