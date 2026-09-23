import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { useTodos } from '@/hooks/useTodos'

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)
  const { pendingCount } = useTodos()

  useEffect(() => {
    function handleOnline() { setOffline(false) }
    function handleOffline() { setOffline(true) }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!offline && pendingCount === 0) return null

  if (!offline && pendingCount > 0) {
    return (
      <div className="flex items-center justify-center gap-2 bg-elevated px-4 py-1.5 text-xs text-text-muted">
        {pendingCount} change{pendingCount === 1 ? '' : 's'} waiting to sync
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-2 bg-warning/10 px-4 py-2 text-sm text-warning">
      <WifiOff className="h-4 w-4" />
      Offline · {pendingCount > 0 ? `${pendingCount} changes waiting to sync` : 'Changes will sync when back online'}
    </div>
  )
}
