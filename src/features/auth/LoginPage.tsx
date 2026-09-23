import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { isFirebaseConfigured } from '@/firebase/config'

export function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    try {
      const { signInWithGoogle } = await import('@/firebase/auth')
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isFirebaseConfigured()) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Nudge</h1>
          <p className="mt-4 text-text-muted">
            Firebase is not configured. Copy <code className="text-primary">.env.example</code> to{' '}
            <code className="text-primary">.env.local</code> and add your Firebase credentials.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Nudge</h1>
        <p className="mt-2 text-text-muted">
          Your personal command center for follow-ups
        </p>

        <Button
          size="lg"
          className="mt-8 w-full"
          onClick={handleSignIn}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Continue with Google'}
        </Button>

        {error && (
          <p className="mt-4 text-sm text-danger">{error}</p>
        )}
      </div>
    </div>
  )
}
