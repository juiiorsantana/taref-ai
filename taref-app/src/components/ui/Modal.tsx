import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  headerActions?: ReactNode
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md', headerActions }: ModalProps) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidth = { sm: '400px', md: '560px', lg: '720px' }[size]

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'hsl(220 25% 2% / 0.85)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 150ms ease-out',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: '100%', maxWidth, maxHeight: '90vh',
          background: 'hsl(var(--bg-card))',
          border: '1px solid hsl(var(--border-subtle))',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-elevated)',
          display: 'flex', flexDirection: 'column',
          animation: 'scaleIn 180ms cubic-bezier(0.34,1.56,0.64,1)',
          overflow: 'hidden',
          margin: '0 16px',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid hsl(var(--border-subtle))',
          flexShrink: 0,
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {headerActions}
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28,
              background: 'none', border: 'none', borderRadius: 'var(--radius-sm)',
              color: 'hsl(var(--text-muted))',
              cursor: 'pointer', transition: 'background var(--duration-fast)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--bg-elevated))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <X size={14} />
          </button>
          </div>
        </div>
        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
