import type { Client, Project, Task, BackupData, UserProfile } from '../types'

// ─── Export Backup ────────────────────────────────────────────────────────────

export const exportBackup = (clients: Client[], projects: Project[], tasks: Task[], userProfile?: UserProfile): void => {
  const data: BackupData = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    clients,
    projects,
    tasks,
    userProfile,
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')

  const formattedDate = new Date().toISOString().split('T')[0]
  a.href = url
  a.download = `taref_ai_backup_${formattedDate}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Validate and Import ──────────────────────────────────────────────────────

export const validateAndImport = (jsonString: string): { clients: Client[]; projects: Project[]; tasks: Task[]; userProfile?: UserProfile } => {
  const data = JSON.parse(jsonString) as BackupData

  if (data.version !== '2.0') {
    throw new Error('Versão de backup incompatível.')
  }

  if (!Array.isArray(data.clients) || !Array.isArray(data.projects) || !Array.isArray(data.tasks)) {
    throw new Error('Formato de dados corrompido.')
  }

  data.clients.forEach((c) => {
    if (!c.id || !c.name) {
      throw new Error('Cliente inválido detectado.')
    }
  })

  data.projects.forEach((p) => {
    if (!p.id || !p.name || !p.clientId) {
      throw new Error('Projeto inválido detectado.')
    }
  })

  data.tasks.forEach((t) => {
    if (!t.id || !t.projectId || !t.title || !t.status) {
      throw new Error('Tarefa inválida detectada.')
    }
  })

  return { clients: data.clients, projects: data.projects, tasks: data.tasks, userProfile: data.userProfile }
}
