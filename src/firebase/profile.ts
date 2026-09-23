import type { User } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getFirestoreDb, userDocPath } from './firestore'
import { getBrowserTimezone } from '@/utils/dates'

export async function ensureUserProfile(user: User): Promise<void> {
  const userRef = doc(getFirestoreDb(), userDocPath(user.uid))
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      displayName: user.displayName ?? '',
      email: user.email ?? '',
      photoURL: user.photoURL ?? null,
      timezone: getBrowserTimezone(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}
