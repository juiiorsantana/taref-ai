import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { showToast } from '../ui/Toast'
import { Zap, Mail, Lock, LogIn, Loader } from 'lucide-react'

export const LoginView = () => {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      showToast('Preencha e-mail e senha', 'error')
      return
    }
    setIsSubmitting(true)
    const { error } = await signIn(email.trim(), password)
    setIsSubmitting(false)
    if (error) {
      showToast('Credenciais inválidas. Tente novamente.', 'error')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'hsl(var(--bg-app))',
        backgroundImage:
          'linear-gradient(hsl(var(--border-subtle) / 0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border-subtle) / 0.35) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{
            width: 36, height: 36,
            background: 'hsl(var(--brand-cyan))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid hsl(var(--text-primary))',
            boxShadow: '3px 3px 0 hsl(var(--text-primary))',
          }}>
            <Zap size={18} color="hsl(220 25% 6%)" fill="hsl(220 25% 6%)" />
          </div>
          <div>
            <span style={{
              fontFamily: 'JetBrains Mono, Courier New, monospace',
              fontSize: '16px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'hsl(var(--text-primary))',
            }}>
              Taref.ai
            </span>
            <div style={{
              fontSize: '10px',
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.12em',
              color: 'hsl(var(--text-faint))',
              textTransform: 'uppercase',
            }}>
              Major Agency
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'hsl(var(--bg-surface))',
          border: '2px solid hsl(var(--border-subtle))',
          boxShadow: '6px 6px 0 hsl(var(--border-subtle))',
          padding: '32px',
        }}>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            Acesso Restrito
          </h1>
          <p style={{
            fontSize: '12px',
            color: 'hsl(var(--text-muted))',
            marginBottom: 28,
            lineHeight: 1.5,
          }}>
            Entre com suas credenciais da agência para continuar.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{
                fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'hsl(var(--text-faint))',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                E-mail
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={13} style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'hsl(var(--text-faint))', pointerEvents: 'none',
                }} />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@agencia.com.br"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    background: 'hsl(var(--bg-input))',
                    border: '2px solid hsl(var(--border-subtle))',
                    color: 'hsl(var(--text-primary))',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'hsl(var(--brand-cyan))')}
                  onBlur={(e) => (e.target.style.borderColor = 'hsl(var(--border-subtle))')}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{
                fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'hsl(var(--text-faint))',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={13} style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'hsl(var(--text-faint))', pointerEvents: 'none',
                }} />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    background: 'hsl(var(--bg-input))',
                    border: '2px solid hsl(var(--border-subtle))',
                    color: 'hsl(var(--text-primary))',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'hsl(var(--brand-cyan))')}
                  onBlur={(e) => (e.target.style.borderColor = 'hsl(var(--border-subtle))')}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '12px 24px',
                background: isSubmitting ? 'hsl(var(--bg-elevated))' : 'hsl(var(--brand-cyan))',
                border: '2px solid hsl(var(--text-primary))',
                boxShadow: isSubmitting ? 'none' : '4px 4px 0 hsl(var(--text-primary))',
                color: isSubmitting ? 'hsl(var(--text-muted))' : 'hsl(220 25% 6%)',
                fontWeight: 800, fontSize: '12px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Autenticando...
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  Entrar no Portal
                </>
              )}
            </button>
          </form>
        </div>

        <p style={{
          marginTop: 20,
          textAlign: 'center',
          fontSize: '11px',
          color: 'hsl(var(--text-faint))',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          Acesso exclusivo para membros da agência
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
