import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { isFirebaseConfigured } from '@/firebase/config'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isConfigured: false,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const isConfigured = isFirebaseConfigured()

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | undefined

    import('@/firebase/bootstrap').then(({ bootstrapFirebase }) => {
      bootstrapFirebase((authUser) => {
        // Unblock UI immediately — don't wait for profile sync
        setUser(authUser)
        setLoading(false)

        if (authUser) {
          import('@/firebase/firestore')
            .then(({ ensureFirestore }) => ensureFirestore())
            .then(() => import('@/firebase/profile'))
            .then(({ ensureUserProfile }) => ensureUserProfile(authUser))
            .catch((error) => {
              console.error('Failed to ensure user profile:', error)
            })
        }
      }).then((unsub) => {
        unsubscribe = unsub
      })
    })

    return () => unsubscribe?.()
  }, [isConfigured])

  return (
    <AuthContext.Provider value={{ user, loading, isConfigured }}>
      {children}
    </AuthContext.Provider>
  )
}
