import type { User } from 'firebase/auth'

/**
 * Loads Firebase Auth + Firestore in parallel chunks after app shell renders.
 * Returns the auth unsubscribe function.
 */
export async function bootstrapFirebase(
  onAuthChange: (user: User | null) => void,
): Promise<() => void> {
  const [{ subscribeToAuth }, { ensureFirestore }] = await Promise.all([
    import('./auth'),
    import('./firestore'),
  ])

  ensureFirestore()

  return subscribeToAuth(onAuthChange)
}
