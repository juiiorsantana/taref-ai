import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { api } from '../../../services/api'
import { showToast } from '../../ui/Toast'
import { Loader, Check } from 'lucide-react'
import type { Database } from '../../../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type DbProject = Database['public']['Tables']['projects']['Row']
type ProjectAccess = Database['public']['Tables']['admin_project_access']['Row']

export const ProjectAccessTab = () => {
  const { user: currentUser } = useAuth()
  const [admins, setAdmins] = useState<Profile[]>([])
  const [projects, setProjects] = useState<DbProject[]>([])
  const [grants, setGrants] = useState<ProjectAccess[]>([])
  const [selectedAdminId, setSelectedAdminId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.profiles.listAll(),
      api.projects.list(),
      api.projectAccess.list(),
    ])
      .then(([profilesData, projectsData, grantsData]) => {
        const adminList = profilesData.filter(p => p.role === 'admin')
        setAdmins(adminList)
        setProjects(projectsData ?? [])
        setGrants(grantsData)
        if (adminList.length > 0) setSelectedAdminId(adminList[0].id)
      })
      .catch((err: Error) => showToast(`Erro: ${err.message}`, 'error'))
      .finally(() => setIsLoading(false))
  }, [])

  const grantedProjectIds = useMemo(() => {
    return new Set(grants.filter(g => g.admin_id === selectedAdminId).map(g => g.project_id))
  }, [grants, selectedAdminId])

  const handleToggle = async (projectId: string) => {
    if (!selectedAdminId || !currentUser) return
    setToggling(projectId)
    const hasAccess = grantedProjectIds.has(projectId)

    try {
      if (hasAccess) {
        await api.projectAccess.revoke(selectedAdminId, projectId)
        setGrants(prev => prev.filter(g => !(g.admin_id === selectedAdminId && g.project_id === projectId)))
        showToast('Acesso removido.', 'success')
      } else {
        await api.projectAccess.grant(selectedAdminId, projectId, currentUser.id)
        setGrants(prev => [...prev, {
          admin_id: selectedAdminId,
          project_id: projectId,
          granted_by: currentUser.id,
          granted_at: new Date().toISOString(),
        }])
        showToast('Acesso concedido.', 'success')
      }
    } catch (err) {
      showToast(`Erro: ${err instanceof Error ? err.message : String(err)}`, 'error')
    } finally {
      setToggling(null)
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--text-faint))', fontSize: '13px' }}>
        <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
        Carregando...
      </div>
    )
  }

  if (admins.length === 0) {
    return (
      <div style={{
        padding: 24, textAlign: 'center',
        color: 'hsl(var(--text-faint))', fontSize: '13px',
        border: '1px dashed hsl(var(--border-subtle))',
        borderRadius: 'var(--radius-sm)',
      }}>
        Nenhum admin cadastrado. Crie um convite na aba "Convites" para começar.
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: 'block', marginBottom: 6,
          fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em',
          color: 'hsl(var(--text-muted))', textTransform: 'uppercase',
        }}>
          Selecione o admin
        </label>
        <select
          value={selectedAdminId}
          onChange={(e) => setSelectedAdminId(e.target.value)}
          style={{
            width: '100%', maxWidth: 400,
            padding: '8px 10px', fontSize: '13px',
            background: 'hsl(var(--bg-app))',
            border: '1px solid hsl(var(--border-subtle))',
            borderRadius: 'var(--radius-sm)',
            color: 'hsl(var(--text-primary))',
          }}
        >
          {admins.map(admin => (
            <option key={admin.id} value={admin.id}>{admin.full_name}</option>
          ))}
        </select>
      </div>

      <div style={{
        fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em',
        color: 'hsl(var(--text-muted))', textTransform: 'uppercase',
        marginBottom: 8,
      }}>
        Projetos · {grantedProjectIds.size} de {projects.length} liberados
      </div>

      {projects.length === 0 ? (
        <div style={{
          padding: 24, textAlign: 'center',
          color: 'hsl(var(--text-faint))', fontSize: '13px',
          border: '1px dashed hsl(var(--border-subtle))',
          borderRadius: 'var(--radius-sm)',
        }}>
          Nenhum projeto cadastrado ainda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {projects.map(project => {
            const hasAccess = grantedProjectIds.has(project.id)
            const isToggling = toggling === project.id

            return (
              <button
                key={project.id}
                onClick={() => handleToggle(project.id)}
                disabled={isToggling}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', textAlign: 'left',
                  background: hasAccess ? 'hsl(var(--brand-cyan) / 0.08)' : 'hsl(var(--bg-surface))',
                  border: `1px solid ${hasAccess ? 'hsl(var(--brand-cyan) / 0.3)' : 'hsl(var(--border-subtle))'}`,
                  borderRadius: 'var(--radius-sm)',
                  cursor: isToggling ? 'wait' : 'pointer',
                  transition: 'all var(--duration-fast)',
                }}
              >
                <div style={{
                  width: 18, height: 18, flexShrink: 0,
                  background: hasAccess ? 'hsl(var(--brand-cyan))' : 'transparent',
                  border: `1.5px solid ${hasAccess ? 'hsl(var(--brand-cyan))' : 'hsl(var(--border-subtle))'}`,
                  borderRadius: '3px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isToggling ? (
                    <Loader size={11} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
                  ) : hasAccess ? (
                    <Check size={12} color="#fff" strokeWidth={3} />
                  ) : null}
                </div>
                <div style={{
                  width: 8, height: 8, flexShrink: 0,
                  background: project.color, borderRadius: '50%',
                }} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'hsl(var(--text-primary))' }}>
                  {project.name}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
