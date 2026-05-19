import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '../types/database'
import type { Client, Project, Task, SubTask, ClientNiche, PriorityLevel, TaskStatus, TaskTag, UserProfile, UserRole } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// ─── Slug generator ───────────────────────────────────────────────────────────

export const generateSlug = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') +
  '-' +
  Math.random().toString(36).slice(2, 6)

// ─── Client adapters ──────────────────────────────────────────────────────────

export const dbClientToApp = (
  row: Database['public']['Tables']['clients']['Row'],
): Client => ({
  id: row.id,
  name: row.name,
  niche: row.niche as ClientNiche,
  color: row.color,
  description: row.description ?? undefined,
  clientSlug: row.client_slug,
  clientEmail: row.client_email,
  isArchived: row.is_archived,
  createdAt: row.created_at,
})

export const appClientToDb = (
  client: Client,
  createdBy?: string | null,
): Database['public']['Tables']['clients']['Insert'] => ({
  id: client.id,
  name: client.name,
  niche: client.niche,
  color: client.color,
  description: client.description ?? null,
  client_slug: client.clientSlug || generateSlug(client.name),
  client_email: client.clientEmail ?? '',
  is_archived: client.isArchived,
  created_at: client.createdAt,
  created_by: createdBy ?? null,
})

// ─── Project adapters ─────────────────────────────────────────────────────────

export const dbProjectToApp = (
  row: Database['public']['Tables']['projects']['Row'],
): Project => ({
  id: row.id,
  clientId: row.client_id,
  name: row.name,
  color: row.color,
  description: row.description ?? undefined,
  isArchived: row.is_archived,
  createdAt: row.created_at,
})

export const appProjectToDb = (
  project: Project,
  createdBy?: string | null,
): Database['public']['Tables']['projects']['Insert'] => ({
  id: project.id,
  client_id: project.clientId,
  name: project.name,
  color: project.color,
  description: project.description ?? null,
  is_archived: project.isArchived,
  created_at: project.createdAt,
  created_by: createdBy ?? null,
})

// ─── Task adapters ────────────────────────────────────────────────────────────

export const dbTaskToApp = (
  row: Database['public']['Tables']['tasks']['Row'],
): Task => ({
  id: row.id,
  projectId: row.project_id,
  title: row.title,
  responsible: row.responsible,
  deadline: row.deadline ?? undefined,
  priority: row.priority as PriorityLevel,
  notes: row.notes ?? undefined,
  status: row.status as TaskStatus,
  tags: (row.tags ?? []) as TaskTag[],
  subtasks: (row.subtasks ?? []) as unknown as SubTask[],
  createdAt: row.created_at,
  completedAt: row.completed_at ?? undefined,
})

export const appTaskToDb = (
  task: Task,
): Database['public']['Tables']['tasks']['Insert'] => ({
  id: task.id,
  project_id: task.projectId,
  title: task.title,
  responsible: task.responsible,
  deadline: task.deadline ?? null,
  priority: task.priority,
  notes: task.notes ?? null,
  status: task.status,
  tags: task.tags,
  subtasks: task.subtasks as unknown as Json,
  created_at: task.createdAt,
  completed_at: task.completedAt ?? null,
})

// ─── Profile adapters ─────────────────────────────────────────────────────────

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export const dbProfileToApp = (
  row: Database['public']['Tables']['profiles']['Row'],
  email: string = '',
): UserProfile => ({
  name: row.full_name,
  email: email,
  jobTitle: row.job_title,
  avatarColor: row.avatar_color,
  avatarInitials: getInitials(row.full_name),
  role: row.role as UserRole,
})

export const appProfileToDb = (
  profile: UserProfile,
  id: string,
): Database['public']['Tables']['profiles']['Update'] => ({
  id,
  full_name: profile.name,
  job_title: profile.jobTitle,
  avatar_color: profile.avatarColor,
})
