import { useState, useEffect } from 'react'
import { useProject } from '../../context/ProjectContext'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { showToast } from '../ui/Toast'
import { generateId } from '../../utils/date'
import type { Project } from '../../types'
import { Archive, Trash2, ExternalLink, FolderKanban } from 'lucide-react'

// ─── Project Card ─────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project
  taskCount: number
  doneCount: number
  overdueCount: number
  onClick: () => void
}

export const ProjectCard = ({ project, taskCount, doneCount, overdueCount, onClick }: ProjectCardProps) => {
  const { dispatch } = useProject()
  const progress = taskCount === 0 ? 0 : Math.round((doneCount / taskCount) * 100)
  const accentColor = project.color || '#06B6D4'

  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="card interactive glow-cyan"
      style={{
        padding: '16px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        animationDelay: '0ms',
      }}
    >
      {/* Accent stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 2,
        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}40)`,
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36,
          background: `${accentColor}15`,
          border: `1px solid ${accentColor}30`,
          borderRadius: 'var(--radius-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <FolderKanban size={18} style={{ color: accentColor }} />
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {overdueCount > 0 && (
            <span
              className="overdue-blink"
              style={{
                background: 'hsl(var(--brand-rose) / 0.12)',
                border: '1px solid hsl(var(--brand-rose) / 0.35)',
                color: 'hsl(var(--brand-rose))',
                fontSize: '10px', fontWeight: 700,
                padding: '1px 6px', borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              ⚠ {overdueCount}
            </span>
          )}
        </div>
      </div>

      {/* Project name */}
      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 8, letterSpacing: '-0.01em' }}>
        {project.name}
      </h3>

      {/* Description */}
      {project.description && (
        <p style={{
          fontSize: '12px', color: 'hsl(var(--text-muted))',
          marginBottom: 12, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {project.description}
        </p>
      )}

      {/* Progress */}
      <div style={{ marginBottom: 10 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5,
        }}>
          <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
            {doneCount}/{taskCount} tarefas
          </span>
          <span style={{
            fontSize: '11px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
            color: accentColor,
          }}>
            {progress}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%`, background: accentColor }}
          />
        </div>
      </div>

      {/* Footer actions */}
      <div
        style={{ display: 'flex', gap: 4, marginTop: 8 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id={`open-kanban-${project.id}`}
          onClick={onClick}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: `${accentColor}12`, border: `1px solid ${accentColor}25`,
            borderRadius: 'var(--radius-sm)', color: accentColor,
            fontSize: '11px', fontWeight: 600, padding: '5px 8px', cursor: 'pointer',
            transition: 'all var(--duration-fast)',
          }}
        >
          <ExternalLink size={11} />
          Abrir Board
        </button>
        <IconBtn
          label="Arquivar"
          onClick={() => {
            dispatch({ type: 'ARCHIVE_PROJECT', payload: project.id })
            showToast(`"${project.name}" arquivado.`, 'info')
          }}
          icon={<Archive size={11} />}
        />
        <IconBtn
          label="Excluir"
          onClick={() => {
            if (window.confirm(`Excluir "${project.name}" e todas as suas tarefas?`)) {
              dispatch({ type: 'DELETE_PROJECT', payload: project.id })
              showToast(`"${project.name}" excluído.`, 'error')
            }
          }}
          icon={<Trash2 size={11} />}
          danger
        />
      </div>
    </article>
  )
}

// ─── Add Project Modal ────────────────────────────────────────────────────────

interface AddProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

const COLOR_OPTIONS = ['#06B6D4', '#1E40AF', '#D97706', '#10B981', '#EF4444', '#F97316']

export const AddProjectModal = ({ isOpen, onClose }: AddProjectModalProps) => {
  const { state, dispatch } = useProject()
  const [form, setForm] = useState({ name: '', color: '#06B6D4', description: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      setForm({ name: '', color: '#06B6D4', description: '' })
      setErrors({})
    }
  }, [isOpen])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nome do projeto é obrigatório'
    if (!state.activeClientId) e.name = 'Nenhum cliente selecionado'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const project: Project = {
      id: generateId(),
      clientId: state.activeClientId!,
      name: form.name.trim(),
      color: form.color,
      description: form.description.trim() || undefined,
      isArchived: false,
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_PROJECT', payload: project })
    showToast(`Projeto "${project.name}" criado!`, 'success')
    setForm({ name: '', color: '#06B6D4', description: '' })
    setErrors({})
    onClose()
  }

  const activeClient = state.clients.find((c) => c.id === state.activeClientId)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Projeto" size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {activeClient && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'hsl(var(--text-muted))' }}>
              Cliente
            </span>
            <div style={{
              background: 'hsl(var(--bg-elevated))',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: 'var(--radius-sm)',
              color: 'hsl(var(--text-primary))',
              fontSize: '13px',
              padding: '8px 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>{activeClient.name}</span>
              <span style={{ fontSize: '10px', color: 'hsl(var(--text-faint))', letterSpacing: '0.05em' }}>
                FIXO
              </span>
            </div>
          </div>
        )}

        <Input
          id="project-name"
          label="Nome do Projeto *"
          placeholder="ex: Landing Page Implantes"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
        />

        {/* Color picker */}
        <div>
          <p style={{ fontSize: '12px', fontWeight: 500, color: 'hsl(var(--text-muted))', marginBottom: 6 }}>Cor de Acento</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setForm({ ...form, color: c })}
                aria-label={`Cor ${c}`}
                style={{
                  width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                  background: c, border: `2px solid ${form.color === c ? '#fff' : 'transparent'}`,
                  cursor: 'pointer', flexShrink: 0,
                  transition: 'border-color var(--duration-fast)',
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="proj-desc"
            style={{ fontSize: '12px', fontWeight: 500, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: 6 }}
          >
            Descrição (opcional)
          </label>
          <textarea
            id="proj-desc"
            rows={3}
            placeholder="Notas gerais sobre o projeto..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{
              width: '100%', background: 'hsl(var(--bg-input))',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: 'var(--radius-sm)',
              color: 'hsl(var(--text-primary))', fontSize: '13px',
              padding: '8px 10px', outline: 'none', resize: 'vertical',
              fontFamily: 'inherit', lineHeight: 1.5,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border-active))')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border-subtle))')}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 14px', background: 'none',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: 'var(--radius-sm)',
              color: 'hsl(var(--text-muted))', fontSize: '13px', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            id="submit-project"
            onClick={handleSubmit}
            style={{
              padding: '7px 16px',
              background: 'hsl(var(--brand-cyan))',
              border: 'none', borderRadius: 'var(--radius-sm)',
              color: 'hsl(220 25% 6%)', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              transition: 'opacity var(--duration-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Criar Projeto
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Project Grid ─────────────────────────────────────────────────────────────

interface ProjectGridProps {
  searchQuery: string
  onAddProject: () => void
}

export const ProjectGrid = ({ searchQuery, onAddProject }: ProjectGridProps) => {
  const { state, dispatch } = useProject()

  const filtered = state.projects.filter((p) => {
    if (p.isArchived) return false
    if (p.clientId !== state.activeClientId) return false
    const q = searchQuery.toLowerCase()
    return p.name.toLowerCase().includes(q) || (p.description?.toLowerCase().includes(q) ?? false)
  })

  const getTaskStats = (projectId: string) => {
    const tasks = state.tasks.filter((t) => t.projectId === projectId)
    const done = tasks.filter((t) => t.status === 'done').length
    const overdue = tasks.filter((t) => {
      if (!t.deadline || t.status === 'done') return false
      return new Date(t.deadline) < new Date()
    }).length
    return { total: tasks.length, done, overdue }
  }

  if (filtered.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 12, padding: '80px 20px',
        color: 'hsl(var(--text-faint))',
      }}>
        <div style={{ fontSize: 40 }}>💼</div>
        <div style={{ fontSize: '14px', fontWeight: 500 }}>
          {searchQuery ? 'Nenhum projeto encontrado' : 'Nenhum projeto ativo'}
        </div>
        {!searchQuery && (
          <button
            onClick={onAddProject}
            style={{
              marginTop: 4,
              background: 'hsl(var(--brand-cyan))',
              border: 'none', borderRadius: 'var(--radius-sm)',
              color: 'hsl(220 25% 6%)', fontSize: '12px', fontWeight: 700,
              padding: '7px 16px', cursor: 'pointer',
            }}
          >
            + Criar primeiro projeto
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 12,
      padding: '20px',
    }}>
      {filtered.map((project, i) => {
        const { total, done, overdue } = getTaskStats(project.id)
        return (
          <div key={project.id} className="anim-fade-slide" style={{ animationDelay: `${i * 40}ms` }}>
            <ProjectCard
              project={project}
              taskCount={total}
              doneCount={done}
              overdueCount={overdue}
              onClick={() => dispatch({ type: 'SET_ACTIVE_PROJECT', payload: project.id })}
            />
          </div>
        )
      })}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IconBtn = ({
  icon, label, onClick, danger,
}: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
  <button
    title={label}
    aria-label={label}
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 28, height: 28,
      background: 'hsl(var(--bg-elevated))',
      border: '1px solid hsl(var(--border-subtle))',
      borderRadius: 'var(--radius-sm)',
      color: danger ? 'hsl(var(--brand-rose))' : 'hsl(var(--text-muted))',
      cursor: 'pointer', transition: 'all var(--duration-fast)',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.borderColor = danger ? 'hsl(var(--brand-rose) / 0.5)' : 'hsl(var(--border-active))')}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border-subtle))')}
  >
    {icon}
  </button>
)
