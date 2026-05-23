import { useState, useRef, useEffect, useMemo } from 'react'
import { useProject } from '../../context/ProjectContext'
import { PriorityBadge, TagBadge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { showToast } from '../ui/Toast'
import { generateId, formatDateBR, isOverdue, isDueSoon } from '../../utils/date'
import type { Task, TaskStatus, PriorityLevel, TaskTag } from '../../types'
import { Plus, Calendar, CheckSquare, Square, Trash2, GripVertical, Pencil, X, Check as CheckIcon } from 'lucide-react'

// ─── Task Card ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task
  onDragStart: (e: React.DragEvent, taskId: string) => void
  onDragEnd:   (e: React.DragEvent) => void
  onClick: (task: Task) => void
  contextLabel?: string
}

const TaskCard = ({ task, onDragStart, onDragEnd, onClick, contextLabel }: TaskCardProps) => {
  const overdue = isOverdue(task.deadline)
  const dueSoon = isDueSoon(task.deadline)
  const completedSubs = task.subtasks.filter((s) => s.completed).length

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(task)}
      role="button"
      tabIndex={0}
      aria-label={`Tarefa: ${task.title}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick(task)}
      className="card interactive"
      style={{
        padding: '12px',
        cursor: 'grab',
        userSelect: 'none',
        opacity: task.status === 'done' ? 0.65 : 1,
        position: 'relative',
      }}
    >
      {/* Drag handle */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        color: 'hsl(var(--text-faint))', opacity: 0.4,
      }}>
        <GripVertical size={12} />
      </div>

      {/* Priority + Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        <PriorityBadge priority={task.priority} />
        {task.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
      </div>

      {/* Title */}
      <p style={{
        fontSize: '13px', fontWeight: 500, lineHeight: 1.4, marginBottom: 8,
        textDecoration: task.status === 'done' ? 'line-through' : 'none',
        color: task.status === 'done' ? 'hsl(var(--text-faint))' : 'hsl(var(--text-primary))',
      }}>
        {task.title}
      </p>

      {/* Subtask progress */}
      {task.subtasks.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div className="progress-bar" style={{ flex: 1, height: '2px' }}>
            <div
              className="progress-fill"
              style={{
                width: `${(completedSubs / task.subtasks.length) * 100}%`,
                background: 'hsl(var(--brand-emerald))',
              }}
            />
          </div>
          <span style={{ fontSize: '10px', color: 'hsl(var(--text-faint))', fontFamily: 'JetBrains Mono, monospace' }}>
            {completedSubs}/{task.subtasks.length}
          </span>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          className={overdue ? 'overdue-blink' : undefined}
          style={{
            fontSize: '11px', fontWeight: 500,
            color: overdue
              ? 'hsl(var(--brand-rose))'
              : dueSoon
                ? 'hsl(var(--brand-amber))'
                : 'hsl(var(--text-faint))',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {task.deadline && (
            <>
              <Calendar size={10} />
              {formatDateBR(task.deadline)}
              {overdue && ' ⚠'}
            </>
          )}
        </div>
        <span style={{ fontSize: '11px', color: 'hsl(var(--text-faint))' }}>
          {task.responsible}
        </span>
      </div>

      {/* Context label (shown in global mode) */}
      {contextLabel && (
        <div style={{
          marginTop: 6,
          fontSize: '10px',
          color: 'hsl(var(--text-faint))',
          fontFamily: 'JetBrains Mono, monospace',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          borderTop: '1px solid hsl(var(--border-subtle))',
          paddingTop: 5,
        }}>
          {contextLabel}
        </div>
      )}
    </div>
  )
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  status: TaskStatus
  label: string
  tasks: Task[]
  accentColor: string
  draggingId: string | null
  onDrop: (e: React.DragEvent, status: TaskStatus) => void
  onDragStart: (e: React.DragEvent, taskId: string) => void
  onDragEnd: (e: React.DragEvent) => void
  onAddTask?: () => void
  onTaskClick: (task: Task) => void
  contextLabels?: Map<string, string>
}

const KanbanColumn = ({
  status, label, tasks, accentColor,
  draggingId, onDrop, onDragStart, onDragEnd, onAddTask, onTaskClick, contextLabels,
}: KanbanColumnProps) => {
  const [isOver, setIsOver] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={ref}
      style={{
        flex: '1 1 0', minWidth: 260, maxWidth: 380,
        display: 'flex', flexDirection: 'column', gap: 0,
        height: '100%',
      }}
      onDragOver={(e) => { e.preventDefault(); setIsOver(true) }}
      onDragLeave={(e) => { if (!ref.current?.contains(e.relatedTarget as Node)) setIsOver(false) }}
      onDrop={(e) => { setIsOver(false); onDrop(e, status) }}
    >
      {/* Column header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 0 10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 14, background: accentColor, borderRadius: 2 }} />
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {label}
          </span>
          <span style={{
            fontSize: '10px', fontWeight: 600,
            background: `${accentColor}18`, color: accentColor,
            padding: '1px 6px', borderRadius: 'var(--radius-sm)',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {tasks.length}
          </span>
        </div>
        {status === 'todo' && onAddTask && (
          <button
            id={`add-task-${status}`}
            onClick={onAddTask}
            title="Adicionar tarefa"
            aria-label="Adicionar tarefa"
            style={{
              width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'hsl(var(--bg-elevated))',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: 'var(--radius-sm)',
              color: 'hsl(var(--text-muted))', cursor: 'pointer',
              transition: 'all var(--duration-fast)',
            }}
          >
            <Plus size={12} />
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        style={{
          flex: 1,
          background: isOver ? 'hsl(var(--bg-elevated))' : 'hsl(var(--bg-surface))',
          border: `1px solid ${isOver ? `${accentColor}60` : 'hsl(var(--border-subtle))'}`,
          borderRadius: 'var(--radius-md)',
          padding: 8,
          minHeight: 200,
          display: 'flex', flexDirection: 'column', gap: 8,
          transition: 'all var(--duration-fast)',
          boxShadow: isOver ? `inset 0 0 0 1px ${accentColor}30` : 'none',
          overflowY: 'auto',
        }}
      >
        {tasks.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'hsl(var(--text-faint))', fontSize: '12px',
            border: '1px dashed hsl(var(--border-subtle))',
            borderRadius: 'var(--radius-sm)', margin: 4, padding: 16, textAlign: 'center',
          }}>
            Arraste tarefas aqui
          </div>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className={draggingId === task.id ? 'drag-active' : ''}
            style={{ transition: 'all var(--duration-fast)' }}
          >
            <TaskCard
              task={task}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onClick={onTaskClick}
              contextLabel={contextLabels?.get(task.id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Add Task Modal ───────────────────────────────────────────────────────────

interface AddTaskModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

const PRIORITY_OPTIONS: PriorityLevel[] = ['alta', 'media', 'baixa']
const TAG_OPTIONS: TaskTag[] = ['ads', 'design', 'copy', 'dev', 'seo']

const AddTaskModal = ({ isOpen, onClose, projectId }: AddTaskModalProps) => {
  const { dispatch } = useProject()
  const [form, setForm] = useState({
    title: '', responsible: 'Junior', deadline: '',
    priority: 'alta' as PriorityLevel, tags: [] as TaskTag[], notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Título é obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const toggleTag = (tag: TaskTag) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }))
  }

  const handleSubmit = () => {
    if (!validate()) return
    const task: Task = {
      id: generateId(),
      projectId,
      title: form.title.trim(),
      responsible: form.responsible || 'Junior',
      deadline: form.deadline || undefined,
      priority: form.priority,
      notes: form.notes.trim() || undefined,
      status: 'todo',
      tags: form.tags,
      subtasks: [],
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_TASK', payload: task })
    showToast(`Tarefa "${task.title}" criada!`, 'success')
    setForm({ title: '', responsible: 'Junior', deadline: '', priority: 'alta', tags: [], notes: '' })
    setErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Tarefa" size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          id="task-title"
          label="Título *"
          placeholder="ex: Criar copy da landing page"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          error={errors.title}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input
            id="task-responsible"
            label="Responsável"
            placeholder="Junior"
            value={form.responsible}
            onChange={(e) => setForm({ ...form, responsible: e.target.value })}
          />
          <Input
            id="task-deadline"
            label="Prazo"
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
        </div>

        {/* Priority */}
        <div>
          <p style={{ fontSize: '12px', fontWeight: 500, color: 'hsl(var(--text-muted))', marginBottom: 6 }}>Prioridade</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => setForm({ ...form, priority: p })}
                style={{
                  flex: 1, padding: '6px 8px', cursor: 'pointer',
                  background: form.priority === p ? 'hsl(var(--bg-elevated))' : 'hsl(var(--bg-input))',
                  border: `1px solid ${form.priority === p ? 'hsl(var(--border-active))' : 'hsl(var(--border-subtle))'}`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px', fontWeight: form.priority === p ? 600 : 400,
                  color: form.priority === p ? 'hsl(var(--text-primary))' : 'hsl(var(--text-muted))',
                  textTransform: 'capitalize',
                  transition: 'all var(--duration-fast)',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <p style={{ fontSize: '12px', fontWeight: 500, color: 'hsl(var(--text-muted))', marginBottom: 6 }}>Tags</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  padding: '4px 10px', cursor: 'pointer',
                  background: form.tags.includes(tag) ? 'hsl(var(--brand-cyan) / 0.12)' : 'hsl(var(--bg-input))',
                  border: `1px solid ${form.tags.includes(tag) ? 'hsl(var(--brand-cyan) / 0.4)' : 'hsl(var(--border-subtle))'}`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px', fontWeight: 500,
                  color: form.tags.includes(tag) ? 'hsl(var(--brand-cyan))' : 'hsl(var(--text-muted))',
                  transition: 'all var(--duration-fast)', textTransform: 'uppercase', letterSpacing: '0.04em',
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '7px 14px', background: 'none', border: '1px solid hsl(var(--border-subtle))', borderRadius: 'var(--radius-sm)', color: 'hsl(var(--text-muted))', fontSize: '13px', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            id="submit-task"
            onClick={handleSubmit}
            style={{ padding: '7px 16px', background: 'hsl(var(--brand-cyan))', border: 'none', borderRadius: 'var(--radius-sm)', color: 'hsl(220 25% 6%)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          >
            Criar Tarefa
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Task Detail Modal ────────────────────────────────────────────────────────

export const TaskDetailModal = ({ task, onClose }: { task: Task | null; onClose: () => void }) => {
  const { dispatch } = useProject()
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ title: '', responsible: '', deadline: '', priority: 'media' as PriorityLevel, tags: [] as TaskTag[], notes: '' })
  const [editingSubId, setEditingSubId] = useState<string | null>(null)
  const [editingSubTitle, setEditingSubTitle] = useState('')
  const [confirmDeleteSubId, setConfirmDeleteSubId] = useState<string | null>(null)
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [newSubTitle, setNewSubTitle] = useState('')
  const newSubInputRef = useRef<HTMLInputElement>(null)

  // Reset states when modal closes
  useEffect(() => {
    if (!task) { setEditMode(false); setAddingSubtask(false); setNewSubTitle('') }
  }, [task])

  useEffect(() => {
    if (addingSubtask) newSubInputRef.current?.focus()
  }, [addingSubtask])

  if (!task) return null

  const enterEdit = () => {
    setForm({ title: task.title, responsible: task.responsible, deadline: task.deadline ?? '', priority: task.priority, tags: [...task.tags], notes: task.notes ?? '' })
    setEditMode(true)
  }

  const saveEdit = () => {
    if (!form.title.trim()) return
    dispatch({ type: 'UPDATE_TASK', payload: { ...task, title: form.title.trim(), responsible: form.responsible || task.responsible, deadline: form.deadline || undefined, priority: form.priority, tags: form.tags, notes: form.notes.trim() || undefined } })
    showToast('Tarefa atualizada.', 'success')
    setEditMode(false)
  }

  const toggleTag = (tag: TaskTag) =>
    setForm((f) => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag] }))

  const confirmAddSubtask = () => {
    const title = newSubTitle.trim()
    if (title) {
      dispatch({ type: 'UPDATE_TASK', payload: { ...task, subtasks: [...task.subtasks, { id: generateId(), title, completed: false }] } })
    }
    setNewSubTitle('')
    setAddingSubtask(false)
  }

  const saveSubRename = (subId: string) => {
    const title = editingSubTitle.trim()
    if (title) dispatch({ type: 'UPDATE_TASK', payload: { ...task, subtasks: task.subtasks.map((s) => s.id === subId ? { ...s, title } : s) } })
    setEditingSubId(null)
  }

  const deleteTask = () => {
    if (!window.confirm(`Excluir a tarefa "${task.title}"?`)) return
    dispatch({ type: 'DELETE_TASK', payload: task.id })
    showToast('Tarefa excluída.', 'error')
    onClose()
  }

  const fieldStyle: React.CSSProperties = { width: '100%', background: 'hsl(var(--bg-input))', border: '1px solid hsl(var(--border-subtle))', borderRadius: 'var(--radius-sm)', color: 'hsl(var(--text-primary))', fontSize: '13px', padding: '7px 10px', outline: 'none', fontFamily: 'inherit' }

  const editToggle = editMode ? (
    <button onClick={() => setEditMode(false)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid hsl(var(--border-subtle))', borderRadius: 'var(--radius-sm)', color: 'hsl(var(--text-muted))', fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }}>
      <X size={11} /> Cancelar
    </button>
  ) : (
    <button onClick={enterEdit} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid hsl(var(--border-subtle))', borderRadius: 'var(--radius-sm)', color: 'hsl(var(--text-muted))', fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }}>
      <Pencil size={11} /> Editar
    </button>
  )

  return (
    <Modal isOpen={!!task} onClose={() => { setEditMode(false); onClose() }} title={task.title} size="md" headerActions={editToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {editMode ? (
          /* ── Edit form ── */
          <>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-faint))', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Título</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={fieldStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border-active))')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border-subtle))')}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-faint))', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Responsável</label>
                <input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} style={fieldStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border-active))')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border-subtle))')}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-faint))', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Prazo</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} style={fieldStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border-active))')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border-subtle))')}
                />
              </div>
            </div>

            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-faint))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Prioridade</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['alta', 'media', 'baixa'] as PriorityLevel[]).map((p) => (
                  <button key={p} onClick={() => setForm({ ...form, priority: p })} style={{ flex: 1, padding: '5px 8px', cursor: 'pointer', background: form.priority === p ? 'hsl(var(--bg-elevated))' : 'hsl(var(--bg-input))', border: `1px solid ${form.priority === p ? 'hsl(var(--border-active))' : 'hsl(var(--border-subtle))'}`, borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: form.priority === p ? 600 : 400, color: form.priority === p ? 'hsl(var(--text-primary))' : 'hsl(var(--text-muted))', textTransform: 'capitalize', transition: 'all var(--duration-fast)' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-faint))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Tags</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(['ads', 'design', 'copy', 'dev', 'seo'] as TaskTag[]).map((tag) => (
                  <button key={tag} onClick={() => toggleTag(tag)} style={{ padding: '3px 10px', cursor: 'pointer', background: form.tags.includes(tag) ? 'hsl(var(--brand-cyan) / 0.12)' : 'hsl(var(--bg-input))', border: `1px solid ${form.tags.includes(tag) ? 'hsl(var(--brand-cyan) / 0.4)' : 'hsl(var(--border-subtle))'}`, borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 500, color: form.tags.includes(tag) ? 'hsl(var(--brand-cyan))' : 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.04em', transition: 'all var(--duration-fast)' }}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-faint))', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Notas</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.5 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border-active))')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border-subtle))')}
              />
            </div>
          </>
        ) : (
          /* ── View mode ── */
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <PriorityBadge priority={task.priority} />
              {task.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
            </div>

            {task.deadline && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: isOverdue(task.deadline) ? 'hsl(var(--brand-rose))' : 'hsl(var(--text-muted))' }}>
                <Calendar size={12} />
                Prazo: {formatDateBR(task.deadline)}
                {isOverdue(task.deadline) && ' — ATRASADO ⚠'}
              </div>
            )}

            {task.responsible && (
              <div style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
                Responsável: <strong style={{ color: 'hsl(var(--text-primary))' }}>{task.responsible}</strong>
              </div>
            )}

            {task.notes && (
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-faint))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Notas</p>
                <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', lineHeight: 1.6 }}>{task.notes}</p>
              </div>
            )}
          </>
        )}

        {/* ── Subtasks (always visible) ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-faint))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Subtarefas ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
            </p>
            {!addingSubtask && (
              <button onClick={() => setAddingSubtask(true)} style={{ background: 'none', border: 'none', color: 'hsl(var(--brand-cyan))', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={12} /> Adicionar
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {task.subtasks.map((sub) => (
              <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_SUBTASK', payload: { taskId: task.id, subtaskId: sub.id } })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub.completed ? 'hsl(var(--brand-emerald))' : 'hsl(var(--text-faint))', flexShrink: 0 }}
                >
                  {sub.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                </button>

                {editingSubId === sub.id ? (
                  <input
                    autoFocus
                    value={editingSubTitle}
                    onChange={(e) => setEditingSubTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveSubRename(sub.id); if (e.key === 'Escape') setEditingSubId(null) }}
                    onBlur={() => saveSubRename(sub.id)}
                    style={{ flex: 1, background: 'hsl(var(--bg-input))', border: '1px solid hsl(var(--border-active))', borderRadius: 'var(--radius-sm)', color: 'hsl(var(--text-primary))', fontSize: '13px', padding: '2px 6px', outline: 'none', fontFamily: 'inherit' }}
                  />
                ) : (
                  <>
                    <span style={{ fontSize: '13px', textDecoration: sub.completed ? 'line-through' : 'none', color: sub.completed ? 'hsl(var(--text-faint))' : 'hsl(var(--text-primary))', flex: 1 }}>
                      {sub.title}
                    </span>
                    <button
                      onClick={() => { setEditingSubId(sub.id); setEditingSubTitle(sub.title) }}
                      title="Renomear"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-faint))', display: 'flex', alignItems: 'center', padding: 2, opacity: 0.5, transition: 'opacity var(--duration-fast)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                    >
                      <Pencil size={11} />
                    </button>
                    {confirmDeleteSubId === sub.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          onClick={() => {
                            dispatch({ type: 'UPDATE_TASK', payload: { ...task, subtasks: task.subtasks.filter((s) => s.id !== sub.id) } })
                            setConfirmDeleteSubId(null)
                          }}
                          style={{ fontSize: '10px', fontWeight: 600, padding: '1px 7px', background: 'hsl(var(--brand-rose) / 0.12)', border: '1px solid hsl(var(--brand-rose) / 0.4)', borderRadius: 'var(--radius-sm)', color: 'hsl(var(--brand-rose))', cursor: 'pointer' }}
                        >
                          Excluir
                        </button>
                        <button
                          onClick={() => setConfirmDeleteSubId(null)}
                          style={{ fontSize: '10px', padding: '1px 7px', background: 'none', border: '1px solid hsl(var(--border-subtle))', borderRadius: 'var(--radius-sm)', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteSubId(sub.id)}
                        title="Excluir subtarefa"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--brand-rose))', display: 'flex', alignItems: 'center', padding: 2, opacity: 0.5, transition: 'opacity var(--duration-fast)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
            {task.subtasks.length === 0 && !addingSubtask && (
              <span style={{ fontSize: '12px', color: 'hsl(var(--text-faint))' }}>Nenhuma subtarefa</span>
            )}

            {addingSubtask && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 14, height: 14, flexShrink: 0, border: '1px solid hsl(var(--border-subtle))', borderRadius: 2 }} />
                <input
                  ref={newSubInputRef}
                  value={newSubTitle}
                  onChange={(e) => setNewSubTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmAddSubtask()
                    if (e.key === 'Escape') { setAddingSubtask(false); setNewSubTitle('') }
                  }}
                  onBlur={() => { if (!newSubTitle.trim()) setAddingSubtask(false) }}
                  placeholder="Nome da subtarefa..."
                  style={{ flex: 1, background: 'none', border: 'none', borderBottom: '1px solid hsl(var(--border-active))', outline: 'none', fontSize: '13px', color: 'hsl(var(--text-primary))', fontFamily: 'inherit', padding: '2px 0' }}
                />
                <span style={{ fontSize: '10px', color: 'hsl(var(--text-faint))', whiteSpace: 'nowrap' }}>↵ salvar</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        {editMode && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid hsl(var(--border-subtle))' }}>
            <button onClick={deleteTask} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid hsl(var(--brand-rose) / 0.3)', borderRadius: 'var(--radius-sm)', color: 'hsl(var(--brand-rose))', fontSize: '12px', padding: '5px 10px', cursor: 'pointer' }}>
              <Trash2 size={12} /> Excluir tarefa
            </button>
            <button onClick={saveEdit} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'hsl(var(--brand-cyan))', border: 'none', borderRadius: 'var(--radius-sm)', color: 'hsl(220 25% 6%)', fontSize: '12px', fontWeight: 700, padding: '5px 14px', cursor: 'pointer' }}>
              <CheckIcon size={12} /> Salvar
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'todo',  label: 'A Fazer',      color: 'hsl(var(--brand-amber))' },
  { status: 'doing', label: 'Em Andamento', color: 'hsl(var(--brand-cyan))' },
  { status: 'done',  label: 'Concluído',    color: 'hsl(var(--brand-emerald))' },
]

export const KanbanBoard = () => {
  const { state, dispatch } = useProject()
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const isGlobalMode = state.activeClientId === 'global'
  const activeProject = state.projects.find((p) => p.id === state.activeProjectId)

  const clientProjectIds = state.projects
    .filter((p) => p.clientId === state.activeClientId && !p.isArchived)
    .map((p) => p.id)

  const projectTasks = isGlobalMode
    ? state.tasks
    : activeProject
      ? state.tasks.filter((t) => t.projectId === activeProject.id)
      : state.tasks.filter((t) => clientProjectIds.includes(t.projectId))

  const contextLabels = useMemo(() => {
    if (!isGlobalMode) return undefined
    const map = new Map<string, string>()
    state.tasks.forEach((t) => {
      const project = state.projects.find((p) => p.id === t.projectId)
      const client = state.clients.find((c) => c.id === project?.clientId)
      if (project && client) map.set(t.id, `${client.name} / ${project.name}`)
    })
    return map
  }, [isGlobalMode, state.tasks, state.projects, state.clients])

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(taskId)
  }

  const handleDragEnd = () => setDraggingId(null)

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    if (!taskId) return
    dispatch({ type: 'MOVE_TASK', payload: { taskId, targetStatus } })
    setDraggingId(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Board filters bar */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid hsl(var(--border-subtle))',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <span style={{ fontSize: '11px', color: 'hsl(var(--text-faint))' }}>
          {projectTasks.length} tarefas no total
          {' · '}
          {projectTasks.filter((t) => t.status === 'done').length} concluídas
        </span>
        {activeProject && (
          <div style={{ marginLeft: 'auto' }}>
            <button
              id="add-task-btn"
              onClick={() => setShowAddTask(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'hsl(var(--brand-cyan))', border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: 'hsl(220 25% 6%)', fontSize: '12px', fontWeight: 700,
                padding: '6px 12px', cursor: 'pointer',
                transition: 'opacity var(--duration-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <Plus size={13} />
              Nova Tarefa
            </button>
          </div>
        )}
      </div>

      {/* Columns */}
      <div style={{
        flex: 1, display: 'flex', gap: 12,
        padding: 20, overflowX: 'auto', overflowY: 'hidden',
        alignItems: 'stretch',
        minHeight: 0,
      }}>
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            accentColor={col.color}
            tasks={projectTasks.filter((t) => t.status === col.status)}
            draggingId={draggingId}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onAddTask={activeProject ? () => setShowAddTask(true) : undefined}
            onTaskClick={setSelectedTask}
            contextLabels={contextLabels}
          />
        ))}
      </div>

      {activeProject && (
        <AddTaskModal
          isOpen={showAddTask}
          onClose={() => setShowAddTask(false)}
          projectId={activeProject.id}
        />
      )}
      <TaskDetailModal
        task={selectedTask ? (state.tasks.find((t) => t.id === selectedTask.id) ?? null) : null}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  )
}
