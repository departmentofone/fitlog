import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { subscribeError } from '../lib/toastBus'

interface ToastOptions {
  actionLabel?: string
  onAction?: () => void
  duration?: number
  tone?: 'default' | 'error'
}

interface ToastItem extends ToastOptions {
  id: number
  message: string
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void
  /** Runs `action` immediately, then offers an "Undo" toast that runs `undo` if tapped in time. */
  undoable: (message: string, action: () => void, undo: () => void) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((cur) => cur.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = ++idRef.current
      const duration = options?.duration ?? (options?.tone === 'error' ? 4500 : 5000)
      setToasts((cur) => [...cur, { id, message, ...options }])
      setTimeout(() => dismiss(id), duration)
    },
    [dismiss],
  )

  const undoable = useCallback(
    (message: string, action: () => void, undo: () => void) => {
      action()
      show(message, { actionLabel: 'Undo', onAction: undo, duration: 5000 })
    },
    [show],
  )

  useEffect(() => subscribeError((message) => show(message, { tone: 'error' })), [show])

  return (
    <ToastContext.Provider value={{ show, undoable }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[200] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl ring-1 backdrop-blur ${
              t.tone === 'error' ? 'bg-red-950/95 text-red-200 ring-red-500/30' : 'bg-slate-800/95 text-white ring-white/10'
            }`}
          >
            <span className="text-sm">{t.message}</span>
            {t.actionLabel && (
              <button
                onClick={() => {
                  t.onAction?.()
                  dismiss(t.id)
                }}
                className="shrink-0 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
              >
                {t.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
