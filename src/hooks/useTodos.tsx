import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { SYNC_INTERVAL_MS } from '@/services/sync/LocalTodoStore'
import { TodoSyncEngine, type SyncStatus } from '@/services/sync/TodoSyncEngine'
import type { Todo } from '@/types'

interface TodosContextValue {
  todos: Todo[]
  loading: boolean
  error: string | null
  syncStatus: SyncStatus
  lastSyncedAt: number | null
  hasPendingChanges: boolean
  syncNow: () => Promise<void>
  engine: TodoSyncEngine | null
  refreshLocal: () => void
}

const TodosContext = createContext<TodosContextValue | null>(null)

export function useTodos(): TodosContextValue {
  const ctx = useContext(TodosContext)
  if (!ctx) {
    throw new Error('useTodos must be used within TodosProvider')
  }
  return ctx
}

export function TodosProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [engine, setEngine] = useState<TodoSyncEngine | null>(null)
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [hasPendingChanges, setHasPendingChanges] = useState(false)

  const refreshLocal = useCallback(() => {
    if (!engine) return
    setTodos(engine.loadTodos())
    setHasPendingChanges(engine.hasPendingChanges())
    setLastSyncedAt(engine.getLastSyncedAt())
  }, [engine])

  const syncNow = useCallback(async () => {
    if (!engine) return

    setSyncStatus('syncing')
    try {
      await engine.sync()
      refreshLocal()
      setError(null)
      setSyncStatus('synced')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed'
      setError(message)
      setSyncStatus('error')
    }
  }, [engine, refreshLocal])

  useEffect(() => {
    if (!user) {
      setEngine(null)
      setTodos([])
      setLoading(false)
      setError(null)
      setSyncStatus('idle')
      setLastSyncedAt(null)
      setHasPendingChanges(false)
      return
    }

    const nextEngine = new TodoSyncEngine(user.uid)
    setEngine(nextEngine)
    setTodos(nextEngine.loadTodos())
    setLastSyncedAt(nextEngine.getLastSyncedAt())
    setHasPendingChanges(nextEngine.hasPendingChanges())
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!engine) return

    void syncNow()

    const interval = window.setInterval(() => {
      void syncNow()
    }, SYNC_INTERVAL_MS)

    return () => {
      window.clearInterval(interval)
    }
  }, [engine, syncNow])

  return (
    <TodosContext.Provider
      value={{
        todos,
        loading,
        error,
        syncStatus,
        lastSyncedAt,
        hasPendingChanges,
        syncNow,
        engine,
        refreshLocal,
      }}
    >
      {children}
    </TodosContext.Provider>
  )
}
