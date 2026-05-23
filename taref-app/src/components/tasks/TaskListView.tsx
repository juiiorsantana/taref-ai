import { useState, useRef, useEffect } from 'react'
import { ChevronRight, AlertCircle, Plus, Check, Eye, Pencil } from 'lucide-react'
import { useProject } from '../../context/ProjectContext'
import { TaskDetailModal } from '../kanban/KanbanBoard'
import { Modal } from '../ui/Modal'
import { showToast } from '../ui/Toast'
import { generateId, formatDateBR, isOverdue, isDueSoon } from '../../utils/date'
import type { Task, Project, ProjectStatus, SubTask } from '../../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'pausado',      label: 'Pausado' },
  { value: 'concluido',    label: 'Concluído' },
]

const STATUS_COLOR: Record<ProjectStatus, string> = {
  em_andamento: 'hsl(var(--brand-cyan))',
  pausado:      'hsl(var(--brand-amber))',
  concluido:    'hsl(var(--brand-emerald))',
}

const COLOR_OPTIONS = ['#06B6D4', '#1E40AF', '#D97706', '#10B981', '#EF4444', '#F97316']

// ─── EditProjectModal ─────────────────────────────────────────────────────────

export const EditProjectModal = ({ project, onClose }: { project: Project | null; onClose: () => void }) => {
  const { dispatch } = useProject()
  const [form, setForm] = useState({ name: '', description: '', color: '#06B6D4', status: 'em_andamento' as ProjectStatus })

  useEffect(() => {
    if (project) {
      setForm({
        name:        project.name,
        description: project.description ?? '',
        color:       project.color,
        status:      project.status ?? 'em_andamento',
      })
    }
  }, [project])

  if (!project) return null

  const handleSave = () => {
    if (!form.name.trim()) return
    dispatch({ type: 'UPDATE_PROJECT', payload: { ...project, name: form.name.trim(), description: form.description.trim() || undefined, color: form.color, status: form.status } })
    showToast('Projeto atualizado.', 'success')
    onClose()
  }

  const fieldStyle: React.CSSProperties = { width: '100%', background: 'hsl(var(--bg-input))', border: '1px solid hsl(var(--border-subtle))', borderRadius: 'var(--radius-sm)', color: 'hsl(var(--text-primary))', fontSize: '13px', padding: '7px 10px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

  return (
    <Modal isOpen={!!project} onClose={onClose} title="Editar Projeto" size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-faint))', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Nome</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={fieldStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border-active))')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border-subtle))')}
          />
        </div>

        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-faint))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Cor de Acento</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLOR_OPTIONS.map((c) => (
              <button key={c} onClick={() => setForm({ ...form, color: c })} aria-label={`Cor ${c}`} style={{ width: 26, height: 26, borderRadius: 'var(--radius-sm)', background: c, border: `2px solid ${form.color === c ? '#fff' : 'transparent'}`, cursor: 'pointer', flexShrink: 0, transition: 'border-color var(--duration-fast)' }} />
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-faint))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Status</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {PROJECT_STATUSES.map((s) => (
              <button key={s.value} onClick={() => setForm({ ...form, status: s.value })} style={{ flex: 1, padding: '5px 8px', cursor: 'pointer', background: form.status === s.value ? 'hsl(var(--bg-elevated))' : 'hsl(var(--bg-input))', border: `1px solid ${form.status === s.value ? 'hsl(var(--border-active))' : 'hsl(var(--border-subtle))'}`, borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: form.status === s.value ? 600 : 400, color: form.status === s.value ? 'hsl(var(--text-primary))' : 'hsl(var(--text-muted))', transition: 'all var(--duration-fast)' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-faint))', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Descrição</label>
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.5 }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border-active))')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border-subtle))')}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '7px 14px', background: 'none', border: '1px solid hsl(var(--border-subtle))', borderRadius: 'var(--radius-sm)', color: 'hsl(var(--text-muted))', fontSize: '13px', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSave} style={{ padding: '7px 16px', background: 'hsl(var(--brand-cyan))', border: 'none', borderRadius: 'var(--radius-sm)', color: 'hsl(220 25% 6%)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── TaskListView ─────────────────────────────────────────────────────────────

export const TaskListView = () => {
  const { state } = useProject()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const activeClient = state.clients.find((c) => c.id === state.activeClientId)
  const clientProjects = state.projects.filter(
    (p) => p.clientId === state.activeClientId && !p.isArchived,
  )

  // Keep selectedTask in sync with state (e.g. after subtask toggle inside modal)
  const syncedTask = selectedTask
    ? (state.tasks.find((t) => t.id === selectedTask.id) ?? null)
    : null

  return (
    <div data-comp="tlv-container" style={{ padding: '24px 28px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 data-comp="tlv-title" style={{
          fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em',
          color: 'hsl(var(--text-primary))', margin: 0,
        }}>
          Tarefas
        </h2>
        <p data-comp="tlv-subtitle" style={{ fontSize: 12, color: 'hsl(var(--text-faint))', margin: '3px 0 0' }}>
          {activeClient?.name}
        </p>
      </div>

      {clientProjects.length === 0 ? (
        <div style={{
          padding: '40px 0', textAlign: 'center',
          fontSize: 13, color: 'hsl(var(--text-faint))',
        }}>
          Nenhum projeto ativo para este cliente.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clientProjects.map((project) => (
            <ProjectAccordion
              key={project.id}
              project={project}
              tasks={state.tasks.filter((t) => t.projectId === project.id)}
              onOpenTask={setSelectedTask}
              onEditProject={setEditingProject}
            />
          ))}
        </div>
      )}

      <TaskDetailModal task={syncedTask} onClose={() => setSelectedTask(null)} />
      <EditProjectModal project={editingProject} onClose={() => setEditingProject(null)} />
    </div>
  )
}

// ─── ProjectAccordion ─────────────────────────────────────────────────────────

export const ProjectAccordion = ({
  project,
  tasks,
  onOpenTask,
  onEditProject,
}: {
  project: Project
  tasks: Task[]
  onOpenTask: (task: Task) => void
  onEditProject: (project: Project) => void
}) => {
  const { state, dispatch } = useProject()
  const [isExpanded, setIsExpanded] = useState(true)
  const [addingTask, setAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (addingTask) inputRef.current?.focus()
  }, [addingTask])

  const handleAddTask = () => {
    const title = newTaskTitle.trim()
    if (!title) { setAddingTask(false); return }
    const newTask: Task = {
      id: generateId(),
      projectId: project.id,
      title,
      responsible: state.userProfile.name,
      priority: 'media',
      status: 'todo',
      tags: [],
      subtasks: [],
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_TASK', payload: newTask })
    setNewTaskTitle('')
    inputRef.current?.focus()
  }

  const handleStatusChange = (value: string) => {
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: { ...project, status: value as ProjectStatus },
    })
  }

  const currentStatus: ProjectStatus = project.status ?? 'em_andamento'
  const statusColor = STATUS_COLOR[currentStatus]
  const doneCount = tasks.filter((t) => t.status === 'done').length

  return (
    <div data-comp="tlv-section" style={{
      border: '1px solid hsl(var(--border-subtle))',
      borderRadius: 2,
      background: 'hsl(var(--bg-surface))',
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div data-comp="tlv-section-header" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        borderBottom: isExpanded ? '1px solid hsl(var(--border-subtle))' : 'none',
        background: 'hsl(var(--bg-elevated))',
      }}>
        <div style={{
          width: 3, height: 20, borderRadius: 2, flexShrink: 0,
          background: project.color,
        }} />

        <span data-comp="tlv-section-title" style={{
          flex: 1, fontSize: 13, fontWeight: 700,
          letterSpacing: '-0.02em', color: 'hsl(var(--text-primary))',
        }}>
          {project.name}
        </span>

        <button
          onClick={() => onEditProject(project)}
          title="Editar projeto"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-faint))', display: 'flex', alignItems: 'center', padding: 2, flexShrink: 0, transition: 'color var(--duration-fast)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--brand-cyan))')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--text-faint))')}
        >
          <Pencil size={12} />
        </button>

        <span style={{
          fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
          color: 'hsl(var(--text-faint))',
        }}>
          {doneCount}/{tasks.length}
        </span>

        <select
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
            textTransform: 'uppercase', color: statusColor,
            background: 'transparent',
            border: `1px solid ${statusColor}55`,
            borderRadius: 2, padding: '2px 6px',
            cursor: 'pointer', appearance: 'none',
          }}
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'hsl(var(--text-faint))',
            display: 'flex', alignItems: 'center', padding: 2,
            transition: 'transform var(--duration-base) var(--ease-out)',
            transform: isExpanded ? 'rotate(90deg)' : 'none',
          }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* ── Task list ── */}
      <div data-comp="tlv-tasks" style={{
        maxHeight: isExpanded ? 9999 : 0,
        overflow: 'hidden',
        transition: 'max-height var(--duration-slow) var(--ease-out)',
      }}>
        <div style={{ padding: '4px 0' }}>
          {tasks.length === 0 && !addingTask && (
            <div style={{
              padding: '10px 16px', fontSize: 12,
              color: 'hsl(var(--text-faint))',
            }}>
              Nenhuma tarefa ainda.
            </div>
          )}

          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onOpen={onOpenTask} />
          ))}

          {/* Inline add */}
          {addingTask ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px 8px',
            }}>
              <div style={{
                width: 15, height: 15, flexShrink: 0,
                border: '1px solid hsl(var(--border-subtle))',
                borderRadius: 2,
              }} />
              <input
                ref={inputRef}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask()
                  if (e.key === 'Escape') { setAddingTask(false); setNewTaskTitle('') }
                }}
                onBlur={() => { if (!newTaskTitle.trim()) setAddingTask(false) }}
                placeholder="Nome da tarefa..."
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontSize: 13, color: 'hsl(var(--text-primary))', fontFamily: 'inherit',
                }}
              />
              <span style={{ fontSize: 10, color: 'hsl(var(--text-faint))', whiteSpace: 'nowrap' }}>
                ↵ confirmar · esc cancelar
              </span>
            </div>
          ) : (
            <button
              data-comp="tlv-add"
              onClick={() => setAddingTask(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', background: 'none', border: 'none',
                cursor: 'pointer', color: 'hsl(var(--text-faint))',
                fontSize: 12, textAlign: 'left',
                transition: 'color var(--duration-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--brand-cyan))')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--text-faint))')}
            >
              <Plus size={12} />
              Adicionar tarefa...
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────

const TaskRow = ({ task, onOpen }: { task: Task; onOpen: (task: Task) => void }) => {
  const { dispatch } = useProject()
  const [subtasksOpen, setSubtasksOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  const isHighPriority = task.priority === 'alta'
  const isDone = task.status === 'done'
  const overdue = isOverdue(task.deadline) && !isDone
  const dueSoon = isDueSoon(task.deadline) && !isDone

  const handleToggle = () => {
    dispatch({
      type: 'MOVE_TASK',
      payload: { taskId: task.id, targetStatus: isDone ? 'todo' : 'done' },
    })
  }

  const priorityDotColor =
    task.priority === 'alta'  ? 'hsl(var(--brand-rose))' :
    task.priority === 'media' ? 'hsl(var(--brand-amber))' :
                                'hsl(var(--text-faint))'

  const deadlineColor =
    overdue  ? 'hsl(var(--brand-rose))' :
    dueSoon  ? 'hsl(var(--brand-amber))' :
               'hsl(var(--text-faint))'

  return (
    <div>
      <div
        data-comp="tlv-row"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '7px 14px',
          borderLeft: isHighPriority && !isDone
            ? '2px solid hsl(var(--brand-cyan))'
            : '2px solid transparent',
          background: hovered ? 'hsl(var(--bg-elevated))' : 'transparent',
          transition: 'background var(--duration-fast)',
        }}
      >
        {/* Checkbox */}
        <button
          data-comp="tlv-check"
          data-done={isDone ? 'true' : 'false'}
          onClick={handleToggle}
          style={{
            width: 15, height: 15, flexShrink: 0,
            border: isDone ? 'none' : '1px solid hsl(var(--border-subtle))',
            borderRadius: 2, cursor: 'pointer', padding: 0,
            background: isDone ? 'hsl(var(--brand-cyan))' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all var(--duration-fast)',
          }}
        >
          {isDone && <Check size={10} color="#fff" strokeWidth={3} />}
        </button>

        {/* High priority icon */}
        {isHighPriority && !isDone && (
          <AlertCircle size={13} color="hsl(var(--brand-cyan))" style={{ flexShrink: 0 }} />
        )}

        {/* Title + eye */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span data-comp="tlv-title-text" style={{
            fontSize: 13,
            fontWeight: isHighPriority && !isDone ? 500 : 400,
            color: isDone ? 'hsl(var(--text-faint))' : 'hsl(var(--text-primary))',
            textDecoration: isDone ? 'line-through' : 'none',
            letterSpacing: '-0.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {task.title}
          </span>
          <button
            onClick={() => onOpen(task)}
            title="Ver detalhes"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'hsl(var(--text-faint))',
              display: 'flex', alignItems: 'center', padding: 0,
              flexShrink: 0,
              opacity: hovered ? 1 : 0,
              transition: 'opacity var(--duration-fast), color var(--duration-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--brand-cyan))')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--text-faint))')}
          >
            <Eye size={13} />
          </button>
        </div>

        {/* Metadata — subtle, brightens on hover */}
        <div data-comp="tlv-meta" style={{
          display: 'flex', alignItems: 'center', gap: 7,
          opacity: hovered ? 1 : 0.3,
          transition: 'opacity var(--duration-base)',
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
            background: priorityDotColor,
          }} />

          {task.deadline && (
            <span style={{
              fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
              color: deadlineColor,
            }}>
              {formatDateBR(task.deadline)}
            </span>
          )}

          <div style={{
            width: 18, height: 18, borderRadius: 2, flexShrink: 0,
            background: 'hsl(var(--bg-elevated))',
            border: '1px solid hsl(var(--border-subtle))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 800,
            fontFamily: 'JetBrains Mono, monospace',
            color: 'hsl(var(--text-muted))',
          }}>
            {task.responsible.slice(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Subtasks expand toggle */}
        {task.subtasks.length > 0 && (
          <button
            onClick={() => setSubtasksOpen(!subtasksOpen)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'hsl(var(--text-faint))',
              display: 'flex', alignItems: 'center', padding: 2,
              transition: 'transform var(--duration-fast)',
              transform: subtasksOpen ? 'rotate(90deg)' : 'none',
              flexShrink: 0,
            }}
          >
            <ChevronRight size={12} />
          </button>
        )}
      </div>

      {/* Subtasks */}
      {task.subtasks.length > 0 && subtasksOpen && (
        <div>
          {task.subtasks.map((sub, idx) => (
            <SubtaskRow
              key={sub.id}
              taskId={task.id}
              subtask={sub}
              isLast={idx === task.subtasks.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SubtaskRow ───────────────────────────────────────────────────────────────

const SubtaskRow = ({
  taskId,
  subtask,
  isLast,
}: {
  taskId: string
  subtask: SubTask
  isLast: boolean
}) => {
  const { dispatch } = useProject()
  const [hovered, setHovered] = useState(false)

  return (
    <div
      data-comp="tlv-sub"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '5px 14px 5px 40px',
        position: 'relative',
        background: hovered ? 'hsl(var(--bg-elevated))' : 'transparent',
        transition: 'background var(--duration-fast)',
      }}
    >
      {/* Vertical dashed tree line */}
      <div style={{
        position: 'absolute', left: 27, top: 0,
        bottom: isLast ? '50%' : 0,
        borderLeft: '1px dashed hsl(var(--border-subtle))',
        pointerEvents: 'none',
      }} />
      {/* Horizontal dashed tree connector */}
      <div style={{
        position: 'absolute', left: 27, top: '50%',
        width: 8,
        borderTop: '1px dashed hsl(var(--border-subtle))',
        pointerEvents: 'none',
      }} />

      {/* Checkbox */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_SUBTASK', payload: { taskId, subtaskId: subtask.id } })}
        style={{
          width: 13, height: 13, flexShrink: 0,
          border: subtask.completed ? 'none' : '1px solid hsl(var(--border-subtle))',
          borderRadius: 2, cursor: 'pointer', padding: 0,
          background: subtask.completed ? 'hsl(var(--brand-emerald))' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all var(--duration-fast)',
        }}
      >
        {subtask.completed && <Check size={9} color="#fff" strokeWidth={3} />}
      </button>

      <span style={{
        fontSize: 12, flex: 1,
        color: subtask.completed ? 'hsl(var(--text-faint))' : 'hsl(var(--text-muted))',
        textDecoration: subtask.completed ? 'line-through' : 'none',
      }}>
        {subtask.title}
      </span>
    </div>
  )
}
