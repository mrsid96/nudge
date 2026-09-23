import { getAuth } from 'firebase/auth'
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  doc,
} from 'firebase/firestore'
import { getFirestoreDb, labelsCollectionPath } from '@/firebase/firestore'
import type { Label } from '@/types'
import { normalizeLabelName } from '@/parser/labelParser'

export class FirestoreLabelService {
  constructor(private readonly userId: string) {}

  private get collectionRef() {
    return collection(getFirestoreDb(), labelsCollectionPath(this.userId))
  }

  async fetchAll(): Promise<Label[]> {
    await this.ensureAuthReady()
    const snapshot = await getDocs(query(this.collectionRef, orderBy('name')))
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Label)
  }

  async createWithId(labelId: string, name: string, color?: string): Promise<void> {
    await this.ensureAuthReady()
    await setDoc(doc(this.collectionRef, labelId), {
      name: normalizeLabelName(name),
      color: color ?? null,
      createdAt: serverTimestamp(),
    })
  }

  async create(name: string, color?: string): Promise<string> {
    await this.ensureAuthReady()
    const docRef = await addDoc(this.collectionRef, {
      name: normalizeLabelName(name),
      color: color ?? null,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  }

  private async ensureAuthReady(): Promise<void> {
    const authUser = getAuth().currentUser
    if (!authUser) throw new Error('Not authenticated')
    await authUser.getIdToken()
  }
}
