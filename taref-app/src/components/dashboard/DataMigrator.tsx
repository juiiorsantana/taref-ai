import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { showToast } from '../ui/Toast'
import { Database, X } from 'lucide-react'

const LS_PROJECTS = 'taref_projects'
const LS_TASKS = 'taref_tasks'
const LS_MIGRATION_DONE = 'taref_migration_done'

interface LegacyData {
  projectCount: number
  taskCount: number
}

const readLegacyData = (): LegacyData | null => {
  try {
    if (localStorage.getItem(LS_MIGRATION_DONE)) return null
    const rawProjects = localStorage.getItem(LS_PROJECTS)
    const rawTasks = localStorage.getItem(LS_TASKS)
    if (!rawProjects) return null
    const projects = JSON.parse(rawProjects) as unknown[]
    const tasks = rawTasks ? (JSON.parse(rawTasks) as unknown[]) : []
    if (projects.length === 0) return null
    return { projectCount: projects.length, taskCount: tasks.length }
  } catch {
    return null
  }
}

export const DataMigrator = () => {
  const { user } = useAuth()
  const [legacyData, setLegacyData] = useState<LegacyData | null>(null)

  useEffect(() => {
    if (!user) return
    const data = readLegacyData()
    setLegacyData(data)
  }, [user])

  if (!legacyData) return null

  const handleDismissLegacy = () => {
    localStorage.removeItem(LS_PROJECTS)
    localStorage.removeItem(LS_TASKS)
    localStorage.setItem(LS_MIGRATION_DONE, '1')
    setLegacyData(null)
    showToast('Dados antigos removidos. Crie seus clientes no novo portal.', 'info')
  }

  const handleSkip = () => {
    localStorage.setItem(LS_MIGRATION_DONE, '1')
    setLegacyData(null)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 8888,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(6px)',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 460,
        background: 'hsl(var(--bg-surface))',
        border: '2px solid hsl(var(--brand-cyan) / 0.5)',
        boxShadow: '8px 8px 0 hsl(var(--brand-cyan) / 0.2)',
        padding: 32,
        position: 'relative',
      }}>
        {/* Close */}
        <button
          onClick={handleSkip}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'none', border: 'none',
            color: 'hsl(var(--text-faint))', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 4,
          }}
          title="Ignorar"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div style={{
          width: 52, height: 52,
          background: 'hsl(var(--brand-cyan) / 0.1)',
          border: '2px solid hsl(var(--brand-cyan) / 0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Database size={24} color="hsl(var(--brand-cyan))" />
        </div>

        {/* Content */}
        <h2 style={{
          fontSize: '18px', fontWeight: 900,
          letterSpacing: '-0.03em', textTransform: 'uppercase',
          marginBottom: 10,
        }}>
          Dados Antigos Detectados
        </h2>
        <p style={{
          fontSize: '13px', color: 'hsl(var(--text-muted))',
          lineHeight: 1.65, marginBottom: 20,
        }}>
          Encontramos{' '}
          <strong style={{ color: 'hsl(var(--brand-cyan))' }}>
            {legacyData?.projectCount ?? 0} projetos
          </strong>{' '}
          no formato antigo (sem clientes). O sistema foi atualizado — crie seus{' '}
          <strong>clientes</strong> no novo portal e recrie os projetos dentro deles.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleDismissLegacy}
            style={{
              flex: 1, padding: '10px 16px',
              background: 'hsl(var(--brand-cyan))',
              border: '2px solid hsl(var(--text-primary))',
              boxShadow: '4px 4px 0 hsl(var(--text-primary))',
              color: 'hsl(220 25% 6%)',
              fontSize: '12px', fontWeight: 800,
              cursor: 'pointer', textTransform: 'uppercase',
              letterSpacing: '0.08em', fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            Entendido, remover dados antigos
          </button>
        </div>
      </div>
    </div>
  )
}
