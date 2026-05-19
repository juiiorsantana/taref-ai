/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

let toastListeners: ((toast: Toast) => void)[] = []

export const showToast = (message: string, type: ToastType = 'info') => {
  const toast: Toast = { id: Date.now().toString(), message, type }
  toastListeners.forEach((fn) => fn(toast))
}

const iconMap = { success: CheckCircle2, error: AlertCircle, info: Info }
const colorMap: Record<ToastType, string> = {
  success: 'hsl(var(--brand-emerald))',
  error:   'hsl(var(--brand-rose))',
  info:    'hsl(var(--brand-cyan))',
}

export const ToastContainer = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (toast: Toast) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 4000)
    }
    toastListeners.push(handler)
    return () => { toastListeners = toastListeners.filter((fn) => fn !== handler) }
  }, [])

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 100,
        display: 'flex', flexDirection: 'column', gap: 8,
        maxWidth: 360,
      }}
    >
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type]
        const color = colorMap[toast.type]
        return (
          <div
            key={toast.id}
            role="alert"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px',
              background: 'hsl(var(--bg-elevated))',
              border: `1px solid ${color}40`,
              borderLeft: `3px solid ${color}`,
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-elevated)',
              animation: 'fadeSlideUp 200ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <Icon size={15} style={{ color, marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: 'hsl(var(--text-primary))', flex: 1 }}>
              {toast.message}
            </span>
            <button
              onClick={() => setToasts((p) => p.filter((t) => t.id !== toast.id))}
              aria-label="Fechar notificação"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'hsl(var(--text-faint))', padding: 0, flexShrink: 0,
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
