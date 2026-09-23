import type { User } from 'firebase/auth'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { ensureFirestore } from './firestore'
import { getBrowserTimezone } from '@/utils/dates'

export async function ensureUserProfile(user: User): Promise<void> {
  const db = ensureFirestore()
  const userRef = doc(db, 'users', user.uid)
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    const now = Timestamp.now()
    await setDoc(userRef, {
      displayName: user.displayName ?? '',
      email: user.email ?? '',
      photoURL: user.photoURL ?? null,
      timezone: getBrowserTimezone(),
      createdAt: now,
      updatedAt: now,
    })
  }
}
