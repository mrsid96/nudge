import { clearUserData } from '@/db/repositories/userDataRepository'

export async function clearSessionData(userId: string): Promise<void> {
  await clearUserData(userId)
}
