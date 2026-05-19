import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Keep banner visible for 2s after reconnection
      setTimeout(() => setVisible(false), 2000)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setVisible(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (!navigator.onLine) setVisible(true)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 20px',
        background: isOnline
          ? 'hsl(158 64% 40% / 0.15)'
          : 'hsl(var(--brand-rose) / 0.12)',
        border: `1px solid ${isOnline ? 'hsl(158 64% 40% / 0.4)' : 'hsl(var(--brand-rose) / 0.35)'}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        borderRadius: '2px',
        pointerEvents: 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <WifiOff
        size={14}
        style={{ color: isOnline ? 'hsl(158 64% 40%)' : 'hsl(var(--brand-rose))' }}
      />
      <span
        style={{
          fontSize: '12px',
          fontWeight: 700,
          fontFamily: 'JetBrains Mono, Courier New, monospace',
          letterSpacing: '0.06em',
          color: isOnline ? 'hsl(158 64% 40%)' : 'hsl(var(--brand-rose))',
          whiteSpace: 'nowrap',
        }}
      >
        {isOnline ? 'CONEXÃO RESTAURADA' : 'CONEXÃO PERDIDA — MODO LEITURA'}
      </span>
    </div>
  )
}
