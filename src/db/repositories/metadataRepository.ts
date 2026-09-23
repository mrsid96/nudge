import { db } from '@/db/database'

export class MetadataRepository {
  async get(userId: string, key: string): Promise<string | number | boolean | undefined> {
    const row = await db.metadata.where('[userId+key]').equals([userId, key]).first()
    return row?.value
  }

  async set(userId: string, key: string, value: string | number | boolean): Promise<void> {
    const existing = await db.metadata.where('[userId+key]').equals([userId, key]).first()
    if (existing?.id) {
      await db.metadata.update(existing.id, { value })
      return
    }
    await db.metadata.add({ userId, key, value })
  }

  async isBootstrapped(userId: string): Promise<boolean> {
    return (await this.get(userId, 'bootstrapped')) === true
  }

  async markBootstrapped(userId: string): Promise<void> {
    await this.set(userId, 'bootstrapped', true)
  }

  async getLastSyncedAt(userId: string): Promise<number | null> {
    const value = await this.get(userId, 'lastSyncedAt')
    return typeof value === 'number' ? value : null
  }

  async setLastSyncedAt(userId: string, timestamp: number): Promise<void> {
    await this.set(userId, 'lastSyncedAt', timestamp)
  }
}
