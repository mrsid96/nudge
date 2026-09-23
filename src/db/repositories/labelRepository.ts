import { Timestamp } from 'firebase/firestore'
import { db } from '@/db/database'
import type { LocalLabel } from '@/db/schemas'
import { rehydrateLocalLabel, toLabel } from '@/db/serialization'
import type { Label } from '@/types'
import { normalizeLabelName } from '@/parser/labelParser'
import { SyncRepository } from './syncRepository'

export class LabelRepository {
  readonly userId: string

  constructor(
    userId: string,
    private readonly syncRepo = new SyncRepository(),
  ) {
    this.userId = userId
  }

  async getAll(): Promise<Label[]> {
    const rows = await db.labels.where('userId').equals(this.userId).sortBy('name')
    return rows.map((row) => toLabel(rehydrateLocalLabel(row)))
  }

  async getAllLocal(): Promise<LocalLabel[]> {
    const rows = await db.labels.where('userId').equals(this.userId).toArray()
    return rows.map(rehydrateLocalLabel)
  }

  async create(name: string, color?: string): Promise<Label> {
    const normalized = normalizeLabelName(name)
    const existing = await db.labels
      .where('[userId+name]')
      .equals([this.userId, normalized])
      .first()

    if (existing) return toLabel(rehydrateLocalLabel(existing))

    const label: LocalLabel = {
      id: crypto.randomUUID(),
      userId: this.userId,
      name: normalized,
      color,
      createdAt: Timestamp.now(),
      syncStatus: 'pending',
      localUpdatedAt: Date.now(),
    }

    await db.labels.put(label)
    await this.syncRepo.add({
      id: crypto.randomUUID(),
      userId: this.userId,
      entityType: 'label',
      entityId: label.id,
      operation: 'create',
      payload: { name: normalized, color },
      createdAt: Date.now(),
      retryCount: 0,
      status: 'pending',
    })

    return toLabel(label)
  }

  async ensureLabelsExist(names: string[]): Promise<void> {
    for (const name of names) {
      await this.create(name)
    }
  }

  async bulkPut(labels: LocalLabel[]): Promise<void> {
    await db.labels.bulkPut(labels.map(rehydrateLocalLabel))
  }

  async clearUser(): Promise<void> {
    await db.labels.where('userId').equals(this.userId).delete()
  }
}
