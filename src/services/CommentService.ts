import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirestoreDb, todosCollectionPath } from '@/firebase/firestore'
import type { TodoComment } from '@/types'

export class CommentService {
  constructor(
    private readonly userId: string,
    private readonly todoId: string,
  ) {}

  private get collectionRef() {
    return collection(
      getFirestoreDb(),
      todosCollectionPath(this.userId),
      this.todoId,
      'comments',
    )
  }

  subscribe(callback: (comments: TodoComment[]) => void): Unsubscribe {
    const q = query(this.collectionRef, orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as TodoComment,
      )
      callback(comments)
    })
  }

  async add(text: string): Promise<void> {
    await addDoc(this.collectionRef, {
      todoId: this.todoId,
      userId: this.userId,
      text: text.trim(),
      createdAt: serverTimestamp(),
    })
  }
}
