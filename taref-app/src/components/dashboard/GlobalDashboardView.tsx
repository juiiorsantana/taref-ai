import { useState, useMemo } from 'react'
import { ChevronDown, Globe, ChevronsDown, ChevronsUp, AlertCircle } from 'lucide-react'
import { useProject } from '../../context/ProjectContext'
import { ProjectCard } from './ProjectCard'
import type { Project } from '../../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTaskStats = (projectId: string, tasks: { projectId: string; status: string; deadline?: string }[]) => {
  const pts = tasks.filter((t) => t.projectId === projectId)
  const done = pts.filter((t) => t.status === 'done').length
  const overdue = pts.filter((t) => {
    if (!t.deadline || t.status === 'done') return false
    return new Date(t.deadline) < new Date()
  }).length
  return { total: pts.length, done, overdue }
}

// ─── Client Section ───────────────────────────────────────────────────────────

interface GlobalClientSectionProps {
  clientId: string
  clientName: string
  clientColor: string
  projects: Project[]
  tasks: { projectId: string; status: string; deadline?: string }[]
  isExpanded: boolean
  onToggle: () => void
  onProjectClick: (projectId: string) => void
  searchQuery: string
}

const GlobalClientSection = ({
  clientName,
  clientColor,
  projects,
  tasks,
  isExpanded,
  onToggle,
  onProjectClick,
  searchQuery,
}: GlobalClientSectionProps) => {
  const activeTasks = tasks.filter((t) => t.status !== 'done')
  const overdueTasks = tasks.filter((t) => {
    if (!t.deadline || t.status === 'done') return false
    return new Date(t.deadline) < new Date()
  })
  const doneTasks = tasks.filter((t) => t.status === 'done')

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects
    const q = searchQuery.toLowerCase()
    return projects.filter((p) =>
      p.name.toLowerCase().includes(q) || (p.description?.toLowerCase().includes(q) ?? false)
    )
  }, [projects, searchQuery])

  const initials = clientName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div style={{
      border: '1px solid hsl(var(--border-subtle))',
      borderRadius: 2,
      background: 'hsl(var(--bg-surface))',
      overflow: 'hidden',
    }}>
      {/* Client header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          background: 'hsl(var(--bg-elevated))',
          border: 'none',
          borderBottom: isExpanded ? '1px solid hsl(var(--border-subtle))' : 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'hsl(var(--text-primary))',
          transition: 'background var(--duration-fast)',
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) e.currentTarget.style.background = 'hsl(var(--bg-card))'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'hsl(var(--bg-elevated))'
        }}
      >
        <div style={{ width: 3, height: 32, borderRadius: 2, flexShrink: 0, background: clientColor }} />

        <div style={{
          width: 34, height: 34, flexShrink: 0,
          background: clientColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 800, letterSpacing: '0.02em',
          fontFamily: 'JetBrains Mono, monospace',
          color: '#fff', borderRadius: 2,
        }}>
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px', fontWeight: 700, letterSpacing: '-0.02em',
            color: 'hsl(var(--text-primary))',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {clientName}
          </div>
          <div style={{ fontSize: '11px', color: 'hsl(var(--text-faint))', marginTop: 1 }}>
            {projects.length} {projects.length === 1 ? 'projeto' : 'projetos'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {overdueTasks.length > 0 && (
            <span
              className="overdue-blink"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: '10px', fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace',
                color: 'hsl(var(--brand-rose))',
                background: 'hsl(var(--brand-rose) / 0.1)',
                border: '1px solid hsl(var(--brand-rose) / 0.3)',
                padding: '2px 8px', borderRadius: 2,
              }}
            >
              <AlertCircle size={10} />
              {overdueTasks.length} atrasada{overdueTasks.length > 1 ? 's' : ''}
            </span>
          )}
          <span style={{
            fontSize: '10px', fontWeight: 600,
            fontFamily: 'JetBrains Mono, monospace',
            color: 'hsl(var(--text-faint))',
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border-subtle))',
            padding: '2px 8px', borderRadius: 2,
          }}>
            {doneTasks.length}/{tasks.length} ✓
          </span>
          <span style={{
            fontSize: '10px', fontWeight: 600,
            fontFamily: 'JetBrains Mono, monospace',
            color: activeTasks.length > 0 ? 'hsl(var(--brand-cyan))' : 'hsl(var(--text-faint))',
            background: activeTasks.length > 0 ? 'hsl(var(--brand-cyan) / 0.08)' : 'hsl(var(--bg-card))',
            border: `1px solid ${activeTasks.length > 0 ? 'hsl(var(--brand-cyan) / 0.25)' : 'hsl(var(--border-subtle))'}`,
            padding: '2px 8px', borderRadius: 2,
          }}>
            {activeTasks.length} ativa{activeTasks.length !== 1 ? 's' : ''}
          </span>
        </div>

        <ChevronDown
          size={16}
          style={{
            color: 'hsl(var(--text-faint))',
            transform: isExpanded ? 'rotate(180deg)' : 'none',
            transition: 'transform var(--duration-base) var(--ease-out)',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Project cards grid */}
      <div style={{
        maxHeight: isExpanded ? 9999 : 0,
        overflow: 'hidden',
        transition: 'max-height var(--duration-slow) var(--ease-out)',
      }}>
        {filteredProjects.length === 0 ? (
          <div style={{
            padding: '16px 20px',
            fontSize: 12,
            color: 'hsl(var(--text-faint))',
            fontStyle: 'italic',
          }}>
            {searchQuery
              ? `Nenhum projeto encontrado para "${searchQuery}".`
              : 'Nenhum projeto ativo.'}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12,
            padding: '12px 16px 16px',
          }}>
            {filteredProjects.map((project) => {
              const stats = getTaskStats(project.id, tasks)
              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  taskCount={stats.total}
                  doneCount={stats.done}
                  overdueCount={stats.overdue}
                  onClick={() => onProjectClick(project.id)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Global Dashboard View ────────────────────────────────────────────────────

interface GlobalDashboardViewProps {
  searchQuery: string
}

export const GlobalDashboardView = ({ searchQuery }: GlobalDashboardViewProps) => {
  const { state, dispatch } = useProject()
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({})

  const activeClients = useMemo(
    () => state.clients.filter((c) => !c.isArchived).sort((a, b) => a.name.localeCompare(b.name)),
    [state.clients],
  )

  const getExpanded = (clientId: string) =>
    expandedClients[clientId] !== undefined ? expandedClients[clientId] : true

  const toggleClient = (clientId: string) => {
    setExpandedClients((prev) => ({ ...prev, [clientId]: !getExpanded(clientId) }))
  }

  const expandAll = () => {
    const next: Record<string, boolean> = {}
    activeClients.forEach((c) => (next[c.id] = true))
    setExpandedClients(next)
  }

  const collapseAll = () => {
    const next: Record<string, boolean> = {}
    activeClients.forEach((c) => (next[c.id] = false))
    setExpandedClients(next)
  }

  const filteredClients = useMemo(() => {
    if (!searchQuery) return activeClients
    const q = searchQuery.toLowerCase()
    return activeClients.filter((client) => {
      if (client.name.toLowerCase().includes(q)) return true
      const clientProjects = state.projects.filter((p) => p.clientId === client.id && !p.isArchived)
      return clientProjects.some((p) => p.name.toLowerCase().includes(q) || (p.description?.toLowerCase().includes(q) ?? false))
    })
  }, [activeClients, searchQuery, state.projects])

  const totalActiveTasks = state.tasks.filter((t) => t.status !== 'done').length
  const totalOverdue = state.tasks.filter((t) => {
    if (!t.deadline || t.status === 'done') return false
    return new Date(t.deadline) < new Date()
  }).length
  const totalProjects = state.projects.filter((p) => !p.isArchived).length

  const handleProjectClick = (projectId: string) => {
    dispatch({ type: 'SET_ACTIVE_PROJECT', payload: projectId })
  }

  const btnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 12px',
    background: 'none',
    border: '1px solid hsl(var(--border-subtle))',
    borderRadius: 2,
    color: 'hsl(var(--text-muted))',
    fontSize: '11px', cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all var(--duration-fast)',
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 32, height: 32,
                background: 'linear-gradient(135deg, hsl(var(--brand-cyan)), hsl(var(--brand-blue)))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 2,
              }}>
                <Globe size={16} color="#fff" />
              </div>
              <h2 style={{
                fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em',
                color: 'hsl(var(--text-primary))', margin: 0,
              }}>
                Major Hub
              </h2>
              <span style={{
                fontSize: '9px', fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace',
                color: 'hsl(var(--brand-cyan))',
                background: 'hsl(var(--brand-cyan) / 0.1)',
                border: '1px solid hsl(var(--brand-cyan) / 0.3)',
                padding: '2px 7px', letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
                Dashboard
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'hsl(var(--text-faint))', margin: 0 }}>
              Visão geral de todos os clientes e projetos da agência
            </p>
          </div>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              onClick={expandAll}
              title="Expandir todos"
              style={btnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'hsl(var(--brand-cyan))'
                e.currentTarget.style.borderColor = 'hsl(var(--brand-cyan) / 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'hsl(var(--text-muted))'
                e.currentTarget.style.borderColor = 'hsl(var(--border-subtle))'
              }}
            >
              <ChevronsDown size={13} />
              Expandir todos
            </button>
            <button
              onClick={collapseAll}
              title="Recolher todos"
              style={btnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'hsl(var(--brand-cyan))'
                e.currentTarget.style.borderColor = 'hsl(var(--brand-cyan) / 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'hsl(var(--text-muted))'
                e.currentTarget.style.borderColor = 'hsl(var(--border-subtle))'
              }}
            >
              <ChevronsUp size={13} />
              Recolher todos
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          display: 'flex', gap: 0,
          marginTop: 16,
          border: '1px solid hsl(var(--border-subtle))',
          borderRadius: 2,
          overflow: 'hidden',
          background: 'hsl(var(--bg-surface))',
        }}>
          {[
            { label: 'Clientes', value: activeClients.length, color: 'hsl(var(--brand-cyan))' },
            { label: 'Projetos', value: totalProjects, color: 'hsl(var(--brand-amber))' },
            { label: 'Tarefas ativas', value: totalActiveTasks, color: 'hsl(var(--brand-blue))' },
            { label: 'Atrasadas', value: totalOverdue, color: 'hsl(var(--brand-rose))' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                flex: 1, padding: '10px 16px', textAlign: 'center',
                borderLeft: i > 0 ? '1px solid hsl(var(--border-subtle))' : 'none',
              }}
            >
              <div style={{
                fontSize: '22px', fontWeight: 800,
                fontFamily: 'JetBrains Mono, monospace',
                color: stat.color, lineHeight: 1,
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '9px', color: 'hsl(var(--text-faint))',
                textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3,
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client sections */}
      {filteredClients.length === 0 ? (
        <div style={{
          padding: '48px 20px', textAlign: 'center',
          fontSize: 13, color: 'hsl(var(--text-faint))',
        }}>
          {searchQuery
            ? `Nenhum resultado para "${searchQuery}".`
            : 'Nenhum cliente cadastrado.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredClients.map((client) => {
            const clientProjects = state.projects.filter(
              (p) => p.clientId === client.id && !p.isArchived,
            )
            const clientTasks = state.tasks.filter((t) =>
              clientProjects.some((p) => p.id === t.projectId),
            )
            return (
              <GlobalClientSection
                key={client.id}
                clientId={client.id}
                clientName={client.name}
                clientColor={client.color}
                projects={clientProjects}
                tasks={clientTasks}
                isExpanded={getExpanded(client.id)}
                onToggle={() => toggleClient(client.id)}
                onProjectClick={handleProjectClick}
                searchQuery={searchQuery}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
