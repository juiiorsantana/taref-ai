import type { Project, Task, TaskTag, PriorityLevel, TaskStatus, ProjectStatus } from '../types'
import { generateId } from './date'

export interface ParsedImport {
  project: Omit<Project, 'id' | 'clientId' | 'createdAt' | 'isArchived'>
  tasks: Omit<Task, 'id' | 'projectId' | 'createdAt'>[]
}

const VALID_TAGS = new Set<string>(['ads', 'design', 'copy', 'dev', 'seo'])
const VALID_PRIORITY = new Set<string>(['baixa', 'media', 'alta'])
const VALID_STATUS_TASK = new Set<string>(['todo', 'doing', 'done'])
const VALID_STATUS_PROJECT = new Set<string>(['em_andamento', 'pausado', 'concluido'])

function parseFrontmatter(raw: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of raw.split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    if (key) result[key] = value
  }
  return result
}

function parseTaskBlock(block: string): Omit<Task, 'id' | 'projectId' | 'createdAt'> | null {
  const lines = block.trim().split('\n')
  const titleLine = lines[0]?.trim()
  if (!titleLine) return null

  const title = titleLine.replace(/^##\s*Tarefa:\s*/i, '').trim()
  if (!title) return null

  const task: Omit<Task, 'id' | 'projectId' | 'createdAt'> = {
    title,
    responsible: 'A definir',
    priority: 'media',
    status: 'todo',
    tags: [],
    subtasks: [],
  }

  let inSubtasks = false

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()

    if (/^###\s*Subtarefas/i.test(line)) {
      inSubtasks = true
      continue
    }

    if (inSubtasks) {
      const subtaskMatch = line.match(/^-\s*\[(x| )\]\s*(.+)/i)
      if (subtaskMatch) {
        task.subtasks.push({
          id: generateId(),
          title: subtaskMatch[2].trim(),
          completed: subtaskMatch[1].toLowerCase() === 'x',
        })
      }
      continue
    }

    const kvMatch = line.match(/^-\s*(\w+):\s*(.+)/)
    if (!kvMatch) continue
    const key = kvMatch[1].toLowerCase()
    const value = kvMatch[2].trim()

    switch (key) {
      case 'responsible':
        task.responsible = value
        break
      case 'deadline':
        task.deadline = value
        break
      case 'priority':
        if (VALID_PRIORITY.has(value)) task.priority = value as PriorityLevel
        break
      case 'status':
        if (VALID_STATUS_TASK.has(value)) task.status = value as TaskStatus
        break
      case 'notes':
        task.notes = value
        break
      case 'tags':
        task.tags = value
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter((t): t is TaskTag => VALID_TAGS.has(t))
        break
    }
  }

  return task
}

export function parseMarkdownImport(content: string): ParsedImport {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!fmMatch) {
    throw new Error('Arquivo inválido: frontmatter (---) não encontrado. Verifique o formato do arquivo.')
  }

  const fm = parseFrontmatter(fmMatch[1])
  const body = fmMatch[2]

  if (!fm.project?.trim()) {
    throw new Error('Campo "project" é obrigatório no frontmatter.')
  }

  const project: Omit<Project, 'id' | 'clientId' | 'createdAt' | 'isArchived'> = {
    name: fm.project.trim(),
    color: fm.color?.trim() || '#06B6D4',
    description: fm.description?.trim() || undefined,
    status: VALID_STATUS_PROJECT.has(fm.status) ? (fm.status as ProjectStatus) : 'em_andamento',
  }

  const taskBlocks = body.split(/(?=^##\s*Tarefa:)/im).filter((b) => b.trim())
  const tasks = taskBlocks
    .map(parseTaskBlock)
    .filter((t): t is Omit<Task, 'id' | 'projectId' | 'createdAt'> => t !== null)

  return { project, tasks }
}

export function buildProjectAndTasks(
  parsed: ParsedImport,
  clientId: string,
): { project: Project; tasks: Task[] } {
  const projectId = generateId()
  const now = new Date().toISOString()

  const project: Project = {
    ...parsed.project,
    id: projectId,
    clientId,
    isArchived: false,
    createdAt: now,
  }

  const tasks: Task[] = parsed.tasks.map((t) => ({
    ...t,
    id: generateId(),
    projectId,
    createdAt: now,
  }))

  return { project, tasks }
}
