import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { LabelService } from '@/services/LabelService'
import type { Label } from '@/types'

interface UseLabelsOptions {
  /** Defer subscription until idle to avoid competing with todo listener on startup */
  enabled?: boolean
}

export function useLabels({ enabled = true }: UseLabelsOptions = {}) {
  const { user } = useAuth()
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(false)

  const service = useMemo(
    () => (user ? new LabelService(user.uid) : null),
    [user],
  )

  useEffect(() => {
    if (!service || !enabled) {
      if (!enabled) return
      setLabels([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = service.subscribe((data) => {
      setLabels(data)
      setLoading(false)
    })

    return unsubscribe
  }, [service, enabled])

  return { labels, loading, service }
}
