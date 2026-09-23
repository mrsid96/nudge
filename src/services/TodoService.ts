import { getAuth } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirestoreDb } from '@/firebase/firestore'
import { todosCollectionPath } from '@/firebase/firestore'
import { parseNaturalLanguage } from '@/parser/naturalLanguageParser'
import { LabelService } from '@/services/LabelService'
import type { Todo, TodoPriority, TodoStatus, TodoType } from '@/types'
import { buildSearchText } from '@/utils/searchText'

export interface CreateTodoInput {
  title: string
  description?: string
  type?: TodoType
  priority?: TodoPriority
  labels?: string[]
  person?: string
  project?: string
  dueAt?: Date
  reminderAt?: Date
  source?: 'manual' | 'quick_capture'
}

export interface UpdateTodoInput {
  title?: string
  description?: string
  status?: TodoStatus
  type?: TodoType
  priority?: TodoPriority
  labels?: string[]
  person?: string
  project?: string
  dueAt?: Date | null
  reminderAt?: Date | null
  snoozedUntil?: Date | null
}

function dateToTimestamp(date: Date | null | undefined): Timestamp | null {
  if (!date) return null
  return Timestamp.fromDate(date)
}

function docToTodo(id: string, data: Record<string, unknown>): Todo {
  return { id, ...data } as Todo
}

export class TodoService {
  constructor(private readonly userId: string) {}

  private get collectionRef() {
    return collection(getFirestoreDb(), todosCollectionPath(this.userId))
  }

  subscribeActive(callback: (todos: Todo[]) => void, onError?: (error: Error) => void): Unsubscribe {
    // No orderBy — avoids composite index requirement and null createdAt on pending writes.
    // Sorting is done client-side via sortTodos().
    const q = query(this.collectionRef, where('status', 'in', ['active', 'snoozed']))

    return onSnapshot(
      q,
      (snapshot) => {
        const todos = snapshot.docs.map((d) => docToTodo(d.id, d.data()))
        callback(todos)
      },
      (error) => onError?.(error),
    )
  }

  subscribeCompleted(callback: (todos: Todo[]) => void, onError?: (error: Error) => void): Unsubscribe {
    const q = query(this.collectionRef, where('status', '==', 'completed'))

    return onSnapshot(
      q,
      (snapshot) => {
        const todos = snapshot.docs.map((d) => docToTodo(d.id, d.data()))
        callback(todos)
      },
      (error) => onError?.(error),
    )
  }

  async fetchAll(): Promise<Todo[]> {
    await this.ensureAuthReady()
    const snapshot = await getDocs(this.collectionRef)
    return snapshot.docs.map((d) => docToTodo(d.id, d.data()))
  }

  async create(input: CreateTodoInput): Promise<string> {
    const id = crypto.randomUUID()
    await this.createWithId(id, input)
    return id
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

  private async ensureAuthReady(): Promise<void> {
    const authUser = getAuth().currentUser
    if (!authUser) throw new Error('Not authenticated')
    await authUser.getIdToken()
  }

  async createFromQuickCapture(input: string): Promise<string> {
    const parsed = parseNaturalLanguage(input)
    const id = await this.create({
      title: parsed.title || input,
      type: parsed.type,
      priority: parsed.priority,
      labels: parsed.labels,
      person: parsed.person,
      reminderAt: parsed.reminderAt,
      dueAt: parsed.dueAt,
      source: 'quick_capture',
    })

    if (parsed.labels?.length) {
      new LabelService(this.userId).ensureLabelsExist(parsed.labels).catch(console.warn)
    }

    return id
  }

  async update(todoId: string, input: UpdateTodoInput): Promise<void> {
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

    if (
      input.title !== undefined ||
      input.description !== undefined ||
      input.person !== undefined ||
      input.project !== undefined ||
      input.labels !== undefined ||
      input.type !== undefined
    ) {
      const existing = await this.getById(todoId)
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

  async getById(todoId: string): Promise<Todo | null> {
    const docRef = doc(getFirestoreDb(), todosCollectionPath(this.userId), todoId)
    const snapshot = await getDoc(docRef)
    if (!snapshot.exists()) return null
    return docToTodo(snapshot.id, snapshot.data())
  }

  async complete(todoId: string): Promise<void> {
    const docRef = doc(getFirestoreDb(), todosCollectionPath(this.userId), todoId)
    await updateDoc(docRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  async uncomplete(todoId: string): Promise<void> {
    const docRef = doc(getFirestoreDb(), todosCollectionPath(this.userId), todoId)
    await updateDoc(docRef, {
      status: 'active',
      completedAt: null,
      updatedAt: serverTimestamp(),
    })
  }

  async markReminderNotified(todoId: string): Promise<void> {
    const docRef = doc(getFirestoreDb(), todosCollectionPath(this.userId), todoId)
    await updateDoc(docRef, {
      reminderNotifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  async snooze(todoId: string, until: Date): Promise<void> {
    await this.update(todoId, {
      status: 'snoozed',
      reminderAt: until,
      snoozedUntil: until,
    })
  }

  async reactivate(todoId: string): Promise<void> {
    await this.update(todoId, { status: 'active', snoozedUntil: null })
  }

  async archive(todoId: string): Promise<void> {
    await this.update(todoId, { status: 'archived' })
  }

  async delete(todoId: string): Promise<void> {
    const docRef = doc(getFirestoreDb(), todosCollectionPath(this.userId), todoId)
    await deleteDoc(docRef)
  }
}
