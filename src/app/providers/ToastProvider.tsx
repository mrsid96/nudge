import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
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

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, action?: ToastAction) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, action }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2 md:bottom-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-elevated px-4 py-3 shadow-lg"
          >
            <span className="text-sm">{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick()
                  dismiss(toast.id)
                }}
                className="text-sm font-medium text-primary hover:text-primary-hover"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-1 text-text-muted hover:text-text"
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
