import { Bell, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { NotificationService } from '@/services/NotificationService'
import { useAuth } from '@/app/providers/AuthProvider'

export function NotificationPrompt() {
  const { user } = useAuth()
  const [status, setStatus] = useState<'idle' | 'enabled' | 'denied' | 'unsupported'>('idle')
  const [loading, setLoading] = useState(false)

  if (!user) return null

  const service = new NotificationService(user.uid)
  const permission = service.getPermissionStatus()

  if (permission === 'granted' || status === 'enabled') {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <Check className="h-4 w-4" />
        Reminders enabled
      </div>
    )
  }

  if (permission === 'denied' || status === 'denied') {
    return (
      <p className="text-sm text-text-muted">
        Notifications are blocked. Enable them in your browser settings to receive reminders.
      </p>
    )
  }

  if (permission === 'unsupported' || status === 'unsupported') {
    return (
      <p className="text-sm text-text-muted">
        Browser push notifications are not supported on this device.
      </p>
    )
  }

  async function handleEnable() {
    setLoading(true)
    const supported = await service.isSupported()
    if (!supported) {
      setStatus('unsupported')
      setLoading(false)
      return
    }

    const registered = await service.registerDevice()
    setStatus(registered ? 'enabled' : 'denied')
    setLoading(false)
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <Bell className="mt-0.5 h-5 w-5 text-primary" />
        <div className="flex-1">
          <h3 className="text-sm font-medium">Enable reminders</h3>
          <p className="mt-1 text-sm text-text-muted">Never miss a follow-up.</p>
          <Button size="sm" className="mt-3" onClick={handleEnable} disabled={loading}>
            {loading ? 'Enabling...' : 'Enable Notifications'}
          </Button>
        </div>
      </div>
    </div>
  )
}
