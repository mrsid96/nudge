import { Bell, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { NotificationService } from '@/services/NotificationService'
import { useAuth } from '@/app/providers/AuthProvider'

const DISMISS_KEY = 'nudge_notification_banner_dismissed'

export function NotificationEnableBanner() {
  const { user } = useAuth()
  const [hidden, setHidden] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')
  const [loading, setLoading] = useState(false)

  if (!user || hidden) return null
  if (!('Notification' in window)) return null
  if (Notification.permission !== 'default') return null

  async function handleEnable() {
    if (!user) return
    setLoading(true)
    const service = new NotificationService(user.uid)
    const registered = await service.registerDevice()
    setLoading(false)

    if (registered) {
      new Notification('Reminders enabled', {
        body: "You'll be notified when tasks are due.",
        icon: '/favicon.svg',
      })
      setHidden(true)
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setHidden(true)
  }

  return (
    <div className="flex items-center gap-3 border-b border-border bg-primary/5 px-4 py-3 md:px-6">
      <Bell className="h-4 w-4 shrink-0 text-primary" />
      <p className="flex-1 text-sm text-text">
        Enable reminders so you never miss a follow-up.
      </p>
      <Button size="sm" onClick={handleEnable} disabled={loading}>
        {loading ? 'Enabling…' : 'Enable'}
      </Button>
      <button
        onClick={handleDismiss}
        className="rounded p-1 text-text-muted hover:text-text"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
