import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { showToast } from '../ui/Toast'
import { Shield, Mail, Lock, Terminal, Activity, Cpu, Zap, AlertTriangle } from 'lucide-react'

// ─── Animated terminal cursor ─────────────────────────────────────────────────
const Cursor = () => (
  <span style={{
    display: 'inline-block',
    width: 8,
    height: 14,
    background: 'hsl(var(--brand-cyan))',
    marginLeft: 2,
    verticalAlign: 'middle',
    animation: 'blink 1s step-end infinite',
  }} />
)

// ─── System status row ────────────────────────────────────────────────────────
const StatusRow = ({ label, value, ok = true }: { label: string; value: string; ok?: boolean }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
    borderBottom: '1px solid hsl(var(--border-subtle) / 0.3)',
    fontFamily: 'JetBrains Mono, monospace',
  }}>
    <span style={{ fontSize: 10, color: 'hsl(var(--text-faint))', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    <span style={{
      fontSize: 10,
      color: ok ? 'hsl(var(--brand-cyan))' : 'hsl(0 70% 60%)',
      letterSpacing: '0.05em',
    }}>{value}</span>
  </div>
)

// ─── Decorative grid squares ──────────────────────────────────────────────────
const GridAccent = () => {
  const squares = Array.from({ length: 12 }, (_, i) => i)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
      {squares.map(i => (
        <div key={i} style={{
          height: 16,
          background: i % 5 === 0
            ? 'hsl(var(--brand-cyan) / 0.6)'
            : i % 3 === 0
            ? 'hsl(var(--border-subtle) / 0.5)'
            : 'hsl(var(--border-subtle) / 0.15)',
          border: '1px solid hsl(var(--border-subtle) / 0.3)',
          animation: i % 4 === 0 ? 'pulse-sq 3s ease-in-out infinite' : 'none',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export const AdminLoginPage = () => {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    setMounted(true)
    const tick = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

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
      showToast('Acesso negado. Credenciais inválidas.', 'error')
    }
  }

  const timeStr = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = time.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'hsl(var(--bg-app))',
      display: 'flex',
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.4s ease',
    }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        width: 380,
        flexShrink: 0,
        background: 'hsl(var(--bg-surface))',
        borderRight: '2px solid hsl(var(--border-subtle))',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background grid texture */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(hsl(var(--border-subtle) / 0.25) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border-subtle) / 0.25) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }} />

        {/* Cyan accent bar top */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 3,
          background: 'hsl(var(--brand-cyan))',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Branding */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32,
                background: 'hsl(var(--brand-cyan))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid hsl(var(--text-primary))',
                boxShadow: '3px 3px 0 hsl(var(--text-primary))',
              }}>
                <Zap size={16} color="hsl(220 25% 6%)" fill="hsl(220 25% 6%)" />
              </div>
              <div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'hsl(var(--text-primary))',
                }}>Taref.ai</div>
                <div style={{
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.14em',
                  color: 'hsl(var(--text-faint))',
                  textTransform: 'uppercase',
                }}>Major Agency</div>
              </div>
            </div>

            {/* Admin badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              background: 'hsl(var(--brand-cyan) / 0.12)',
              border: '2px solid hsl(var(--brand-cyan))',
              boxShadow: '3px 3px 0 hsl(var(--brand-cyan) / 0.4)',
              marginTop: 12,
            }}>
              <Shield size={11} style={{ color: 'hsl(var(--brand-cyan))' }} />
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: 'hsl(var(--brand-cyan))',
                textTransform: 'uppercase',
              }}>Painel Admin</span>
            </div>
          </div>

          {/* System clock */}
          <div style={{
            background: 'hsl(var(--bg-elevated))',
            border: '2px solid hsl(var(--border-subtle))',
            padding: '14px 16px',
          }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 24,
              fontWeight: 700,
              color: 'hsl(var(--brand-cyan))',
              letterSpacing: '0.05em',
              marginBottom: 2,
            }}>{timeStr}</div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              color: 'hsl(var(--text-faint))',
              letterSpacing: '0.1em',
            }}>{dateStr}</div>
          </div>

          {/* System status */}
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 10,
            }}>
              <Activity size={11} style={{ color: 'hsl(var(--text-faint))' }} />
              <span style={{
                fontSize: 9,
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'hsl(var(--text-faint))',
              }}>Status do Sistema</span>
            </div>
            <StatusRow label="Auth Service" value="ONLINE" ok />
            <StatusRow label="Database" value="CONECTADO" ok />
            <StatusRow label="Acesso" value="RESTRITO" ok={false} />
            <StatusRow label="Sessão" value="INATIVA" ok={false} />
          </div>

          {/* Terminal output */}
          <div style={{
            background: 'hsl(220 25% 4%)',
            border: '2px solid hsl(var(--border-subtle))',
            padding: '12px 14px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            lineHeight: 1.8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid hsl(var(--border-subtle) / 0.4)' }}>
              <Terminal size={10} style={{ color: 'hsl(var(--brand-cyan))' }} />
              <span style={{ color: 'hsl(var(--text-faint))', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Terminal</span>
            </div>
            <div style={{ color: 'hsl(var(--text-faint))' }}>$ init auth_gateway</div>
            <div style={{ color: 'hsl(var(--brand-cyan))' }}>✓ gateway ativo</div>
            <div style={{ color: 'hsl(var(--text-faint))' }}>$ aguardando credenciais</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: 'hsl(var(--text-faint))' }}>$ _</span>
              <Cursor />
            </div>
          </div>

          {/* Grid accent */}
          <div>
            <div style={{
              fontSize: 9,
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'hsl(var(--text-faint))',
              marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Cpu size={10} />
              Módulos Ativos
            </div>
            <GridAccent />
          </div>
        </div>

        {/* Bottom warning */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '10px 12px',
          background: 'hsl(40 80% 50% / 0.08)',
          border: '1px solid hsl(40 80% 50% / 0.3)',
          marginTop: 24,
        }}>
          <AlertTriangle size={11} style={{ color: 'hsl(40 80% 60%)', flexShrink: 0, marginTop: 1 }} />
          <p style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            color: 'hsl(40 80% 60%)',
            lineHeight: 1.6,
            letterSpacing: '0.04em',
            margin: 0,
          }}>
            Acesso restrito a membros autorizados. Tentativas não autorizadas são monitoradas e registradas.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        backgroundImage:
          'linear-gradient(hsl(var(--border-subtle) / 0.2) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border-subtle) / 0.2) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        position: 'relative',
      }}>

        {/* Top-right corner decoration */}
        <div style={{
          position: 'absolute',
          top: 24, right: 24,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          color: 'hsl(var(--text-faint))',
          letterSpacing: '0.1em',
          textAlign: 'right',
          lineHeight: 1.8,
          textTransform: 'uppercase',
        }}>
          <div>v2.1.0</div>
          <div>Build 2024</div>
        </div>

        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Header text */}
          <div style={{ marginBottom: 36 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
            }}>
              <div style={{
                width: 3, height: 28,
                background: 'hsl(var(--brand-cyan))',
              }} />
              <h1 style={{
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: '-0.04em',
                textTransform: 'uppercase',
                color: 'hsl(var(--text-primary))',
                margin: 0,
                lineHeight: 1,
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                Acesso<br />
                <span style={{ color: 'hsl(var(--brand-cyan))' }}>Restrito</span>
              </h1>
            </div>
            <p style={{
              fontSize: 12,
              color: 'hsl(var(--text-muted))',
              lineHeight: 1.6,
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.02em',
              margin: 0,
              paddingLeft: 11,
            }}>
              Autentique-se com suas credenciais de administrador para acessar o painel de controle.
            </p>
          </div>

          {/* Form card */}
          <div style={{
            background: 'hsl(var(--bg-surface))',
            border: '2px solid hsl(var(--border-subtle))',
            boxShadow: '8px 8px 0 hsl(var(--border-subtle))',
            padding: '36px',
          }}>

            {/* Access level indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 28,
              paddingBottom: 16,
              borderBottom: '2px solid hsl(var(--border-subtle))',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 8, height: 8,
                  background: 'hsl(var(--brand-cyan))',
                  animation: 'pulse-dot 2s ease-in-out infinite',
                }} />
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  color: 'hsl(var(--text-muted))',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>Nível de Acesso</span>
              </div>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                fontWeight: 700,
                color: 'hsl(var(--brand-cyan))',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                border: '1px solid hsl(var(--brand-cyan) / 0.4)',
                background: 'hsl(var(--brand-cyan) / 0.08)',
              }}>Super Admin</span>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Email field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <label style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'hsl(var(--text-faint))',
                  fontFamily: 'JetBrains Mono, monospace',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <Mail size={9} />
                  E-mail do Administrador
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@majoragency.com.br"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'hsl(var(--bg-input))',
                      border: '2px solid hsl(var(--border-subtle))',
                      color: 'hsl(var(--text-primary))',
                      fontSize: 13,
                      outline: 'none',
                      fontFamily: 'JetBrains Mono, monospace',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.12s, box-shadow 0.12s',
                      letterSpacing: '0.01em',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'hsl(var(--brand-cyan))'
                      e.target.style.boxShadow = '3px 3px 0 hsl(var(--brand-cyan) / 0.25)'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'hsl(var(--border-subtle))'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>

              {/* Password field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <label style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'hsl(var(--text-faint))',
                  fontFamily: 'JetBrains Mono, monospace',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <Lock size={9} />
                  Senha de Acesso
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'hsl(var(--bg-input))',
                    border: '2px solid hsl(var(--border-subtle))',
                    color: 'hsl(var(--text-primary))',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'JetBrains Mono, monospace',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.12s, box-shadow 0.12s',
                    letterSpacing: '0.2em',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'hsl(var(--brand-cyan))'
                    e.target.style.boxShadow = '3px 3px 0 hsl(var(--brand-cyan) / 0.25)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'hsl(var(--border-subtle))'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '14px 24px',
                  background: isSubmitting ? 'hsl(var(--bg-elevated))' : 'hsl(var(--brand-cyan))',
                  border: '2px solid hsl(var(--text-primary))',
                  boxShadow: isSubmitting ? 'none' : '5px 5px 0 hsl(var(--text-primary))',
                  color: isSubmitting ? 'hsl(var(--text-muted))' : 'hsl(220 25% 6%)',
                  fontWeight: 800,
                  fontSize: 11,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontFamily: 'JetBrains Mono, monospace',
                  transition: 'all 0.12s',
                  width: '100%',
                }}
                onMouseEnter={e => {
                  if (!isSubmitting) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translate(-2px, -2px)'
                    ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '7px 7px 0 hsl(var(--text-primary))'
                  }
                }}
                onMouseLeave={e => {
                  if (!isSubmitting) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translate(0, 0)'
                    ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '5px 5px 0 hsl(var(--text-primary))'
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <div style={{
                      width: 12, height: 12,
                      border: '2px solid hsl(var(--text-muted))',
                      borderTopColor: 'transparent',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Verificando Credenciais...
                  </>
                ) : (
                  <>
                    <Shield size={13} />
                    Autenticar e Entrar
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer note */}
          <p style={{
            marginTop: 16,
            textAlign: 'center',
            fontSize: 10,
            color: 'hsl(var(--text-faint))',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.06em',
            lineHeight: 1.6,
          }}>
            Acesso exclusivo · Major Agency · Sistema Taref.ai
          </p>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes pulse-sq {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
