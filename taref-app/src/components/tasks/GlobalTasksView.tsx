import { useState, useMemo } from 'react'
import { ChevronDown, Globe, ChevronsDown, ChevronsUp } from 'lucide-react'
import { useProject } from '../../context/ProjectContext'
import { TaskDetailModal } from '../kanban/KanbanBoard'
import { ProjectAccordion, EditProjectModal } from './TaskListView'
import type { Task, Project } from '../../types'

// ─── Client Section (Notion-style flat header) ────────────────────────────────

interface ClientSectionProps {
  clientId: string
  clientName: string
  clientColor: string
  projects: Project[]
  tasks: Task[]
  isExpanded: boolean
  onToggle: () => void
  onOpenTask: (task: Task) => void
  onEditProject: (project: Project) => void
  searchQuery: string
}

const ClientSection = ({
  clientName,
  clientColor,
  projects,
  tasks,
  isExpanded,
  onToggle,
  onOpenTask,
  onEditProject,
  searchQuery,
}: ClientSectionProps) => {
  const [headerHovered, setHeaderHovered] = useState(false)

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects
    const q = searchQuery.toLowerCase()
    return projects.filter((p) => {
      const projectMatches = p.name.toLowerCase().includes(q) || (p.description?.toLowerCase().includes(q) ?? false)
      const projectTaskMatches = tasks
        .filter((t) => t.projectId === p.id)
        .some((t) => t.title.toLowerCase().includes(q))
      return projectMatches || projectTaskMatches
    })
  }, [projects, tasks, searchQuery])

  const initials = clientName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div style={{ marginBottom: 32 }}>

      {/* ── Notion-style client header ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 6px',
          marginBottom: 8,
          cursor: 'pointer',
          userSelect: 'none',
          borderRadius: 4,
          background: headerHovered ? 'hsl(var(--bg-elevated))' : 'transparent',
          transition: 'background var(--duration-fast)',
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, flexShrink: 0,
          background: clientColor,
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 800, letterSpacing: '0.02em',
          fontFamily: 'JetBrains Mono, monospace',
          color: '#fff',
        }}>
          {initials}
        </div>

        {/* Client name + counts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{
            fontSize: '16px', fontWeight: 700, letterSpacing: '-0.03em',
            color: 'hsl(var(--text-primary))',
            whiteSpace: 'nowrap', lineHeight: 1.2,
          }}>
            {clientName}
          </span>
          <span style={{
            fontSize: '11px',
            fontFamily: 'JetBrains Mono, monospace',
            color: 'hsl(var(--text-faint))',
            whiteSpace: 'nowrap',
          }}>
            {projects.length} {projects.length === 1 ? 'projeto' : 'projetos'} · {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
          </span>
        </div>

        {/* Separator line */}
        <div style={{
          flex: 1,
          height: 1,
          background: 'hsl(var(--border-subtle))',
          opacity: headerHovered ? 1 : 0.6,
          transition: 'opacity var(--duration-fast)',
        }} />

        {/* Chevron */}
        <ChevronDown
          size={13}
          style={{
            color: 'hsl(var(--text-faint))',
            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform var(--duration-base) var(--ease-out)',
            flexShrink: 0,
            opacity: headerHovered ? 1 : 0.5,
          }}
        />
      </div>

      {/* ── Projects ── */}
      <div style={{
        maxHeight: isExpanded ? 9999 : 0,
        overflow: 'hidden',
        transition: 'max-height var(--duration-slow) var(--ease-out)',
      }}>
        {filteredProjects.length === 0 ? (
          <div style={{
            padding: '8px 4px',
            fontSize: 12,
            color: 'hsl(var(--text-faint))',
            fontStyle: 'italic',
          }}>
            {searchQuery
              ? `Nenhum projeto ou tarefa encontrado para "${searchQuery}".`
              : 'Nenhum projeto ativo.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredProjects.map((project) => (
              <ProjectAccordion
                key={project.id}
                project={project}
                tasks={tasks.filter((t) => t.projectId === project.id)}
                onOpenTask={onOpenTask}
                onEditProject={onEditProject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── GlobalTasksView ──────────────────────────────────────────────────────────

interface GlobalTasksViewProps {
  searchQuery: string
}

export const GlobalTasksView = ({ searchQuery }: GlobalTasksViewProps) => {
  const { state } = useProject()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({})

  // All non-archived clients, sorted alphabetically
  const activeClients = useMemo(
    () => state.clients.filter((c) => !c.isArchived).sort((a, b) => a.name.localeCompare(b.name)),
    [state.clients],
  )

  // Initialise all clients as expanded on first render
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

  // Keep selectedTask in sync with state (e.g. after subtask toggle inside modal)
  const syncedTask = selectedTask
    ? (state.tasks.find((t) => t.id === selectedTask.id) ?? null)
    : null

  // Filter clients by search (show client if any project/task matches)
  const filteredClients = useMemo(() => {
    if (!searchQuery) return activeClients
    const q = searchQuery.toLowerCase()
    return activeClients.filter((client) => {
      if (client.name.toLowerCase().includes(q)) return true
      const clientProjects = state.projects.filter((p) => p.clientId === client.id && !p.isArchived)
      return clientProjects.some((p) => {
        if (p.name.toLowerCase().includes(q)) return true
        return state.tasks
          .filter((t) => t.projectId === p.id)
          .some((t) => t.title.toLowerCase().includes(q))
      })
    })
  }, [activeClients, searchQuery, state.projects, state.tasks])

  // Global summary numbers
  const totalProjects = state.projects.filter((p) => !p.isArchived).length

  return (
    <div style={{ padding: '28px 32px', maxWidth: 860, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, hsl(var(--brand-cyan)), hsl(var(--brand-blue)))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 2,
          }}>
            <Globe size={14} color="#fff" />
          </div>
          <h2 style={{
            fontSize: 25, fontWeight: 700, letterSpacing: '-0.03em',
            color: 'hsl(var(--text-primary))', margin: 0,
          }}>
            Tarefas
          </h2>
          <span style={{
            fontSize: '12px', fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace',
            color: 'hsl(var(--text-faint))',
            padding: '2px 0', letterSpacing: '0.08em',
          }}>
            {filteredClients.length} clientes · {totalProjects} projetos
          </span>
        </div>

        {/* Expand / Collapse */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={expandAll}
            title="Expandir todos"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', background: 'none',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: 2, color: 'hsl(var(--text-faint))',
              fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all var(--duration-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'hsl(var(--brand-cyan))'
              e.currentTarget.style.borderColor = 'hsl(var(--brand-cyan) / 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'hsl(var(--text-faint))'
              e.currentTarget.style.borderColor = 'hsl(var(--border-subtle))'
            }}
          >
            <ChevronsDown size={12} />
            Expandir
          </button>
          <button
            onClick={collapseAll}
            title="Recolher todos"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', background: 'none',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: 2, color: 'hsl(var(--text-faint))',
              fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all var(--duration-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'hsl(var(--brand-cyan))'
              e.currentTarget.style.borderColor = 'hsl(var(--brand-cyan) / 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'hsl(var(--text-faint))'
              e.currentTarget.style.borderColor = 'hsl(var(--border-subtle))'
            }}
          >
            <ChevronsUp size={12} />
            Recolher
          </button>
        </div>
      </div>

      {/* ── Client sections ── */}
      {filteredClients.length === 0 ? (
        <div style={{
          padding: '48px 20px', textAlign: 'center',
          fontSize: 12, color: 'hsl(var(--text-faint))',
        }}>
          {searchQuery
            ? `Nenhum resultado para "${searchQuery}".`
            : 'Nenhum cliente cadastrado.'}
        </div>
      ) : (
        <div>
          {filteredClients.map((client) => {
            const clientProjects = state.projects.filter(
              (p) => p.clientId === client.id && !p.isArchived,
            )
            const clientTasks = state.tasks.filter((t) =>
              clientProjects.some((p) => p.id === t.projectId),
            )
            return (
              <ClientSection
                key={client.id}
                clientId={client.id}
                clientName={client.name}
                clientColor={client.color}
                projects={clientProjects}
                tasks={clientTasks}
                isExpanded={getExpanded(client.id)}
                onToggle={() => toggleClient(client.id)}
                onOpenTask={setSelectedTask}
                onEditProject={setEditingProject}
                searchQuery={searchQuery}
              />
            )
          })}
        </div>
      )}

      <TaskDetailModal task={syncedTask} onClose={() => setSelectedTask(null)} />
      <EditProjectModal project={editingProject} onClose={() => setEditingProject(null)} />
    </div>
  )
}
