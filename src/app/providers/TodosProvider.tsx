import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import type { LabelRepository } from '@/db/repositories/labelRepository'
import { TodoRepository } from '@/db/repositories/todoRepository'
import { LabelRepository as LabelRepo } from '@/db/repositories/labelRepository'
import { SyncEngine, type SyncStatus } from '@/services/sync/syncEngine'
import type { Todo } from '@/types'

interface TodosContextValue {
  todos: Todo[]
  loading: boolean
  ready: boolean
  error: string | null
  syncStatus: SyncStatus
  lastSyncedAt: number | null
  pendingCount: number
  isOnline: boolean
  syncNow: () => Promise<void>
  todoRepository: TodoRepository | null
  labelRepository: LabelRepository | null
  refreshLocal: () => Promise<void>
}

const TodosContext = createContext<TodosContextValue | null>(null)

export function useTodos(): TodosContextValue {
  const ctx = useContext(TodosContext)
  if (!ctx) throw new Error('useTodos must be used within TodosProvider')
  return ctx
}

export function TodosProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const engineRef = useRef<SyncEngine | null>(null)

  const [todoRepository, setTodoRepository] = useState<TodoRepository | null>(null)
  const [labelRepository, setLabelRepository] = useState<LabelRepository | null>(null)
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  const reloadFromDb = useCallback(async (repo: TodoRepository, engine: SyncEngine | null) => {
    setTodos(await repo.getAll())
    if (engine) {
      setPendingCount(await engine.countPending())
      setLastSyncedAt(await engine.getLastSyncedAt())
    }
  }, [])

  const syncNow = useCallback(async () => {
    const engine = engineRef.current
    const repo = todoRepository
    if (!engine || !repo) return

    setSyncStatus(navigator.onLine ? 'syncing' : 'offline')
    try {
      await engine.sync()
      await reloadFromDb(repo, engine)
      setError(null)
      setSyncStatus(navigator.onLine ? 'synced' : 'offline')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      setSyncStatus('error')
      await reloadFromDb(repo, engine)
    }
  }, [todoRepository, reloadFromDb])

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true)
      void syncNow()
    }
    const onOffline = () => {
      setIsOnline(false)
      setSyncStatus('offline')
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [syncNow])

  useEffect(() => {
    if (!user) {
      engineRef.current?.stop()
      engineRef.current = null
      setTodoRepository(null)
      setLabelRepository(null)
      setTodos([])
      setLoading(false)
      setReady(false)
      setSyncStatus('idle')
      setLastSyncedAt(null)
      setPendingCount(0)
      return
    }

    const todoRepo = new TodoRepository(user.uid)
    const labelRepo = new LabelRepo(user.uid)
    setTodoRepository(todoRepo)
    setLabelRepository(labelRepo)

    let cancelled = false

    void (async () => {
      setLoading(true)
      setReady(false)

      try {
        const localTodos = await todoRepo.getAll()
        if (cancelled) return
        setTodos(localTodos)
        setReady(true)
        setLoading(false)

        const engine = new SyncEngine({
          userId: user.uid,
          todoRepo,
          labelRepo,
          onDataChange: () => {
            void reloadFromDb(todoRepo, engineRef.current)
          },
        })

        engineRef.current = engine
        await engine.initialize()
        if (cancelled) return

        engine.start()
        await reloadFromDb(todoRepo, engine)
        setSyncStatus(navigator.onLine ? 'synced' : 'offline')
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load data')
          setReady(true)
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
      engineRef.current?.stop()
      engineRef.current = null
    }
  }, [user, reloadFromDb])

  const refreshLocal = useCallback(async () => {
    if (!todoRepository) return
    await reloadFromDb(todoRepository, engineRef.current)
    engineRef.current?.scheduleSync()
  }, [todoRepository, reloadFromDb])

  return (
    <TodosContext.Provider
      value={{
        todos,
        loading,
        ready,
        error,
        syncStatus,
        lastSyncedAt,
        pendingCount,
        isOnline,
        syncNow,
        todoRepository,
        labelRepository,
        refreshLocal,
      }}
    >
      {children}
    </TodosContext.Provider>
  )
}
