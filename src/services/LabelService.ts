import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirestoreDb } from '@/firebase/firestore'
import { labelsCollectionPath } from '@/firebase/firestore'
import type { Label } from '@/types'
import { normalizeLabelName } from '@/parser/labelParser'

export class LabelService {
  constructor(private readonly userId: string) {}

  private get collectionRef() {
    return collection(getFirestoreDb(), labelsCollectionPath(this.userId))
  }

  subscribe(callback: (labels: Label[]) => void, onError?: (error: Error) => void): Unsubscribe {
    const q = query(this.collectionRef, orderBy('name'))

    return onSnapshot(
      q,
      (snapshot) => {
        const labels = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Label)
        callback(labels)
      },
      (error) => onError?.(error),
    )
  }

  async list(): Promise<Label[]> {
    const snapshot = await getDocs(query(this.collectionRef, orderBy('name')))
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Label)
  }

  async create(name: string, color?: string): Promise<string> {
    const docRef = await addDoc(this.collectionRef, {
      name: normalizeLabelName(name),
      color: color ?? null,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  }

  async rename(labelId: string, name: string): Promise<void> {
    const docRef = doc(getFirestoreDb(), labelsCollectionPath(this.userId), labelId)
    await updateDoc(docRef, { name: normalizeLabelName(name) })
  }

  async delete(labelId: string): Promise<void> {
    const docRef = doc(getFirestoreDb(), labelsCollectionPath(this.userId), labelId)
    await deleteDoc(docRef)
  }

  async ensureLabelsExist(labelNames: string[]): Promise<void> {
    if (labelNames.length === 0) return

    try {
      const existing = await this.list()
      const existingNames = new Set(existing.map((l) => l.name))

      for (const name of labelNames) {
        const normalized = normalizeLabelName(name)
        if (!existingNames.has(normalized)) {
          await this.create(normalized)
        }
      }
    } catch (error) {
      console.warn('Failed to ensure labels exist:', error)
    }
  }
}
