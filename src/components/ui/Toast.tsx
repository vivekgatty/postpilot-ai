'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id:       number
  message:  string
  type:     ToastType
  duration: number
}

interface ToastOptions {
  duration?: number
}

interface ToastAPI {
  success: (message: string, opts?: ToastOptions) => void
  error:   (message: string, opts?: ToastOptions) => void
  warning: (message: string, opts?: ToastOptions) => void
  info:    (message: string, opts?: ToastOptions) => void
}

interface ToastContextValue {
  toast: ToastAPI
}

// ── Context ────────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ── Colours ────────────────────────────────────────────────────────────────────

const COLORS: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: 'bg-[#1D9E75]', icon: '✓' },
  error:   { bg: 'bg-[#E24B4A]', icon: '✕' },
  warning: { bg: 'bg-[#BA7517]', icon: '⚠' },
  info:    { bg: 'bg-[#378ADD]', icon: 'ℹ' },
}

// ── Single toast bubble ────────────────────────────────────────────────────────

function ToastBubble({
  item,
  onClose,
}: {
  item:    ToastItem
  onClose: (id: number) => void
}) {
  const [visible, setVisible]   = useState(false)
  const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Slide in on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  // Auto-dismiss
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onClose(item.id), 300)
    }, item.duration)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [item.id, item.duration, onClose])

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
    setTimeout(() => onClose(item.id), 300)
  }

  const { bg, icon } = COLORS[item.type]

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl min-w-[260px] max-w-sm text-white',
        'transition-all duration-300 ease-out',
        bg,
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
      )}
    >
      <span className="text-base font-bold flex-shrink-0 leading-none">{icon}</span>
      <p className="text-sm font-medium flex-1 leading-snug">{item.message}</p>
      <button
        type="button"
        onClick={dismiss}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ── Provider ───────────────────────────────────────────────────────────────────

const MAX_TOASTS = 3
let _nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback((message: string, type: ToastType, duration: number) => {
    const id = ++_nextId
    setToasts(prev => {
      const next = [...prev, { id, message, type, duration }]
      // Drop oldest when over max
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next
    })
  }, [])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast: ToastAPI = {
    success: (msg, opts) => push(msg, 'success', opts?.duration ?? 3000),
    error:   (msg, opts) => push(msg, 'error',   opts?.duration ?? 5000),
    warning: (msg, opts) => push(msg, 'warning', opts?.duration ?? 3000),
    info:    (msg, opts) => push(msg, 'info',    opts?.duration ?? 3000),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div
          aria-label="Notifications"
          className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none"
        >
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto overflow-hidden">
              <ToastBubble item={t} onClose={remove} />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
