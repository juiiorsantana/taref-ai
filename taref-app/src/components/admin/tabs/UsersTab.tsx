import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { api } from '../../../services/api'
import { showToast } from '../../ui/Toast'
import { Shield, ShieldCheck, ShieldOff, Loader } from 'lucide-react'
import type { UserRole } from '../../../types'
import type { Database } from '../../../types/database'

type DbProfile = Database['public']['Tables']['profiles']['Row']

const ROLE_LABELS: Record<string, string> = {
  user: 'Usuário', admin: 'Admin', super_admin: 'Super Admin',
}
const ROLE_COLORS: Record<string, string> = {
  user: 'hsl(var(--text-faint))',
  admin: 'hsl(var(--brand-cyan))',
  super_admin: 'hsl(var(--brand-amber))',
}

export const UsersTab = () => {
  const { user: currentUser } = useAuth()
  const [profiles, setProfiles] = useState<DbProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    api.profiles.listAll()
      .then(setProfiles)
      .catch((err: Error) => showToast(`Erro ao carregar usuários: ${err.message}`, 'error'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleRoleChange = async (targetId: string, newRole: Exclude<UserRole, 'super_admin'>) => {
    setUpdating(targetId)
    try {
      await api.profiles.updateRole(targetId, newRole)
      setProfiles(prev => prev.map(p => p.id === targetId ? { ...p, role: newRole } : p))
      showToast('Role atualizado!', 'success')
    } catch (err) {
      showToast(`Erro: ${err instanceof Error ? err.message : String(err)}`, 'error')
    } finally {
      setUpdating(null)
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--text-faint))', fontSize: '13px' }}>
        <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
        Carregando usuários...
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {profiles.map(profile => {
        const isSelf = profile.id === currentUser?.id
        const isSuperAdminTarget = profile.role === 'super_admin'
        const isUpdating = updating === profile.id

        return (
          <div key={profile.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'hsl(var(--bg-surface))',
            border: '1px solid hsl(var(--border-subtle))',
            borderRadius: 'var(--radius-sm)',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              <div style={{
                width: 36, height: 36, flexShrink: 0,
                background: `hsl(${profile.avatar_color || '197 90% 42%'})`,
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 800, color: '#fff',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {profile.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '13px', fontWeight: 600,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {profile.full_name}
                  {isSelf && (
                    <span style={{ marginLeft: 6, fontSize: '10px', color: 'hsl(var(--text-faint))' }}>
                      (você)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'hsl(var(--text-faint))' }}>
                  {profile.job_title || '—'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{
                fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '2px',
                background: `${ROLE_COLORS[profile.role] ?? 'hsl(var(--text-faint))'}18`,
                color: ROLE_COLORS[profile.role] ?? 'hsl(var(--text-faint))',
                fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em',
              }}>
                {ROLE_LABELS[profile.role] ?? profile.role}
              </span>

              {!isSelf && !isSuperAdminTarget && (
                isUpdating ? (
                  <Loader size={16} style={{ color: 'hsl(var(--text-faint))', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {profile.role !== 'admin' && (
                      <ActionButton icon={<ShieldCheck size={13} />} label="Promover a Admin"
                        color="hsl(var(--brand-cyan))" onClick={() => handleRoleChange(profile.id, 'admin')} />
                    )}
                    {profile.role !== 'user' && (
                      <ActionButton icon={<ShieldOff size={13} />} label="Rebaixar a Usuário"
                        color="hsl(var(--brand-rose))" onClick={() => handleRoleChange(profile.id, 'user')} />
                    )}
                  </div>
                )
              )}

              {isSuperAdminTarget && <Shield size={15} style={{ color: 'hsl(var(--brand-amber))' }} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const ActionButton = ({ icon, label, color, onClick }: {
  icon: React.ReactNode; label: string; color: string; onClick: () => void
}) => (
  <button title={label} onClick={onClick} style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, background: 'transparent',
    border: `1px solid ${color}40`, borderRadius: 'var(--radius-sm)',
    color, cursor: 'pointer', transition: 'all var(--duration-fast)',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = `${color}18`
    e.currentTarget.style.borderColor = color
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = 'transparent'
    e.currentTarget.style.borderColor = `${color}40`
  }}>
    {icon}
  </button>
)
