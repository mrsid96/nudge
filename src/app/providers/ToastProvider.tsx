import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ToastAction {
  label: string
  onClick: () => void
}

interface Toast {
  id: string
  message: string
  action?: ToastAction
}

interface ToastContextValue {
  showToast: (message: string, action?: ToastAction) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const TOAST_DURATION_MS = 5000
const TOAST_WITH_ACTION_MS = 10_000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, action?: ToastAction) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, action }])

    const duration = action ? TOAST_WITH_ACTION_MS : TOAST_DURATION_MS
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-24 left-4 right-4 z-[200] flex flex-col items-center gap-2 md:bottom-6 md:left-auto md:right-6 md:items-end"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex w-full max-w-sm items-center gap-3 rounded-xl border border-border bg-elevated px-4 py-3 shadow-lg',
              toast.action && 'ring-1 ring-primary/30',
            )}
          >
            <span className="flex-1 text-sm">{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick()
                  dismiss(toast.id)
                }}
                className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 text-text-muted hover:text-text"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
