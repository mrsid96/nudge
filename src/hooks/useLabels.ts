import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useTodos } from '@/hooks/useTodos'
import type { Label } from '@/types'

interface UseLabelsOptions {
  enabled?: boolean
}

export function useLabels({ enabled = true }: UseLabelsOptions = {}) {
  const { user } = useAuth()
  const { labelRepository } = useTodos()
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!labelRepository) {
      setLabels([])
      return
    }
    setLabels(await labelRepository.getAll())
  }, [labelRepository])

  useEffect(() => {
    if (!user || !enabled || !labelRepository) {
      setLabels([])
      setLoading(false)
      return
    }

    setLoading(true)
    void refresh().finally(() => setLoading(false))
  }, [user, enabled, labelRepository, refresh])

  return { labels, loading, refresh }
}
