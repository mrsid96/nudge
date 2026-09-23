import { AlertCircle, Check, CloudOff, RefreshCw } from 'lucide-react'
import { useTodos } from '@/hooks/useTodos'
import { cn } from '@/utils/cn'

export function SyncStatusIndicator() {
  const { syncStatus, pendingCount, isOnline } = useTodos()

  if (!isOnline) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-text-muted" title="Offline">
        <CloudOff className="h-3.5 w-3.5" />
        {pendingCount > 0 ? `Offline · ${pendingCount} pending` : 'Offline'}
      </span>
    )
  }

  if (syncStatus === 'syncing') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-text-muted">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        Syncing…
      </span>
    )
  }

  if (syncStatus === 'error' || pendingCount > 0) {
    return (
      <span
        className={cn(
          'flex items-center gap-1.5 text-xs',
          syncStatus === 'error' ? 'text-warning' : 'text-text-muted',
        )}
        title={syncStatus === 'error' ? 'Sync delayed' : 'Changes pending sync'}
      >
        <AlertCircle className="h-3.5 w-3.5" />
        {pendingCount > 0 ? `${pendingCount} pending` : 'Sync delayed'}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-text-muted" title="Synced">
      <Check className="h-3.5 w-3.5" />
      Synced
    </span>
  )
}
