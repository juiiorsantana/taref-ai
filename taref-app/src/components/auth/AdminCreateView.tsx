import React, { useState } from 'react'
import { Lock, Mail, User, Shield, Crown, Loader, ArrowRight } from 'lucide-react'
import { showToast } from '../ui/Toast'

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin`

export const AdminCreateView: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminToken, setAdminToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password || !adminToken.trim()) {
      showToast('Preencha todos os campos', 'error')
      return
    }
    if (password.length < 12) {
      showToast('Senha deve ter no mínimo 12 caracteres', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: name.trim(),
          adminToken: adminToken.trim(),
        }),
      })
      const data = await res.json() as { error?: string; success?: boolean }
      if (!res.ok || !data.success) {
        showToast(data.error ?? 'Erro ao criar administrador', 'error')
      } else {
        showToast('Administrador criado! Faça login.', 'success')
        window.location.href = '/'
      }
    } catch {
      showToast('Erro de conexão. Tente novamente.', 'error')
    } finally {
      setIsSubmitting(false)
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
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo / Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{
            width: 36, height: 36,
            background: 'hsl(var(--brand-blue))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid hsl(var(--text-primary))',
            boxShadow: '3px 3px 0 hsl(var(--text-primary))',
          }}>
            <Crown size={18} color="hsl(220 25% 6%)" fill="hsl(220 25% 6%)" />
          </div>
          <div>
            <span style={{
              fontFamily: 'JetBrains Mono, Courier New, monospace',
              fontSize: '16px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'hsl(var(--text-primary))',
            }}>
              Modo Admin
            </span>
            <div style={{
              fontSize: '10px',
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.12em',
              color: 'hsl(var(--brand-cyan))',
              textTransform: 'uppercase',
            }}>
              Forja de Privilégios
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
            Novo Administrador
          </h1>
          <p style={{
            fontSize: '12px',
            color: 'hsl(var(--text-muted))',
            marginBottom: 28,
            lineHeight: 1.5,
          }}>
            Credencial de alto privilégio necessária para criar esta conta.
          </p>

          <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{
                fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'hsl(var(--text-faint))',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                Nome Completo
              </label>
              <div style={{ position: 'relative' }}>
                <User size={13} style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'hsl(var(--text-faint))', pointerEvents: 'none',
                }} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do Admin"
                  style={{
                    width: '100%', padding: '10px 12px 10px 36px',
                    background: 'hsl(var(--bg-input))',
                    border: '2px solid hsl(var(--border-subtle))',
                    color: 'hsl(var(--text-primary))',
                    fontSize: '13px', outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'hsl(var(--brand-cyan))')}
                  onBlur={(e) => (e.target.style.borderColor = 'hsl(var(--border-subtle))')}
                />
              </div>
            </div>

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
                  placeholder="admin@agencia.com.br"
                  style={{
                    width: '100%', padding: '10px 12px 10px 36px',
                    background: 'hsl(var(--bg-input))',
                    border: '2px solid hsl(var(--border-subtle))',
                    color: 'hsl(var(--text-primary))',
                    fontSize: '13px', outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
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
                  minLength={12}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '10px 12px 10px 36px',
                    background: 'hsl(var(--bg-input))',
                    border: '2px solid hsl(var(--border-subtle))',
                    color: 'hsl(var(--text-primary))',
                    fontSize: '13px', outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'hsl(var(--brand-cyan))')}
                  onBlur={(e) => (e.target.style.borderColor = 'hsl(var(--border-subtle))')}
                />
              </div>
            </div>

            {/* Secret Code */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{
                fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'hsl(var(--brand-cyan))',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                Token de Autorização
              </label>
              <div style={{ position: 'relative' }}>
                <Shield size={13} style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'hsl(var(--brand-cyan))', pointerEvents: 'none',
                }} />
                <input
                  type="password"
                  required
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  placeholder="Token de autorização"
                  style={{
                    width: '100%', padding: '10px 12px 10px 36px',
                    background: 'hsl(var(--bg-input))',
                    border: '2px solid hsl(var(--brand-cyan) / 0.5)',
                    color: 'hsl(var(--text-primary))',
                    fontSize: '13px', outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'hsl(var(--brand-cyan))')}
                  onBlur={(e) => (e.target.style.borderColor = 'hsl(var(--brand-cyan) / 0.5)')}
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
                background: isSubmitting ? 'hsl(var(--bg-elevated))' : 'hsl(var(--brand-blue))',
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
                  Processando...
                </>
              ) : (
                <>
                  <ArrowRight size={14} />
                  Forjar Administrador
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
          Em caso de emergência, desative a rota em App.tsx
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
