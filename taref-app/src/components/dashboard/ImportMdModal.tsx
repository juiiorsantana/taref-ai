import { useState, useCallback, useRef } from 'react'
import { Upload, X, FileText, CheckCircle, AlertCircle, FolderKanban, ListTodo, Tag, User, Calendar, ChevronDown, ChevronUp, Loader } from 'lucide-react'
import { useProject } from '../../context/ProjectContext'
import { showToast } from '../ui/Toast'
import { parseMarkdownImport, buildProjectAndTasks } from '../../utils/markdownImport'
import type { ParsedImport } from '../../utils/markdownImport'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TAG_COLOR: Record<string, string> = {
  ads: 'hsl(var(--brand-amber))',
  design: 'hsl(var(--brand-cyan))',
  copy: 'hsl(var(--brand-rose))',
  dev: '#A78BFA',
  seo: '#34D399',
}

const PRIORITY_COLOR: Record<string, string> = {
  alta: 'hsl(var(--brand-rose))',
  media: 'hsl(var(--brand-amber))',
  baixa: '#34D399',
}

const STATUS_LABEL: Record<string, string> = {
  em_andamento: 'Em andamento',
  pausado: 'Pausado',
  concluido: 'Concluído',
  todo: 'A fazer',
  doing: 'Em progresso',
  done: 'Concluído',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'upload' | 'preview' | 'creating' | 'done'

interface ImportMdModalProps {
  isOpen: boolean
  onClose: () => void
}

// ─── Task Preview Row ─────────────────────────────────────────────────────────

const TaskPreviewRow = ({ task, index }: { task: ParsedImport['tasks'][number]; index: number }) => {
  const [expanded, setExpanded] = useState(false)
  const hasSubtasks = task.subtasks.length > 0

  return (
    <div style={{
      border: '1px solid hsl(var(--border-subtle))',
      background: 'hsl(var(--bg-elevated))',
      marginBottom: 6,
    }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          cursor: hasSubtasks ? 'pointer' : 'default',
        }}
        onClick={() => hasSubtasks && setExpanded(!expanded)}
      >
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '10px',
          color: 'hsl(var(--text-faint))', flexShrink: 0, width: 18,
        }}>
          {String(index + 1).padStart(2, '0')}
        </span>

        <ListTodo size={13} style={{ color: 'hsl(var(--text-faint))', flexShrink: 0 }} />

        <span style={{
          fontSize: '13px', fontWeight: 600, flex: 1, color: 'hsl(var(--text-primary))',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.title}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {task.responsible && task.responsible !== 'A definir' && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: '10px', color: 'hsl(var(--text-muted))',
            }}>
              <User size={10} />
              {task.responsible}
            </span>
          )}

          {task.deadline && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: '10px', color: 'hsl(var(--text-muted))',
            }}>
              <Calendar size={10} />
              {task.deadline}
            </span>
          )}

          <span style={{
            fontSize: '9px', fontWeight: 700, padding: '2px 7px',
            background: `${PRIORITY_COLOR[task.priority] || '#888'}22`,
            color: PRIORITY_COLOR[task.priority] || '#888',
            border: `1px solid ${PRIORITY_COLOR[task.priority] || '#888'}44`,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {task.priority}
          </span>

          {task.tags.map((tag) => (
            <span key={tag} style={{
              fontSize: '9px', fontWeight: 700, padding: '2px 6px',
              background: `${TAG_COLOR[tag] || '#888'}18`,
              color: TAG_COLOR[tag] || '#888',
              border: `1px solid ${TAG_COLOR[tag] || '#888'}33`,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {tag}
            </span>
          ))}

          {hasSubtasks && (
            expanded
              ? <ChevronUp size={12} style={{ color: 'hsl(var(--text-faint))' }} />
              : <ChevronDown size={12} style={{ color: 'hsl(var(--text-faint))' }} />
          )}
        </div>
      </div>

      {expanded && task.subtasks.length > 0 && (
        <div style={{
          borderTop: '1px solid hsl(var(--border-subtle))',
          padding: '8px 14px 10px 42px',
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          {task.subtasks.map((sub) => (
            <div key={sub.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: '12px', color: 'hsl(var(--text-muted))',
            }}>
              <div style={{
                width: 12, height: 12, border: '1px solid hsl(var(--border-subtle))',
                background: sub.completed ? 'hsl(var(--brand-cyan))' : 'transparent',
                flexShrink: 0,
              }} />
              {sub.title}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

export const ImportMdModal = ({ isOpen, onClose }: ImportMdModalProps) => {
  const { state, dispatch } = useProject()
  const [step, setStep] = useState<Step>('upload')
  const [parsed, setParsed] = useState<ParsedImport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClose = useCallback(() => {
    setStep('upload')
    setParsed(null)
    setError(null)
    setFileName(null)
    setIsDragging(false)
    onClose()
  }, [onClose])

  const processFile = useCallback((file: File) => {
    if (!file.name.match(/\.(md|mdx)$/i)) {
      setError('Formato inválido. Use arquivos .md ou .mdx')
      return
    }
    setFileName(file.name)
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const result = parseMarkdownImport(content)
        setParsed(result)
        setStep('preview')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao processar o arquivo')
      }
    }
    reader.readAsText(file, 'utf-8')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  if (!isOpen) return null

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleConfirm = async () => {
    if (!parsed || !state.activeClientId || state.activeClientId === 'global') return

    setStep('creating')

    try {
      const { project, tasks } = buildProjectAndTasks(parsed, state.activeClientId)

      dispatch({ type: 'ADD_PROJECT', payload: project })

      for (const task of tasks) {
        dispatch({ type: 'ADD_TASK', payload: task })
      }

      setStep('done')
      showToast(
        `Projeto "${project.name}" criado com ${tasks.length} tarefa${tasks.length !== 1 ? 's' : ''}`,
        'success',
      )
    } catch {
      setStep('preview')
      showToast('Erro ao criar projeto. Tente novamente.', 'error')
    }
  }

  const activeClient = state.clients.find((c) => c.id === state.activeClientId)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: step === 'preview' ? 680 : 480,
        maxHeight: '90vh',
        background: 'hsl(var(--bg-surface))',
        border: '2px solid hsl(var(--border-subtle))',
        boxShadow: '8px 8px 0 hsl(var(--border-subtle))',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px 14px',
          borderBottom: '1px solid hsl(var(--border-subtle))',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32,
              background: 'hsl(var(--brand-amber) / 0.1)',
              border: '1px solid hsl(var(--brand-amber) / 0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Upload size={14} color="hsl(var(--brand-amber))" />
            </div>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                Importar via Markdown
              </h2>
              <p style={{ fontSize: '11px', color: 'hsl(var(--text-faint))', margin: 0 }}>
                {step === 'upload' && 'Faça upload de um arquivo .md ou .mdx'}
                {step === 'preview' && `${parsed?.tasks.length ?? 0} tarefa${(parsed?.tasks.length ?? 0) !== 1 ? 's' : ''} detectada${(parsed?.tasks.length ?? 0) !== 1 ? 's' : ''} — confirme para criar`}
                {step === 'creating' && 'Criando projeto e tarefas...'}
                {step === 'done' && 'Importação concluída com sucesso'}
              </p>
            </div>
          </div>

          {step !== 'creating' && (
            <button
              onClick={handleClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-faint))', display: 'flex' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* STEP: UPLOAD */}
          {step === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {activeClient && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px',
                  background: 'hsl(var(--bg-elevated))',
                  border: '1px solid hsl(var(--border-subtle))',
                  fontSize: '12px', color: 'hsl(var(--text-muted))',
                }}>
                  <div style={{
                    width: 8, height: 8, background: activeClient.color, flexShrink: 0,
                  }} />
                  Projeto será criado no cliente: <strong style={{ color: 'hsl(var(--text-primary))' }}>{activeClient.name}</strong>
                </div>
              )}

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? 'hsl(var(--brand-amber))' : error ? 'hsl(var(--brand-rose))' : 'hsl(var(--border-subtle))'}`,
                  background: isDragging ? 'hsl(var(--brand-amber) / 0.04)' : 'hsl(var(--bg-elevated))',
                  padding: '48px 32px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 12, cursor: 'pointer', textAlign: 'center',
                  transition: 'border-color 0.15s, background 0.15s',
                  boxShadow: isDragging ? '6px 6px 0 hsl(var(--brand-amber) / 0.25)' : 'none',
                }}
              >
                <div style={{
                  width: 48, height: 48,
                  border: `2px dashed ${isDragging ? 'hsl(var(--brand-amber))' : 'hsl(var(--border-subtle))'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isDragging ? 'hsl(var(--brand-amber))' : 'hsl(var(--text-faint))',
                  transition: 'border-color 0.15s, color 0.15s',
                }}>
                  <FileText size={22} />
                </div>

                {fileName ? (
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-primary))', margin: '0 0 4px' }}>
                      {fileName}
                    </p>
                    <p style={{ fontSize: '11px', color: 'hsl(var(--text-faint))', margin: 0 }}>
                      Clique para selecionar outro arquivo
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-primary))', margin: '0 0 4px' }}>
                      Arraste o arquivo aqui
                    </p>
                    <p style={{ fontSize: '11px', color: 'hsl(var(--text-faint))', margin: 0 }}>
                      ou clique para selecionar um arquivo .md ou .mdx
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.mdx"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '10px 14px',
                  background: 'hsl(var(--brand-rose) / 0.08)',
                  border: '1px solid hsl(var(--brand-rose) / 0.3)',
                  color: 'hsl(var(--brand-rose))',
                  fontSize: '12px', lineHeight: 1.5,
                }}>
                  <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                  {error}
                </div>
              )}

              {/* Format hint */}
              <div style={{
                padding: '12px 14px',
                background: 'hsl(var(--bg-elevated))',
                border: '1px solid hsl(var(--border-subtle))',
                fontSize: '11px', color: 'hsl(var(--text-faint))', lineHeight: 1.7,
              }}>
                <p style={{ margin: '0 0 6px', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Formato esperado
                </p>
                <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', whiteSpace: 'pre', display: 'block', color: 'hsl(var(--text-muted))' }}>
{`---
project: Nome do Projeto
color: "#06B6D4"
status: em_andamento
description: Descrição opcional
---

## Tarefa: Título da tarefa
- responsible: Nome
- deadline: 2026-06-15
- priority: alta
- tags: design, dev
- notes: Observações

### Subtarefas
- [ ] Subtarefa 1`}
                </code>
              </div>
            </div>
          )}

          {/* STEP: PREVIEW */}
          {step === 'preview' && parsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Project info card */}
              <div style={{
                border: '2px solid hsl(var(--border-subtle))',
                background: 'hsl(var(--bg-elevated))',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: 4,
                  background: parsed.project.color || 'hsl(var(--brand-cyan))',
                }} />
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, flexShrink: 0,
                    background: `${parsed.project.color || 'hsl(var(--brand-cyan))'}18`,
                    border: `1px solid ${parsed.project.color || 'hsl(var(--brand-cyan))'}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FolderKanban size={18} style={{ color: parsed.project.color || 'hsl(var(--brand-cyan))' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.025em', color: 'hsl(var(--text-primary))' }}>
                        {parsed.project.name}
                      </span>
                      <span style={{
                        fontSize: '9px', fontWeight: 700, padding: '2px 7px',
                        background: 'hsl(var(--brand-cyan) / 0.1)',
                        border: '1px solid hsl(var(--brand-cyan) / 0.3)',
                        color: 'hsl(var(--brand-cyan))',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}>
                        {STATUS_LABEL[parsed.project.status ?? 'em_andamento']}
                      </span>
                    </div>
                    {parsed.project.description && (
                      <p style={{ fontSize: '11px', color: 'hsl(var(--text-faint))', margin: 0 }}>
                        {parsed.project.description}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: '22px', fontWeight: 800,
                      fontFamily: 'JetBrains Mono, monospace',
                      color: 'hsl(var(--text-primary))', lineHeight: 1,
                    }}>
                      {parsed.tasks.length}
                    </div>
                    <div style={{ fontSize: '9px', color: 'hsl(var(--text-faint))', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      tarefa{parsed.tasks.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Task list */}
              {parsed.tasks.length > 0 && (
                <div>
                  <p style={{
                    fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'hsl(var(--text-faint))', margin: '0 0 8px 0',
                  }}>
                    Tarefas a criar
                  </p>
                  {parsed.tasks.map((task, i) => (
                    <TaskPreviewRow key={i} task={task} index={i} />
                  ))}
                </div>
              )}

              {parsed.tasks.length === 0 && (
                <div style={{
                  padding: '20px', textAlign: 'center',
                  background: 'hsl(var(--bg-elevated))',
                  border: '1px solid hsl(var(--border-subtle))',
                  fontSize: '12px', color: 'hsl(var(--text-faint))',
                }}>
                  Nenhuma tarefa encontrada no arquivo. O projeto será criado sem tarefas.
                </div>
              )}

              {/* Target client info */}
              {activeClient && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px',
                  background: 'hsl(var(--bg-elevated))',
                  border: '1px solid hsl(var(--border-subtle))',
                  fontSize: '11px', color: 'hsl(var(--text-muted))',
                }}>
                  <div style={{ width: 8, height: 8, background: activeClient.color }} />
                  Destino: <strong style={{ color: 'hsl(var(--text-primary))' }}>{activeClient.name}</strong>
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Tag size={10} />
                    {parsed.tasks.reduce((a, t) => a + t.subtasks.length, 0)} subtarefa{parsed.tasks.reduce((a, t) => a + t.subtasks.length, 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP: CREATING */}
          {step === 'creating' && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 16, padding: '48px 0',
            }}>
              <Loader size={32} style={{
                color: 'hsl(var(--brand-cyan))',
                animation: 'spin 1s linear infinite',
              }} />
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', margin: 0 }}>
                Criando projeto e tarefas...
              </p>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* STEP: DONE */}
          {step === 'done' && parsed && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 16, padding: '48px 0', textAlign: 'center',
            }}>
              <CheckCircle size={40} style={{ color: '#34D399' }} />
              <div>
                <p style={{ fontSize: '16px', fontWeight: 800, color: 'hsl(var(--text-primary))', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                  Importação concluída!
                </p>
                <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', margin: 0 }}>
                  Projeto <strong>"{parsed.project.name}"</strong> criado com{' '}
                  <strong>{parsed.tasks.length}</strong> tarefa{parsed.tasks.length !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {step !== 'creating' && (
          <div style={{
            display: 'flex', gap: 10, padding: '14px 24px 18px',
            borderTop: '1px solid hsl(var(--border-subtle))',
            justifyContent: 'flex-end', flexShrink: 0,
          }}>
            {step === 'done' ? (
              <button
                onClick={handleClose}
                style={{
                  padding: '8px 24px',
                  background: 'hsl(var(--brand-cyan))',
                  border: '2px solid hsl(var(--text-primary))',
                  boxShadow: '3px 3px 0 hsl(var(--text-primary))',
                  color: 'hsl(220 25% 6%)', fontSize: '12px', fontWeight: 800,
                  cursor: 'pointer', textTransform: 'uppercase',
                  letterSpacing: '0.08em', fontFamily: 'inherit',
                }}
              >
                Fechar
              </button>
            ) : (
              <>
                <button
                  onClick={step === 'preview' ? () => { setStep('upload'); setParsed(null) } : handleClose}
                  style={{
                    padding: '8px 16px', background: 'none',
                    border: '1px solid hsl(var(--border-subtle))',
                    color: 'hsl(var(--text-muted))', fontSize: '12px', cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {step === 'preview' ? 'Voltar' : 'Cancelar'}
                </button>

                {step === 'preview' && (
                  <button
                    onClick={handleConfirm}
                    style={{
                      padding: '8px 24px',
                      background: 'hsl(var(--brand-amber))',
                      border: '2px solid hsl(var(--text-primary))',
                      boxShadow: '3px 3px 0 hsl(var(--text-primary))',
                      color: 'hsl(220 25% 6%)', fontSize: '12px', fontWeight: 800,
                      cursor: 'pointer', textTransform: 'uppercase',
                      letterSpacing: '0.08em', fontFamily: 'inherit',
                    }}
                  >
                    Criar Projeto + {parsed?.tasks.length ?? 0} Tarefa{(parsed?.tasks.length ?? 0) !== 1 ? 's' : ''}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
