import { getAuth } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirestoreDb, todosCollectionPath } from '@/firebase/firestore'
import type { Todo } from '@/types'
import { buildSearchText } from '@/utils/searchText'
import type { CreateTodoInput, UpdateTodoInput } from './types'

function dateToTimestamp(date: Date | null | undefined): Timestamp | null {
  if (!date) return null
  return Timestamp.fromDate(date)
}

function docToTodo(id: string, data: Record<string, unknown>): Todo {
  return { id, ...data } as Todo
}

export class FirestoreTodoService {
  constructor(private readonly userId: string) {}

  private get collectionRef() {
    return collection(getFirestoreDb(), todosCollectionPath(this.userId))
  }

  subscribeAll(onChange: (todos: Todo[]) => void, onError?: (error: Error) => void): Unsubscribe {
    return onSnapshot(
      this.collectionRef,
      (snapshot) => {
        const todos = snapshot.docs.map((d) => docToTodo(d.id, d.data()))
        onChange(todos)
      },
      (error) => onError?.(error),
    )
  }

  async fetchAll(): Promise<Todo[]> {
    await this.ensureAuthReady()
    const snapshot = await getDocs(this.collectionRef)
    return snapshot.docs.map((d) => docToTodo(d.id, d.data()))
  }

  async createWithId(todoId: string, input: CreateTodoInput): Promise<void> {
    await this.ensureAuthReady()

    const now = Timestamp.now()
    const searchText = buildSearchText({
      title: input.title,
      description: input.description,
      person: input.person,
      project: input.project,
      labels: input.labels,
      type: input.type,
    })

    await setDoc(doc(this.collectionRef, todoId), {
      userId: this.userId,
      title: input.title,
      description: input.description ?? null,
      status: 'active',
      type: input.type ?? 'task',
      priority: input.priority ?? 'none',
      labels: input.labels ?? [],
      person: input.person ?? null,
      project: input.project ?? null,
      dueAt: input.dueAt ? dateToTimestamp(input.dueAt) : null,
      reminderAt: input.reminderAt ? dateToTimestamp(input.reminderAt) : null,
      completedAt: null,
      snoozedUntil: null,
      searchText,
      source: input.source ? { type: input.source } : { type: 'manual' },
      createdAt: now,
      updatedAt: now,
    })
  }

  async update(todoId: string, input: UpdateTodoInput, existing?: Todo): Promise<void> {
    await this.ensureAuthReady()
    const docRef = doc(getFirestoreDb(), todosCollectionPath(this.userId), todoId)
    const updates: Record<string, unknown> = { updatedAt: serverTimestamp() }

    if (input.title !== undefined) updates.title = input.title
    if (input.description !== undefined) updates.description = input.description
    if (input.status !== undefined) updates.status = input.status
    if (input.type !== undefined) updates.type = input.type
    if (input.priority !== undefined) updates.priority = input.priority
    if (input.labels !== undefined) updates.labels = input.labels
    if (input.person !== undefined) updates.person = input.person
    if (input.project !== undefined) updates.project = input.project
    if (input.dueAt !== undefined) updates.dueAt = dateToTimestamp(input.dueAt)
    if (input.reminderAt !== undefined) updates.reminderAt = dateToTimestamp(input.reminderAt)
    if (input.snoozedUntil !== undefined) updates.snoozedUntil = dateToTimestamp(input.snoozedUntil)

    if (input.status === 'completed') {
      updates.completedAt = serverTimestamp()
    }
    if (input.status === 'active') {
      updates.completedAt = null
    }

    if (
      input.title !== undefined ||
      input.description !== undefined ||
      input.person !== undefined ||
      input.project !== undefined ||
      input.labels !== undefined ||
      input.type !== undefined
    ) {
      if (existing) {
        updates.searchText = buildSearchText({
          title: input.title ?? existing.title,
          description: input.description ?? existing.description,
          person: input.person ?? existing.person,
          project: input.project ?? existing.project,
          labels: input.labels ?? existing.labels,
          type: input.type ?? existing.type,
        })
      }
    }

    await updateDoc(docRef, updates)
  }

  async delete(todoId: string): Promise<void> {
    await this.ensureAuthReady()
    const docRef = doc(getFirestoreDb(), todosCollectionPath(this.userId), todoId)
    await deleteDoc(docRef)
  }

  private async ensureAuthReady(): Promise<void> {
    const authUser = getAuth().currentUser
    if (!authUser) throw new Error('Not authenticated')
    await authUser.getIdToken()
  }
}
