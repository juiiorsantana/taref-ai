import { useRef, useState, useEffect } from 'react'
import { useProject } from '../../context/ProjectContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { exportBackup, validateAndImport } from '../../utils/backup'
import { showToast } from '../ui/Toast'
import { api } from '../../services/api'
import { Download, Upload, User, Mail, Briefcase, Check, Moon, Sun, FileText, Plus, X } from 'lucide-react'

const AVATAR_COLORS = [
  { name: 'Ciano Neon', Hsl: '197 90% 42%' },
  { name: 'Azul Major', Hsl: '217 91% 42%' },
  { name: 'Bronze Imperial', Hsl: '38 90% 48%' },
  { name: 'Magenta Elétrico', Hsl: '346 87% 55%' },
  { name: 'Verde Esmeralda', Hsl: '158 64% 40%' },
]

const DEFAULT_ROLE_TAGS = [
  'Tech Lead',
  'Designer',
  'Copywriter',
  'Tráfego Pago',
  'Social Media',
  'Gestor de Projetos',
  'Desenvolvedor',
  'SEO',
]

const CUSTOM_ROLES_STORAGE_KEY = 'taref_custom_role_tags'

const loadCustomRoles = (): string[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_ROLES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export const SettingsView = () => {
  const { state, dispatch } = useProject()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const fileRef = useRef<HTMLInputElement>(null)

  // Local form states. Email é lido direto da sessão de auth — é o email
  // cadastrado na conta Supabase, e nunca cai no default mockado do reducer.
  const [name, setName] = useState(state.userProfile.name)
  const email = user?.email ?? state.userProfile.email
  const [role, setRole] = useState(state.userProfile.jobTitle)
  const [avatarColor, setAvatarColor] = useState(state.userProfile.avatarColor)
  const [customRoles, setCustomRoles] = useState<string[]>(() => loadCustomRoles())
  const [showNewTagInput, setShowNewTagInput] = useState(false)
  const [newTagDraft, setNewTagDraft] = useState('')

  const [isSaving, setIsSaving] = useState(false)

  const allRoleTags = Array.from(new Set([...DEFAULT_ROLE_TAGS, ...customRoles]))

  const persistCustomRoles = (next: string[]) => {
    setCustomRoles(next)
    localStorage.setItem(CUSTOM_ROLES_STORAGE_KEY, JSON.stringify(next))
  }

  const handleAddTag = () => {
    const trimmed = newTagDraft.trim()
    if (!trimmed) return
    if (allRoleTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Essa tag já existe!', 'info')
      setRole(trimmed)
      setNewTagDraft('')
      setShowNewTagInput(false)
      return
    }
    persistCustomRoles([...customRoles, trimmed])
    setRole(trimmed)
    setNewTagDraft('')
    setShowNewTagInput(false)
  }

  const handleRemoveCustomTag = (tag: string) => {
    persistCustomRoles(customRoles.filter((t) => t !== tag))
    if (role === tag) setRole('')
  }

  // Compute initials based on current name
  const computeInitials = (fullName: string): string => {
    const cleanName = fullName.replace(/^(dr\.|dra\.|sr\.|sra\.)\s+/i, '').trim()
    if (!cleanName) return 'MA'
    const parts = cleanName.split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }

  // Update initials whenever name changes
  const initials = computeInitials(name)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast('O nome não pode ficar vazio!', 'error')
      return
    }
    if (!user?.id) {
      showToast('Erro: Usuário não autenticado no Supabase!', 'error')
      return
    }

    setIsSaving(true)
    try {
      const profilePayload = {
        name: name.trim(),
        email,
        jobTitle: role.trim(),
        avatarColor,
        avatarInitials: initials,
      }

      await api.profiles.update(user.id, profilePayload)
      dispatch({
        type: 'UPDATE_PROFILE',
        payload: profilePayload,
      })
      showToast('Perfil atualizado com sucesso!', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[SettingsView] Erro ao salvar perfil:', msg)
      showToast(`Erro ao salvar perfil: ${msg}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = () => {
    exportBackup(state.clients, state.projects, state.tasks, state.userProfile)
    showToast('Backup exportado com sucesso!', 'success')
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = validateAndImport(ev.target?.result as string)
        dispatch({ type: 'IMPORT_DATA', payload: data })
        showToast('Dados e Perfil importados com sucesso!', 'success')

        // Update local state in case import had a profile (email is read-only,
        // bound directly to the cloud-stored userProfile.email)
        if (data.userProfile) {
          setName(data.userProfile.name)
          setRole(data.userProfile.jobTitle || (data.userProfile as any).role || '')
          setAvatarColor(data.userProfile.avatarColor)
        }
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Arquivo JSON com estrutura corrompida!',
          'error',
        )
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Ensure local states are updated if context profile is loaded asynchronously
  useEffect(() => {
    setName(state.userProfile.name)
    setRole(state.userProfile.jobTitle)
    setAvatarColor(state.userProfile.avatarColor)
  }, [state.userProfile])

  return (
    <div
      className="anim-fade-slide"
      style={{
        padding: '32px 24px',
        maxWidth: 960,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
      }}
    >
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
          Configurações da Agência
        </h1>
        <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
          Gerencie seu perfil de usuário da Major Agency e controle seus backups.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Form Perfil */}
        <div
          className="card"
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            borderRadius: '2px', // Sharp premium geometry
          }}
        >
          <div style={{ borderBottom: '1px solid hsl(var(--border-subtle))', paddingBottom: 12 }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={16} color="hsl(var(--brand-cyan))" />
              Meu Perfil
            </h2>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Live Avatar Preview & Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '2px', // Sharp visual style
                  background: `hsl(${avatarColor})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#fff',
                  fontFamily: 'JetBrains Mono, monospace',
                  boxShadow: 'var(--shadow-card)',
                  textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: 'background var(--duration-base) var(--ease-out)',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
                  Cor do Avatar
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {AVATAR_COLORS.map((color) => {
                    const isSelected = avatarColor === color.Hsl
                    return (
                      <button
                        key={color.Hsl}
                        type="button"
                        onClick={() => setAvatarColor(color.Hsl)}
                        title={color.name}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '2px', // Sharp preset selectors
                          background: `hsl(${color.Hsl})`,
                          border: isSelected ? '2px solid hsl(var(--text-primary))' : '1px solid hsl(var(--border-subtle))',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          transition: 'transform var(--duration-fast)',
                          transform: isSelected ? 'scale(1.1)' : 'none',
                        }}
                      >
                        {isSelected && <Check size={12} color="#fff" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label
                  htmlFor="user-name"
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'hsl(var(--text-muted))',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Nome Completo
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="user-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      background: 'hsl(var(--bg-input))',
                      border: '1px solid hsl(var(--border-subtle))',
                      borderRadius: '2px',
                      color: 'hsl(var(--text-primary))',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'hsl(var(--brand-cyan))')}
                    onBlur={(e) => (e.target.style.borderColor = 'hsl(var(--border-subtle))')}
                  />
                  <User size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-faint))' }} />
                </div>
              </div>

              <div>
                <label
                  htmlFor="user-email"
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'hsl(var(--text-muted))',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="user-email"
                    type="email"
                    value={email}
                    readOnly
                    disabled
                    title="O email não pode ser alterado após o cadastro."
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      background: 'hsl(var(--bg-input) / 0.55)',
                      border: '1px solid hsl(var(--border-subtle))',
                      borderRadius: '2px',
                      color: 'hsl(var(--text-muted))',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'not-allowed',
                    }}
                  />
                  <Mail size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-faint))' }} />
                </div>
                <p style={{ fontSize: '10.5px', color: 'hsl(var(--text-faint))', marginTop: 4, lineHeight: 1.3 }}>
                  Vinculado à sua conta — não pode ser alterado após o cadastro.
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'hsl(var(--text-muted))',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Cargo / Função
                </label>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    padding: 10,
                    background: 'hsl(var(--bg-input))',
                    border: '1px solid hsl(var(--border-subtle))',
                    borderRadius: '2px',
                    minHeight: 44,
                    alignItems: 'center',
                  }}
                >
                  {allRoleTags.map((tag) => {
                    const isSelected = role === tag
                    const isCustom = customRoles.includes(tag)
                    return (
                      <span
                        key={tag}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          background: isSelected ? 'hsl(var(--brand-cyan) / 0.18)' : 'hsl(var(--bg-elevated))',
                          border: `1px solid ${isSelected ? 'hsl(var(--brand-cyan))' : 'hsl(var(--border-subtle))'}`,
                          borderRadius: '2px',
                          color: isSelected ? 'hsl(var(--brand-cyan))' : 'hsl(var(--text-primary))',
                          fontSize: '12px',
                          fontWeight: 600,
                          transition: 'all var(--duration-fast)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setRole(tag)}
                          aria-pressed={isSelected}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: 'inherit',
                            fontSize: 'inherit',
                            fontWeight: 'inherit',
                            cursor: 'pointer',
                          }}
                        >
                          {isSelected && <Check size={11} />}
                          <Briefcase size={11} style={{ opacity: isSelected ? 1 : 0.55 }} />
                          {tag}
                        </button>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomTag(tag)}
                            aria-label={`Remover tag ${tag}`}
                            title="Remover tag personalizada"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              marginLeft: 2,
                              color: 'hsl(var(--text-faint))',
                              cursor: 'pointer',
                            }}
                          >
                            <X size={11} />
                          </button>
                        )}
                      </span>
                    )
                  })}

                  {showNewTagInput ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 4px 2px 8px',
                        background: 'hsl(var(--bg-elevated))',
                        border: '1px dashed hsl(var(--brand-cyan))',
                        borderRadius: '2px',
                      }}
                    >
                      <input
                        autoFocus
                        type="text"
                        value={newTagDraft}
                        onChange={(e) => setNewTagDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddTag()
                          } else if (e.key === 'Escape') {
                            setShowNewTagInput(false)
                            setNewTagDraft('')
                          }
                        }}
                        placeholder="Nova tag..."
                        style={{
                          background: 'none',
                          border: 'none',
                          outline: 'none',
                          color: 'hsl(var(--text-primary))',
                          fontSize: '12px',
                          fontWeight: 600,
                          width: 110,
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        aria-label="Confirmar nova tag"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: 'hsl(var(--brand-cyan))',
                          border: 'none',
                          color: 'hsl(220 25% 6%)',
                          padding: '3px 5px',
                          borderRadius: '2px',
                          cursor: 'pointer',
                        }}
                      >
                        <Check size={11} strokeWidth={3} />
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowNewTagInput(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '4px 8px',
                        background: 'transparent',
                        border: '1px dashed hsl(var(--border-subtle))',
                        borderRadius: '2px',
                        color: 'hsl(var(--text-muted))',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all var(--duration-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'hsl(var(--brand-cyan))'
                        e.currentTarget.style.color = 'hsl(var(--brand-cyan))'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'hsl(var(--border-subtle))'
                        e.currentTarget.style.color = 'hsl(var(--text-muted))'
                      }}
                    >
                      <Plus size={11} />
                      Criar tag
                    </button>
                  )}
                </div>
                <p style={{ fontSize: '10.5px', color: 'hsl(var(--text-faint))', marginTop: 4, lineHeight: 1.3 }}>
                  Selecione uma tag para definir seu cargo. Crie novas tags caso precise.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                width: '100%',
                padding: '10px',
                background: 'hsl(var(--brand-cyan))',
                border: 'none',
                borderRadius: '2px',
                color: 'hsl(220 25% 6%)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'opacity var(--duration-fast)',
                marginTop: 8,
                opacity: isSaving ? 0.6 : 1,
              }}
              onMouseEnter={(e) => { if (!isSaving) e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={(e) => { if (!isSaving) e.currentTarget.style.opacity = '1' }}
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        {/* Aparência — seletor de tema */}
        <div
          className="card"
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            borderRadius: '2px',
          }}
        >
          <div style={{ borderBottom: '1px solid hsl(var(--border-subtle))', paddingBottom: 12 }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Sun size={16} color="hsl(var(--brand-amber))" />
              Aparência
            </h2>
            <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', lineHeight: 1.4 }}>
              Escolha o tema visual do portal. A preferência é salva automaticamente.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {/* Dark theme card */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              aria-pressed={theme === 'dark'}
              style={{
                padding: 0,
                background: 'none',
                border: `2px solid ${theme === 'dark' ? 'hsl(var(--brand-cyan))' : 'hsl(var(--border-subtle))'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'border-color var(--duration-fast) var(--ease-out)',
                textAlign: 'left',
              }}
            >
              {/* Mini dark preview */}
              <div style={{ background: 'hsl(220 25% 4%)', padding: '10px 10px 8px', display: 'flex', gap: 5 }}>
                <div style={{ width: 18, flexShrink: 0, background: 'hsl(220 20% 7%)', borderRadius: 2, padding: '4px 3px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ height: 3, background: 'hsl(197 90% 42%)', borderRadius: 1 }} />
                  <div style={{ height: 2, background: 'hsl(215 16% 25%)', borderRadius: 1 }} />
                  <div style={{ height: 2, background: 'hsl(215 16% 25%)', borderRadius: 1 }} />
                  <div style={{ height: 2, background: 'hsl(215 16% 25%)', borderRadius: 1 }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ height: 5, background: 'hsl(220 20% 7%)', borderRadius: 2 }} />
                  <div style={{ height: 20, background: 'hsl(220 18% 9%)', borderRadius: 2, padding: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <div style={{ height: 7, width: '44%', background: 'hsl(220 18% 13%)', borderRadius: 1 }} />
                    <div style={{ height: 7, width: '44%', background: 'hsl(220 18% 13%)', borderRadius: 1 }} />
                    <div style={{ height: 7, width: '44%', background: 'hsl(220 18% 13%)', borderRadius: 1 }} />
                  </div>
                </div>
              </div>
              {/* Label */}
              <div style={{
                padding: '6px 10px',
                background: theme === 'dark' ? 'hsl(197 90% 42% / 0.1)' : 'hsl(220 20% 10%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(210 40% 90%)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Moon size={10} />
                  Escuro
                </span>
                {theme === 'dark' && <Check size={11} color="hsl(197 90% 42%)" strokeWidth={3} />}
              </div>
            </button>

            {/* Light theme card */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              aria-pressed={theme === 'light'}
              style={{
                padding: 0,
                background: 'none',
                border: `2px solid ${theme === 'light' ? 'hsl(var(--brand-cyan))' : 'hsl(var(--border-subtle))'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'border-color var(--duration-fast) var(--ease-out)',
                textAlign: 'left',
              }}
            >
              {/* Mini light preview */}
              <div style={{ background: 'hsl(42 22% 96%)', padding: '10px 10px 8px', display: 'flex', gap: 5 }}>
                <div style={{ width: 18, flexShrink: 0, background: 'hsl(32 12% 90%)', borderRadius: 2, padding: '4px 3px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ height: 3, background: 'hsl(197 90% 42%)', borderRadius: 1 }} />
                  <div style={{ height: 2, background: 'hsl(215 12% 74%)', borderRadius: 1 }} />
                  <div style={{ height: 2, background: 'hsl(215 12% 74%)', borderRadius: 1 }} />
                  <div style={{ height: 2, background: 'hsl(215 12% 74%)', borderRadius: 1 }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ height: 5, background: 'hsl(32 12% 90%)', borderRadius: 2 }} />
                  <div style={{ height: 20, background: 'hsl(0 0% 100%)', borderRadius: 2, padding: 3, display: 'flex', flexWrap: 'wrap', gap: 2, border: '1px solid hsl(220 12% 88%)' }}>
                    <div style={{ height: 7, width: '44%', background: 'hsl(220 12% 90%)', borderRadius: 1 }} />
                    <div style={{ height: 7, width: '44%', background: 'hsl(220 12% 90%)', borderRadius: 1 }} />
                    <div style={{ height: 7, width: '44%', background: 'hsl(220 12% 90%)', borderRadius: 1 }} />
                  </div>
                </div>
              </div>
              {/* Label */}
              <div style={{
                padding: '6px 10px',
                background: theme === 'light' ? 'hsl(197 90% 42% / 0.1)' : 'hsl(42 22% 93%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(220 25% 20%)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Sun size={10} />
                  Claro
                </span>
                {theme === 'light' && <Check size={11} color="hsl(197 90% 42%)" strokeWidth={3} />}
              </div>
            </button>

            {/* Notion theme card */}
            <button
              type="button"
              onClick={() => setTheme('notion')}
              aria-pressed={theme === 'notion'}
              style={{
                padding: 0,
                background: 'none',
                border: `2px solid ${theme === 'notion' ? 'hsl(215 65% 42%)' : 'hsl(var(--border-subtle))'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'border-color var(--duration-fast) var(--ease-out)',
                textAlign: 'left',
              }}
            >
              {/* Mini notion preview — editorial document on cream paper */}
              <div style={{ background: 'hsl(38 30% 94%)', padding: '10px 10px 8px', display: 'flex', gap: 5 }}>
                <div style={{ width: 18, flexShrink: 0, background: 'hsl(34 18% 86%)', borderRadius: 3, padding: '4px 3px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ height: 3, background: 'hsl(215 65% 42%)', borderRadius: 1 }} />
                  <div style={{ height: 2, background: 'hsl(32 14% 72%)', borderRadius: 1 }} />
                  <div style={{ height: 2, background: 'hsl(32 14% 72%)', borderRadius: 1 }} />
                  <div style={{ height: 2, background: 'hsl(32 14% 72%)', borderRadius: 1 }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Serif heading mock + body prose + checklist */}
                  <div style={{ height: 5, width: '55%', background: 'hsl(28 14% 12%)', borderRadius: 1 }} />
                  <div style={{ height: 1, width: '100%', background: 'hsl(32 14% 78%)', margin: '1px 0' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                    <div style={{ width: 4, height: 4, border: '1px solid hsl(28 6% 58%)', borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ height: 2, flex: 1, background: 'hsl(28 8% 50%)', borderRadius: 1 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 4, height: 4, background: 'hsl(28 8% 36%)', borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ height: 2, flex: 1, background: 'hsl(28 6% 70%)', borderRadius: 1, opacity: 0.6 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 4, height: 4, border: '1px solid hsl(28 6% 58%)', borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ height: 2, flex: 1, background: 'hsl(28 8% 50%)', borderRadius: 1 }} />
                  </div>
                </div>
              </div>
              {/* Label */}
              <div style={{
                padding: '6px 10px',
                background: theme === 'notion' ? 'hsl(215 65% 42% / 0.12)' : 'hsl(34 18% 88%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(28 14% 16%)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <FileText size={10} />
                  Notion
                </span>
                {theme === 'notion' && <Check size={11} color="hsl(215 65% 42%)" strokeWidth={3} />}
              </div>
            </button>
          </div>
        </div>

        {/* Data Actions (Backup Centralizado) */}
        <div
          className="card"
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            borderRadius: '2px',
          }}
        >
          <div style={{ borderBottom: '1px solid hsl(var(--border-subtle))', paddingBottom: 12 }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={16} color="hsl(var(--brand-amber))" />
              Gestão de Dados
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Card Export */}
            <div style={{
              padding: 14,
              background: 'hsl(var(--bg-elevated))',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: '2px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: 2 }}>Exportar Backup</h3>
                <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', lineHeight: '1.4' }}>
                  Baixe um arquivo JSON contendo todos os seus projetos, tarefas e dados de perfil ativos no portal.
                </p>
              </div>
              <button
                onClick={handleExport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: 'hsl(var(--brand-amber) / 0.12)',
                  border: '1px solid hsl(var(--brand-amber) / 0.25)',
                  borderRadius: '2px',
                  color: 'hsl(var(--brand-amber))',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--brand-amber) / 0.2)'
                  e.currentTarget.style.borderColor = 'hsl(var(--brand-amber) / 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--brand-amber) / 0.12)'
                  e.currentTarget.style.borderColor = 'hsl(var(--brand-amber) / 0.25)'
                }}
              >
                <Download size={13} />
                Exportar JSON
              </button>
            </div>

            {/* Card Import */}
            <div style={{
              padding: 14,
              background: 'hsl(var(--bg-elevated))',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: '2px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: 2 }}>Importar Backup</h3>
                <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', lineHeight: '1.4' }}>
                  Carregue um arquivo JSON gerado anteriormente. Seus dados e perfil atuais serão substituídos.
                </p>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: 'hsl(var(--brand-cyan) / 0.12)',
                  border: '1px solid hsl(var(--brand-cyan) / 0.25)',
                  borderRadius: '2px',
                  color: 'hsl(var(--brand-cyan))',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--brand-cyan) / 0.2)'
                  e.currentTarget.style.borderColor = 'hsl(var(--brand-cyan) / 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--brand-cyan) / 0.12)'
                  e.currentTarget.style.borderColor = 'hsl(var(--brand-cyan) / 0.25)'
                }}
              >
                <Upload size={13} />
                Importar JSON
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImport}
                aria-label="Importar arquivo de backup"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
