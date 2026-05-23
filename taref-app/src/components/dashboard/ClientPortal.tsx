import { useState } from 'react'
import { useProject } from '../../context/ProjectContext'
import { useAuth } from '../../context/AuthContext'
import { showToast } from '../ui/Toast'
import { generateSlug } from '../../utils/supabaseClient'
import { generateId } from '../../utils/date'
import type { Client, ClientNiche } from '../../types'
import {
  Search, Plus, Zap, ArrowRight, FolderOpen, X, Building2,
  Stethoscope, Scale, Briefcase, Layers, LogOut, Globe,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCENT_PALETTE = [
  { bg: 'hsl(var(--brand-cyan))',  fg: 'hsl(220 25% 6%)' },
  { bg: 'hsl(var(--brand-amber))', fg: 'hsl(220 25% 6%)' },
  { bg: 'hsl(var(--brand-rose))',  fg: '#ffffff' },
  { bg: 'hsl(var(--brand-blue))',  fg: '#ffffff' },
]

function nameToAccent(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return ACCENT_PALETTE[Math.abs(hash) % ACCENT_PALETTE.length]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

const NICHE_OPTIONS: { value: ClientNiche; label: string; icon: React.ReactNode }[] = [
  { value: 'medical', label: 'Médico',   icon: <Stethoscope size={16} /> },
  { value: 'dental',  label: 'Odonto',   icon: <Building2 size={16} /> },
  { value: 'legal',   label: 'Jurídico', icon: <Scale size={16} /> },
  { value: 'general', label: 'Geral',    icon: <Briefcase size={16} /> },
]

const NICHE_LABEL: Record<ClientNiche, string> = {
  medical: 'Médico', dental: 'Odonto', legal: 'Jurídico', general: 'Geral',
}

const COLOR_OPTIONS = ['#06B6D4', '#1E40AF', '#D97706', '#10B981', '#EF4444', '#F97316']

// ─── Add Client Modal ─────────────────────────────────────────────────────────

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
}

const AddClientModal = ({ isOpen, onClose }: AddClientModalProps) => {
  const { dispatch } = useProject()
  const [form, setForm] = useState({
    name: '', niche: 'general' as ClientNiche, color: '#06B6D4',
    clientEmail: '', description: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nome do cliente é obrigatório'
    if (form.clientEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail.trim()))
      e.clientEmail = 'E-mail inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const client: Client = {
      id: generateId(),
      name: form.name.trim(),
      niche: form.niche,
      color: form.color,
      description: form.description.trim() || undefined,
      clientSlug: generateSlug(form.name.trim()),
      clientEmail: form.clientEmail.trim(),
      isArchived: false,
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_CLIENT', payload: client })
    showToast(`Cliente "${client.name}" criado!`, 'success')
    setForm({ name: '', niche: 'general', color: '#06B6D4', clientEmail: '', description: '' })
    setErrors({})
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'hsl(var(--bg-surface))',
        border: '2px solid hsl(var(--border-subtle))',
        boxShadow: '8px 8px 0 hsl(var(--border-subtle))',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid hsl(var(--border-subtle))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32,
              background: 'hsl(var(--brand-cyan) / 0.1)',
              border: '1px solid hsl(var(--brand-cyan) / 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 size={15} color="hsl(var(--brand-cyan))" />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                Novo Cliente
              </h2>
              <p style={{ fontSize: '11px', color: 'hsl(var(--text-faint))', margin: 0 }}>
                Criar perfil e dashboard do cliente
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-faint))', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Nome do Cliente *
            </label>
            <input
              type="text"
              placeholder="ex: Dr. Lucas Nemes"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{
                padding: '9px 12px', background: 'hsl(var(--bg-input))',
                border: `1px solid ${errors.name ? 'hsl(var(--brand-rose))' : 'hsl(var(--border-subtle))'}`,
                color: 'hsl(var(--text-primary))', fontSize: '13px',
                outline: 'none', fontFamily: 'inherit', borderRadius: '2px',
              }}
              onFocus={(e) => !errors.name && (e.target.style.borderColor = 'hsl(var(--brand-cyan))')}
              onBlur={(e) => !errors.name && (e.target.style.borderColor = 'hsl(var(--border-subtle))')}
            />
            {errors.name && <span style={{ fontSize: '11px', color: 'hsl(var(--brand-rose))' }}>{errors.name}</span>}
          </div>

          {/* Niche */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Segmento
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {NICHE_OPTIONS.map((n) => (
                <button
                  key={n.value}
                  onClick={() => setForm({ ...form, niche: n.value })}
                  style={{
                    padding: '10px 6px',
                    background: form.niche === n.value ? 'hsl(var(--brand-cyan) / 0.1)' : 'hsl(var(--bg-input))',
                    border: `1px solid ${form.niche === n.value ? 'hsl(var(--brand-cyan) / 0.5)' : 'hsl(var(--border-subtle))'}`,
                    borderRadius: '2px', cursor: 'pointer', textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    color: form.niche === n.value ? 'hsl(var(--brand-cyan))' : 'hsl(var(--text-muted))',
                    transition: 'all 0.15s',
                  }}
                >
                  {n.icon}
                  <span style={{ fontSize: '10px', fontWeight: 600 }}>{n.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Cor do Perfil
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  style={{
                    width: 28, height: 28, background: c, borderRadius: '2px',
                    border: `2px solid ${form.color === c ? '#fff' : 'transparent'}`,
                    cursor: 'pointer', flexShrink: 0,
                    boxShadow: form.color === c ? `0 0 0 1px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              E-mail do Cliente (opcional)
            </label>
            <input
              type="email"
              placeholder="cliente@email.com"
              value={form.clientEmail}
              onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
              style={{
                padding: '9px 12px', background: 'hsl(var(--bg-input))',
                border: `1px solid ${errors.clientEmail ? 'hsl(var(--brand-rose))' : 'hsl(var(--border-subtle))'}`,
                color: 'hsl(var(--text-primary))', fontSize: '13px',
                outline: 'none', fontFamily: 'inherit', borderRadius: '2px',
              }}
            />
            {errors.clientEmail && <span style={{ fontSize: '11px', color: 'hsl(var(--brand-rose))' }}>{errors.clientEmail}</span>}
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Notas Gerais (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Observações sobre o cliente..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{
                padding: '9px 12px', background: 'hsl(var(--bg-input))',
                border: '1px solid hsl(var(--border-subtle))',
                color: 'hsl(var(--text-primary))', fontSize: '13px',
                outline: 'none', fontFamily: 'inherit', resize: 'vertical', borderRadius: '2px',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 10, padding: '16px 24px 20px',
          borderTop: '1px solid hsl(var(--border-subtle))',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', background: 'none',
              border: '1px solid hsl(var(--border-subtle))', borderRadius: '2px',
              color: 'hsl(var(--text-muted))', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '8px 20px',
              background: 'hsl(var(--brand-cyan))',
              border: '2px solid hsl(var(--text-primary))',
              boxShadow: '3px 3px 0 hsl(var(--text-primary))',
              color: 'hsl(220 25% 6%)', fontSize: '12px', fontWeight: 800,
              cursor: 'pointer', textTransform: 'uppercase',
              letterSpacing: '0.08em', fontFamily: 'inherit', borderRadius: '0',
            }}
          >
            Criar Cliente
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Client Portal ────────────────────────────────────────────────────────────

export const ClientPortal = () => {
  const { state, dispatch } = useProject()
  const { signOut, isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [hoveredClient, setHoveredClient] = useState<string | null>(null)
  const [hoveredMajorHub, setHoveredMajorHub] = useState(false)
  const [addHovered, setAddHovered] = useState(false)
  const [logoutHovered, setLogoutHovered] = useState(false)
  const [showAddClient, setShowAddClient] = useState(false)

  const visibleClients = state.clients.filter(
    (c) => !c.isArchived && c.name.toLowerCase().includes(search.toLowerCase()),
  )

  const projectCount = (clientId: string) =>
    state.projects.filter((p) => p.clientId === clientId && !p.isArchived).length

  const handleSelectClient = (clientId: string) => {
    dispatch({ type: 'SET_ACTIVE_CLIENT', payload: clientId })
  }

  const handleSelectMajorHub = () => {
    dispatch({ type: 'SET_ACTIVE_CLIENT', payload: 'global' })
  }

  // Totals for Major Hub card
  const totalActiveProjects = state.projects.filter((p) => !p.isArchived).length
  const totalActiveTasks = state.tasks.filter((t) => t.status !== 'done').length

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'hsl(var(--bg-app))',
        color: 'hsl(var(--text-primary))',
        backgroundImage:
          'linear-gradient(hsl(var(--border-subtle) / 0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border-subtle) / 0.35) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '56px 24px 80px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '920px' }}>

        {/* Agency badge row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{
            width: 34, height: 34,
            background: 'hsl(var(--brand-cyan))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid hsl(var(--text-primary))',
            boxShadow: '3px 3px 0 hsl(var(--text-primary))',
            flexShrink: 0,
          }}>
            <Zap size={16} color="hsl(220 25% 6%)" fill="hsl(220 25% 6%)" />
          </div>
          <span style={{
            fontFamily: 'JetBrains Mono, Courier New, monospace',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em',
            color: 'hsl(var(--text-faint))', textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>
            Taref.ai&nbsp;&nbsp;//&nbsp;&nbsp;Client Portal
          </span>
          <div style={{ flex: 1, height: '1px', background: 'hsl(var(--border-subtle))' }} />
          {state.clients.filter(c => !c.isArchived).length > 0 && (
            <span style={{
              fontFamily: 'JetBrains Mono, Courier New, monospace',
              fontSize: '10px', fontWeight: 700,
              color: 'hsl(var(--brand-cyan))',
              background: 'hsl(var(--brand-cyan) / 0.08)',
              border: '1px solid hsl(var(--brand-cyan) / 0.35)',
              padding: '3px 10px', letterSpacing: '0.12em', whiteSpace: 'nowrap',
            }}>
              {state.clients.filter(c => !c.isArchived).length}&nbsp;
              {state.clients.filter(c => !c.isArchived).length === 1 ? 'CLIENTE' : 'CLIENTES'}
            </span>
          )}

          <button
            onClick={signOut}
            onMouseEnter={() => setLogoutHovered(true)}
            onMouseLeave={() => setLogoutHovered(false)}
            title="Sair"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px',
              background: logoutHovered ? 'hsl(var(--brand-rose) / 0.1)' : 'transparent',
              border: `1px solid ${logoutHovered ? 'hsl(var(--brand-rose) / 0.5)' : 'hsl(var(--border-subtle))'}`,
              color: logoutHovered ? 'hsl(var(--brand-rose))' : 'hsl(var(--text-faint))',
              cursor: 'pointer', fontFamily: 'JetBrains Mono, Courier New, monospace',
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            <LogOut size={12} />
            Sair
          </button>
        </div>

        {/* Hero title */}
        <div style={{ marginBottom: 44 }}>
          <h1 style={{
            fontSize: 'clamp(40px, 6.5vw, 76px)', fontWeight: 900,
            letterSpacing: '-0.05em', lineHeight: 0.88,
            textTransform: 'uppercase', margin: '0 0 18px 0',
          }}>
            Selecione<br />
            <span style={{ color: 'hsl(var(--brand-cyan))' }}>o Cliente</span>
          </h1>
          <p style={{
            fontSize: '14px', color: 'hsl(var(--text-muted))',
            margin: 0, maxWidth: 420, lineHeight: 1.65,
          }}>
            Escolha uma conta para acessar seus projetos e quadro kanban da agência.
          </p>
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 28 }}>
          <Search size={15} style={{
            position: 'absolute', left: 16, top: '50%',
            transform: 'translateY(-50%)',
            color: 'hsl(var(--text-faint))', pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '13px 16px 13px 44px',
              backgroundColor: 'hsl(var(--bg-surface))',
              border: '2px solid hsl(var(--border-subtle))',
              color: 'hsl(var(--text-primary))', borderRadius: '0',
              fontSize: '13px', outline: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box', transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'hsl(var(--brand-cyan))'; e.target.style.boxShadow = '4px 4px 0 hsl(var(--brand-cyan) / 0.25)' }}
            onBlur={(e) => { e.target.style.borderColor = 'hsl(var(--border-subtle))'; e.target.style.boxShadow = 'none' }}
          />
        </div>

        {/* Empty state — no clients */}
        {state.clients.filter(c => !c.isArchived).length === 0 && (
          <div style={{
            border: '2px solid hsl(var(--border-subtle))',
            padding: '64px 40px', textAlign: 'center',
            background: 'hsl(var(--bg-surface))',
            boxShadow: '6px 6px 0 hsl(var(--border-subtle))',
          }}>
            <FolderOpen size={44} style={{ color: 'hsl(var(--text-faint))', marginBottom: 20 }} />
            <p style={{
              fontSize: '20px', fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '-0.03em', margin: '0 0 10px 0',
            }}>
              Nenhum cliente cadastrado
            </p>
            <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', margin: '0 0 28px 0' }}>
              Crie o perfil do primeiro cliente para começar a organizar sua agência.
            </p>
            <button
              onClick={() => setShowAddClient(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 28px',
                background: 'hsl(var(--brand-amber))',
                border: '2px solid hsl(var(--text-primary))',
                boxShadow: '4px 4px 0 hsl(var(--text-primary))',
                color: 'hsl(220 25% 6%)', fontWeight: 800, fontSize: '12px',
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em',
                fontFamily: 'inherit',
              }}
            >
              <Plus size={15} />
              Criar primeiro cliente
            </button>
          </div>
        )}

        {/* No search results */}
        {visibleClients.length === 0 && search && state.clients.length > 0 && (
          <div style={{
            border: '2px solid hsl(var(--border-subtle))',
            padding: '40px', textAlign: 'center',
            background: 'hsl(var(--bg-surface))',
          }}>
            <p style={{ fontSize: '14px', color: 'hsl(var(--text-faint))', margin: 0 }}>
              Nenhum cliente encontrado para{' '}
              <strong style={{ color: 'hsl(var(--text-primary))' }}>"{search}"</strong>
            </p>
          </div>
        )}

        {/* ── Major Hub card (admin only) ── */}
        {isAdmin && !search && (
          <div style={{ marginBottom: 24 }}>
            <p style={{
              fontSize: '9px', fontWeight: 600, letterSpacing: '0.14em',
              color: 'hsl(var(--text-faint))', textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              Agência
            </p>
            <button
              onClick={handleSelectMajorHub}
              onMouseEnter={() => setHoveredMajorHub(true)}
              onMouseLeave={() => setHoveredMajorHub(false)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'stretch',
                textAlign: 'left',
                padding: 0,
                backgroundColor: hoveredMajorHub ? 'hsl(var(--brand-cyan) / 0.06)' : 'hsl(var(--bg-surface))',
                border: `2px solid ${hoveredMajorHub ? 'hsl(var(--brand-cyan))' : 'hsl(var(--brand-cyan) / 0.4)'}`,
                borderRadius: '0',
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: hoveredMajorHub
                  ? '6px 6px 0 hsl(var(--brand-cyan) / 0.4)'
                  : '3px 3px 0 hsl(var(--brand-cyan) / 0.2)',
                transform: hoveredMajorHub ? 'translate(-2px, -2px)' : 'none',
                transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s, background 0.15s',
              }}
            >
              {/* Left cyan accent stripe */}
              <div style={{
                width: hoveredMajorHub ? 6 : 4,
                background: 'linear-gradient(180deg, hsl(var(--brand-cyan)), hsl(var(--brand-blue)))',
                flexShrink: 0,
                transition: 'width 0.15s',
              }} />

              {/* Card body */}
              <div style={{ padding: '16px 20px', flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Avatar */}
                <div style={{
                  width: 48, height: 48, flexShrink: 0,
                  background: 'linear-gradient(135deg, hsl(var(--brand-cyan)), hsl(var(--brand-blue)))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid hsl(var(--brand-cyan) / 0.5)',
                }}>
                  <Globe size={22} color="#fff" />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: '15px', fontWeight: 700, letterSpacing: '-0.025em',
                      color: hoveredMajorHub ? 'hsl(var(--brand-cyan))' : 'hsl(var(--text-primary))',
                      transition: 'color 0.15s',
                    }}>
                      Major Hub
                    </span>
                    <span style={{
                      fontSize: '9px', fontWeight: 700,
                      fontFamily: 'JetBrains Mono, Courier New, monospace',
                      color: 'hsl(var(--brand-cyan))',
                      background: 'hsl(var(--brand-cyan) / 0.1)',
                      border: '1px solid hsl(var(--brand-cyan) / 0.35)',
                      padding: '2px 7px', letterSpacing: '0.12em', textTransform: 'uppercase',
                    }}>
                      AGÊNCIA
                    </span>
                  </div>
                  <p style={{
                    fontSize: '11px', color: 'hsl(var(--text-faint))', margin: 0, lineHeight: 1.5,
                  }}>
                    Visão consolidada de todos os clientes e projetos
                  </p>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '20px', fontWeight: 800,
                      fontFamily: 'JetBrains Mono, monospace',
                      color: 'hsl(var(--brand-cyan))', lineHeight: 1,
                    }}>
                      {state.clients.filter(c => !c.isArchived).length}
                    </div>
                    <div style={{
                      fontSize: '9px', color: 'hsl(var(--text-faint))',
                      textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2,
                    }}>
                      Clientes
                    </div>
                  </div>
                  <div style={{ width: 1, background: 'hsl(var(--border-subtle))' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '20px', fontWeight: 800,
                      fontFamily: 'JetBrains Mono, monospace',
                      color: 'hsl(var(--brand-amber))', lineHeight: 1,
                    }}>
                      {totalActiveProjects}
                    </div>
                    <div style={{
                      fontSize: '9px', color: 'hsl(var(--text-faint))',
                      textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2,
                    }}>
                      Projetos
                    </div>
                  </div>
                  <div style={{ width: 1, background: 'hsl(var(--border-subtle))' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '20px', fontWeight: 800,
                      fontFamily: 'JetBrains Mono, monospace',
                      color: 'hsl(var(--brand-rose))', lineHeight: 1,
                    }}>
                      {totalActiveTasks}
                    </div>
                    <div style={{
                      fontSize: '9px', color: 'hsl(var(--text-faint))',
                      textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2,
                    }}>
                      Tarefas
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight size={16} style={{
                  color: hoveredMajorHub ? 'hsl(var(--brand-cyan))' : 'hsl(var(--text-faint))',
                  transform: hoveredMajorHub ? 'translateX(3px)' : 'none',
                  transition: 'transform 0.15s, color 0.15s',
                  flexShrink: 0,
                }} />
              </div>
            </button>
          </div>
        )}

        {/* ── Section heading for client accounts ── */}
        {isAdmin && (
          <p style={{
            fontSize: '9px', fontWeight: 600, letterSpacing: '0.14em',
            color: 'hsl(var(--text-faint))', textTransform: 'uppercase',
            marginBottom: 10,
          }}>
            Clientes
          </p>
        )}

        {/* Client grid */}
        {(visibleClients.length > 0 || (!search && state.clients.filter(c => !c.isArchived).length > 0)) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))',
            gap: 14,
          }}>
            {visibleClients.map((client) => {
              const accent = nameToAccent(client.name)
              const initials = getInitials(client.name)
              const isHovered = hoveredClient === client.id
              const count = projectCount(client.id)

              return (
                <button
                  key={client.id}
                  onClick={() => handleSelectClient(client.id)}
                  onMouseEnter={() => setHoveredClient(client.id)}
                  onMouseLeave={() => setHoveredClient(null)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                    textAlign: 'left', padding: 0,
                    backgroundColor: 'hsl(var(--bg-surface))',
                    border: `2px solid ${isHovered ? 'hsl(var(--text-primary))' : 'hsl(var(--border-subtle))'}`,
                    borderRadius: '0', cursor: 'pointer', overflow: 'hidden',
                    boxShadow: isHovered ? '6px 6px 0 hsl(var(--text-primary))' : '3px 3px 0 hsl(var(--border-subtle))',
                    transform: isHovered ? 'translate(-2px, -2px)' : 'none',
                    transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
                  }}
                >
                  {/* Top accent stripe */}
                  <div style={{
                    height: isHovered ? 5 : 3,
                    background: client.color || accent.bg,
                    flexShrink: 0, transition: 'height 0.15s',
                  }} />

                  {/* Card body */}
                  <div style={{ padding: '18px 20px 14px', flex: 1 }}>
                    <div style={{
                      display: 'flex', alignItems: 'flex-start',
                      justifyContent: 'space-between', marginBottom: 14,
                    }}>
                      <div style={{
                        width: 46, height: 46,
                        background: client.color || accent.bg,
                        color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '15px', fontWeight: 800, letterSpacing: '0.02em',
                        fontFamily: 'JetBrains Mono, Courier New, monospace',
                        border: '2px solid hsl(var(--border-subtle))', flexShrink: 0,
                      }}>
                        {initials}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{
                          fontSize: '9px', fontWeight: 700,
                          fontFamily: 'JetBrains Mono, Courier New, monospace',
                          color: 'hsl(var(--text-faint))',
                          background: 'hsl(var(--bg-elevated))',
                          border: '1px solid hsl(var(--border-subtle))',
                          padding: '3px 7px', letterSpacing: '0.1em', textTransform: 'uppercase',
                        }}>
                          {count}&nbsp;{count === 1 ? 'projeto' : 'projetos'}
                        </span>
                        <span style={{
                          fontSize: '9px', fontWeight: 600,
                          fontFamily: 'JetBrains Mono, Courier New, monospace',
                          color: 'hsl(var(--text-faint))',
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                        }}>
                          #{NICHE_LABEL[client.niche]}
                        </span>
                      </div>
                    </div>

                    <h3 style={{
                      fontSize: '15px', fontWeight: 700, letterSpacing: '-0.025em',
                      margin: '0 0 5px 0', color: 'hsl(var(--text-primary))', lineHeight: 1.2,
                    }}>
                      {client.name}
                    </h3>

                    {client.description && (
                      <p style={{
                        fontSize: '11px', color: 'hsl(var(--text-faint))',
                        margin: 0, lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {client.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom CTA bar */}
                  <div style={{
                    borderTop: '1px solid hsl(var(--border-subtle))',
                    padding: '9px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: isHovered ? 'hsl(var(--brand-cyan) / 0.06)' : 'transparent',
                    transition: 'background 0.15s',
                  }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      fontFamily: 'JetBrains Mono, Courier New, monospace',
                      color: isHovered ? 'hsl(var(--brand-cyan))' : 'hsl(var(--text-faint))',
                      transition: 'color 0.15s',
                    }}>
                      Acessar Dashboard
                    </span>
                    <ArrowRight size={13} style={{
                      color: isHovered ? 'hsl(var(--brand-cyan))' : 'hsl(var(--text-faint))',
                      transform: isHovered ? 'translateX(3px)' : 'none',
                      transition: 'transform 0.15s, color 0.15s',
                    }} />
                  </div>
                </button>
              )
            })}

            {/* Add new client card */}
            {!search && (
              <button
                onClick={() => setShowAddClient(true)}
                onMouseEnter={() => setAddHovered(true)}
                onMouseLeave={() => setAddHovered(false)}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12,
                  padding: '32px 20px', backgroundColor: 'transparent',
                  border: `2px dashed ${addHovered ? 'hsl(var(--brand-amber))' : 'hsl(var(--border-subtle))'}`,
                  borderRadius: '0', cursor: 'pointer', minHeight: '190px',
                  boxShadow: addHovered ? '6px 6px 0 hsl(var(--brand-amber) / 0.35)' : 'none',
                  transform: addHovered ? 'translate(-2px, -2px)' : 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
                }}
              >
                <div style={{
                  width: 46, height: 46,
                  border: `2px dashed ${addHovered ? 'hsl(var(--brand-amber))' : 'hsl(var(--border-subtle))'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: addHovered ? 'hsl(var(--brand-amber))' : 'hsl(var(--text-faint))',
                  transition: 'border-color 0.15s, color 0.15s',
                }}>
                  <Layers size={22} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{
                    fontSize: '12px', fontWeight: 800,
                    color: addHovered ? 'hsl(var(--brand-amber))' : 'hsl(var(--text-faint))',
                    margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.08em',
                    transition: 'color 0.15s',
                  }}>
                    Novo Cliente
                  </p>
                  <p style={{
                    fontSize: '11px', color: 'hsl(var(--text-faint))', margin: 0,
                    fontFamily: 'JetBrains Mono, Courier New, monospace',
                  }}>
                    Criar perfil & dashboard
                  </p>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      <AddClientModal isOpen={showAddClient} onClose={() => setShowAddClient(false)} />
    </div>
  )
}
