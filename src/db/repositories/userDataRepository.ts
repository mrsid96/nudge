import { db } from '@/db/database'
import { LabelRepository } from './labelRepository'
import { SyncRepository } from './syncRepository'
import { TodoRepository } from './todoRepository'

export async function clearUserData(userId: string): Promise<void> {
  await new TodoRepository(userId).clearUser()
  await new LabelRepository(userId).clearUser()
  await new SyncRepository().clearUser(userId)
  await db.metadata.where('userId').equals(userId).delete()
}

export async function clearAllLocalData(): Promise<void> {
  await db.todos.clear()
  await db.labels.clear()
  await db.syncQueue.clear()
  await db.metadata.clear()
}
