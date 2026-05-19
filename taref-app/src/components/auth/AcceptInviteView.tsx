import { useState } from 'react'
import { api } from '../../services/api'
import { showToast } from '../ui/Toast'
import { Mail, User, Lock, CheckCircle, Loader, Zap } from 'lucide-react'

interface Props {
  token: string
}

export const AcceptInviteView = ({ token }: Props) => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password) {
      showToast('Preencha todos os campos.', 'error')
      return
    }
    if (password.length < 8) {
      showToast('Senha deve ter no mínimo 8 caracteres.', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      await api.invitations.accept({ token, email, password, fullName })
      setSuccess(true)
    } catch (err) {
      showToast(`Erro: ${err instanceof Error ? err.message : String(err)}`, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <CheckCircle size={48} style={{ color: 'hsl(var(--brand-cyan))', marginBottom: 16 }} />
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, marginBottom: 8 }}>
            Conta criada com sucesso!
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--text-muted))', marginBottom: 20 }}>
            Você já pode fazer login com seu email e senha.
          </p>
          <button onClick={() => { window.location.href = '/' }} style={primaryButtonStyle}>
            Ir para login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, hsl(var(--brand-blue)), hsl(var(--brand-cyan)))',
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={16} color="#fff" />
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Taref<span style={{ color: 'hsl(var(--brand-cyan))' }}>.ai</span>
          </div>
        </div>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, marginBottom: 6 }}>
          Você foi convidado como Admin
        </h1>
        <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--text-faint))', marginBottom: 24 }}>
          Preencha os dados abaixo para criar sua conta.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field icon={<User size={14} />} label="Nome completo">
            <input
              type="text" autoFocus required
              value={fullName} onChange={(e) => setFullName(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field icon={<Mail size={14} />} label="Email">
            <input
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field icon={<Lock size={14} />} label="Senha (mín. 8 caracteres)">
            <input
              type="password" required minLength={8}
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </Field>

          <button type="submit" disabled={isSubmitting} style={{
            ...primaryButtonStyle,
            opacity: isSubmitting ? 0.6 : 1,
            cursor: isSubmitting ? 'wait' : 'pointer',
            marginTop: 8,
          }}>
            {isSubmitting ? (
              <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : 'Criar conta'}
          </button>
        </form>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

const Field = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <span style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em',
      color: 'hsl(var(--text-muted))', textTransform: 'uppercase',
    }}>
      {icon} {label}
    </span>
    {children}
  </label>
)

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'hsl(var(--bg-app))', padding: 20,
}

const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: 380,
  padding: 28,
  background: 'hsl(var(--bg-surface))',
  border: '1px solid hsl(var(--border-subtle))',
  borderRadius: 'var(--radius-md)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px', fontSize: '13px',
  background: 'hsl(var(--bg-app))',
  border: '1px solid hsl(var(--border-subtle))',
  borderRadius: 'var(--radius-sm)',
  color: 'hsl(var(--text-primary))',
  boxSizing: 'border-box',
}

const primaryButtonStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '10px 16px', fontSize: '13px', fontWeight: 600,
  background: 'hsl(var(--brand-cyan))',
  border: 'none', borderRadius: 'var(--radius-sm)',
  color: '#fff', cursor: 'pointer', width: '100%',
}
