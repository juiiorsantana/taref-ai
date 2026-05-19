import { useEffect, useState } from 'react'
import { api } from '../../../services/api'
import { showToast } from '../../ui/Toast'
import { Copy, Plus, Trash2, Mail, Clock, CheckCircle, Loader } from 'lucide-react'
import type { Database } from '../../../types/database'

type Invitation = Database['public']['Tables']['invitations']['Row']

export const InvitationsTab = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [daysInput, setDaysInput] = useState(7)

  const load = () => {
    setIsLoading(true)
    api.invitations.list()
      .then(setInvitations)
      .catch((err: Error) => showToast(`Erro: ${err.message}`, 'error'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const invitation = await api.invitations.create({
        email: emailInput.trim() || undefined,
        expiresInDays: daysInput,
      })
      setInvitations(prev => [invitation, ...prev])
      setEmailInput('')
      showToast('Convite gerado! Copie o link para enviar.', 'success')
    } catch (err) {
      showToast(`Erro: ${err instanceof Error ? err.message : String(err)}`, 'error')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.invitations.delete(id)
      setInvitations(prev => prev.filter(i => i.id !== id))
      showToast('Convite removido.', 'success')
    } catch (err) {
      showToast(`Erro: ${err instanceof Error ? err.message : String(err)}`, 'error')
    }
  }

  const buildInviteUrl = (token: string) =>
    `${window.location.origin}/?invite=${token}`

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(buildInviteUrl(token))
    showToast('Link copiado para a área de transferência!', 'success')
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const getStatus = (inv: Invitation): { label: string; color: string; icon: React.ReactNode } => {
    if (inv.used_at) return { label: 'Usado', color: 'hsl(var(--text-faint))', icon: <CheckCircle size={11} /> }
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      return { label: 'Expirado', color: 'hsl(var(--brand-rose))', icon: <Clock size={11} /> }
    }
    return { label: 'Ativo', color: 'hsl(var(--brand-cyan))', icon: <Clock size={11} /> }
  }

  return (
    <div>
      {/* Form de criação */}
      <div style={{
        padding: 16, marginBottom: 20,
        background: 'hsl(var(--bg-surface))',
        border: '1px solid hsl(var(--border-subtle))',
        borderRadius: 'var(--radius-sm)',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: 10, color: 'hsl(var(--text-muted))' }}>
          Gerar novo convite de Admin
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="email"
            placeholder="Email (opcional, vincula ao convite)"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            style={{
              flex: '1 1 240px', minWidth: 0,
              padding: '8px 10px', fontSize: '13px',
              background: 'hsl(var(--bg-app))',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: 'var(--radius-sm)',
              color: 'hsl(var(--text-primary))',
            }}
          />
          <input
            type="number"
            min={1} max={30}
            value={daysInput}
            onChange={(e) => setDaysInput(parseInt(e.target.value) || 7)}
            style={{
              width: 90, padding: '8px 10px', fontSize: '13px',
              background: 'hsl(var(--bg-app))',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: 'var(--radius-sm)',
              color: 'hsl(var(--text-primary))',
            }}
          />
          <span style={{ alignSelf: 'center', fontSize: '11px', color: 'hsl(var(--text-faint))' }}>dias</span>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', fontSize: '12px', fontWeight: 600,
              background: 'hsl(var(--brand-cyan))',
              border: 'none', borderRadius: 'var(--radius-sm)',
              color: '#fff', cursor: isCreating ? 'wait' : 'pointer',
              opacity: isCreating ? 0.6 : 1,
            }}
          >
            {isCreating ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />}
            Gerar Link
          </button>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div style={{ color: 'hsl(var(--text-faint))', fontSize: '13px' }}>Carregando...</div>
      ) : invitations.length === 0 ? (
        <div style={{
          padding: 24, textAlign: 'center',
          color: 'hsl(var(--text-faint))', fontSize: '13px',
          border: '1px dashed hsl(var(--border-subtle))',
          borderRadius: 'var(--radius-sm)',
        }}>
          Nenhum convite gerado ainda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {invitations.map(inv => {
            const status = getStatus(inv)
            const isActive = status.label === 'Ativo'

            return (
              <div key={inv.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', gap: 12,
                background: 'hsl(var(--bg-surface))',
                border: '1px solid hsl(var(--border-subtle))',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    {inv.email ? (
                      <>
                        <Mail size={12} style={{ color: 'hsl(var(--text-faint))' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{inv.email}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
                        Convite aberto (sem email)
                      </span>
                    )}
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '2px',
                      background: `${status.color}18`, color: status.color,
                      fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em',
                    }}>
                      {status.icon} {status.label.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'hsl(var(--text-faint))' }}>
                    Expira em {formatDate(inv.expires_at)}
                    {inv.used_at && ` · Usado em ${formatDate(inv.used_at)}`}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 4 }}>
                  {isActive && (
                    <button
                      title="Copiar link"
                      onClick={() => handleCopy(inv.token)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, background: 'transparent',
                        border: '1px solid hsl(var(--brand-cyan) / 0.4)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'hsl(var(--brand-cyan))', cursor: 'pointer',
                      }}
                    >
                      <Copy size={13} />
                    </button>
                  )}
                  <button
                    title="Remover"
                    onClick={() => handleDelete(inv.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 28, background: 'transparent',
                      border: '1px solid hsl(var(--brand-rose) / 0.4)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'hsl(var(--brand-rose))', cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
