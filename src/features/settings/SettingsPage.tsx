import { useEffect } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { NotificationPrompt } from '@/components/NotificationPrompt/NotificationPrompt'
import { getBrowserTimezone } from '@/utils/dates'

export function SettingsPage() {
  const { user } = useAuth()

  useEffect(() => {
    if (window.location.hash === '#notifications') {
      document.getElementById('notifications')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      <h1 className="mb-6 text-xl font-semibold">Settings</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
          Account
        </h2>
        {user && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
            {user.photoURL && (
              <img src={user.photoURL} alt="" className="h-10 w-10 rounded-full" />
            )}
            <div>
              <p className="font-medium">{user.displayName}</p>
              <p className="text-sm text-text-muted">{user.email}</p>
            </div>
          </div>
        )}
      </section>

      <section id="notifications" className="mb-8 scroll-mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
          Notifications
        </h2>
        <p className="mb-3 text-sm text-text-muted">
          Enable browser notifications to get reminders for follow-ups and tasks.
          Reminders also fire while the app is open.
        </p>
        <NotificationPrompt />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
          Appearance
        </h2>
        <p className="text-sm text-text-muted">Dark mode (default)</p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
          Timezone
        </h2>
        <p className="text-sm">{getBrowserTimezone()}</p>
      </section>
    </div>
  )
}
