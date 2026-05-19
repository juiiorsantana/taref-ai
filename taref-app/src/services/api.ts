import { appClientToDb, appProjectToDb, appTaskToDb, generateSlug, supabase, dbProfileToApp, appProfileToDb } from '../utils/supabaseClient'
import type { Client, Project, Task, SubTask, TaskStatus, UserProfile, UserRole } from '../types'
import type { Database, Json } from '../types/database'

type DbClientRow = Database['public']['Tables']['clients']['Row']
type DbProjectRow = Database['public']['Tables']['projects']['Row']
type DbTaskRow = Database['public']['Tables']['tasks']['Row']
type DbProfileRow = Database['public']['Tables']['profiles']['Row']
type DbInvitationRow = Database['public']['Tables']['invitations']['Row']
type DbProjectAccessRow = Database['public']['Tables']['admin_project_access']['Row']

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const REST_URL = `${SUPABASE_URL}/rest/v1`
const REQUEST_TIMEOUT_MS = 15_000

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method: HttpMethod
  path: string
  body?: unknown
  query?: string
}

interface StoredSession {
  access_token?: string
  currentSession?: { access_token?: string }
}

const readTokenFromStorage = (): string | null => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as StoredSession
      const token = parsed.access_token ?? parsed.currentSession?.access_token
      if (token) return token
    }
  } catch (err) {
    console.warn('[api] falha ao ler token do localStorage', err)
  }
  return null
}

const getAccessToken = (): string => {
  const token = readTokenFromStorage()
  if (!token) throw new Error('Usuário não autenticado (token ausente no localStorage)')
  return token
}

const request = async <T = unknown>(opts: RequestOptions): Promise<T | null> => {
  const tag = `[api ${opts.method} ${opts.path}]`
  const token = getAccessToken()
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  const url = `${REST_URL}/${opts.path}${opts.query ? `?${opts.query}` : ''}`
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
  if (opts.method !== 'GET') headers.Prefer = 'return=representation'

  try {
    const response = await fetch(url, {
      method: opts.method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    })
    const rawText = await response.text()
    if (!response.ok) {
      let message = rawText
      try {
        const parsed = JSON.parse(rawText) as { message?: string; hint?: string; details?: string }
        message = parsed.message || parsed.details || parsed.hint || rawText
      } catch { /* keep rawText */ }
      throw new Error(`${tag} ${message}`)
    }
    if (response.status === 204 || !rawText) return null
    return JSON.parse(rawText) as T
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`${tag} timeout após ${REQUEST_TIMEOUT_MS}ms`, { cause: err })
    }
    throw err
  } finally {
    window.clearTimeout(timeout)
  }
}

const eqQuery = (column: string, value: string): string =>
  `${column}=eq.${encodeURIComponent(value)}`

export const api = {
  clients: {
    list: () =>
      request<DbClientRow[]>({ method: 'GET', path: 'clients', query: 'select=*&order=created_at.asc' }),

    create: (client: Client, userId: string) =>
      request({ method: 'POST', path: 'clients', body: appClientToDb(client, userId) }),

    update: (client: Client) =>
      request({
        method: 'PATCH',
        path: 'clients',
        query: eqQuery('id', client.id),
        body: {
          name: client.name,
          niche: client.niche,
          color: client.color,
          description: client.description ?? null,
          client_slug: client.clientSlug || generateSlug(client.name),
          client_email: client.clientEmail ?? '',
          is_archived: client.isArchived,
        },
      }),

    archive: (clientId: string) =>
      request({
        method: 'PATCH',
        path: 'clients',
        query: eqQuery('id', clientId),
        body: { is_archived: true },
      }),

    delete: (clientId: string) =>
      request({ method: 'DELETE', path: 'clients', query: eqQuery('id', clientId) }),
  },

  projects: {
    list: () =>
      request<DbProjectRow[]>({ method: 'GET', path: 'projects', query: 'select=*&order=created_at.asc' }),

    create: (project: Project, userId: string) =>
      request({ method: 'POST', path: 'projects', body: appProjectToDb(project, userId) }),

    update: (project: Project) =>
      request({
        method: 'PATCH',
        path: 'projects',
        query: eqQuery('id', project.id),
        body: {
          name: project.name,
          color: project.color,
          description: project.description ?? null,
          is_archived: project.isArchived,
        },
      }),

    archive: (projectId: string) =>
      request({
        method: 'PATCH',
        path: 'projects',
        query: eqQuery('id', projectId),
        body: { is_archived: true },
      }),

    delete: (projectId: string) =>
      request({ method: 'DELETE', path: 'projects', query: eqQuery('id', projectId) }),
  },

  tasks: {
    list: () =>
      request<DbTaskRow[]>({ method: 'GET', path: 'tasks', query: 'select=*&order=created_at.asc' }),

    create: (task: Task) =>
      request({ method: 'POST', path: 'tasks', body: appTaskToDb(task) }),

    update: (task: Task) =>
      request({
        method: 'PATCH',
        path: 'tasks',
        query: eqQuery('id', task.id),
        body: {
          title: task.title,
          responsible: task.responsible,
          deadline: task.deadline ?? null,
          priority: task.priority,
          notes: task.notes ?? null,
          status: task.status,
          tags: task.tags,
          subtasks: task.subtasks as unknown as Json,
          completed_at: task.completedAt ?? null,
        },
      }),

    move: (taskId: string, targetStatus: TaskStatus) =>
      request({
        method: 'PATCH',
        path: 'tasks',
        query: eqQuery('id', taskId),
        body: {
          status: targetStatus,
          completed_at: targetStatus === 'done' ? new Date().toISOString() : null,
        },
      }),

    setSubtasks: (taskId: string, subtasks: SubTask[]) =>
      request({
        method: 'PATCH',
        path: 'tasks',
        query: eqQuery('id', taskId),
        body: { subtasks: subtasks as unknown as Json },
      }),

    delete: (taskId: string) =>
      request({ method: 'DELETE', path: 'tasks', query: eqQuery('id', taskId) }),
  },

  profiles: {
    get: async (userId: string, email: string = '') => {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[api.profiles.get] Erro no SELECT do perfil:', { status, error })
        throw new Error(error.message)
      }

      return dbProfileToApp(data, email)
    },

    update: async (userId: string, profile: UserProfile) => {
      const patch = appProfileToDb(profile, userId)

      const { data, error, status } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', userId)
        .select()

      if (error) {
        console.error('[api.profiles.update] Erro no UPDATE do perfil:', { status, error })
        throw new Error(error.message)
      }

      if (!data || data.length === 0) {
        console.warn('[api.profiles.update] UPDATE retornou 0 linhas — RLS pode estar bloqueando a operação')
      }
      return data
    },

    listAll: async (): Promise<DbProfileRow[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[api.profiles.listAll] Erro:', error)
        throw new Error(error.message)
      }

      return data ?? []
    },

    updateRole: async (targetUserId: string, newRole: Exclude<UserRole, 'super_admin'>): Promise<void> => {
      const token = getAccessToken()

      const res = await fetch(`${SUPABASE_URL}/functions/v1/manage-roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ targetUserId, newRole }),
      })

      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? 'Erro ao atualizar role')
      }
    },
  },

  invitations: {
    list: async (): Promise<DbInvitationRow[]> => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return data ?? []
    },

    create: async (opts: { email?: string; expiresInDays?: number } = {}): Promise<DbInvitationRow> => {
      const token = getAccessToken()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(opts),
      })
      const body = await res.json() as { invitation?: DbInvitationRow; error?: string }
      if (!res.ok || !body.invitation) {
        throw new Error(body.error ?? 'Erro ao criar convite')
      }
      return body.invitation
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase.from('invitations').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },

    accept: async (payload: { token: string; email: string; password: string; fullName: string }): Promise<void> => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/accept-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? 'Erro ao aceitar convite')
      }
    },
  },

  projectAccess: {
    list: async (): Promise<DbProjectAccessRow[]> => {
      const { data, error } = await supabase
        .from('admin_project_access')
        .select('*')
      if (error) throw new Error(error.message)
      return data ?? []
    },

    grant: async (adminId: string, projectId: string, grantedBy: string): Promise<void> => {
      const { error } = await supabase
        .from('admin_project_access')
        .insert({ admin_id: adminId, project_id: projectId, granted_by: grantedBy })
      if (error) throw new Error(error.message)
    },

    revoke: async (adminId: string, projectId: string): Promise<void> => {
      const { error } = await supabase
        .from('admin_project_access')
        .delete()
        .eq('admin_id', adminId)
        .eq('project_id', projectId)
      if (error) throw new Error(error.message)
    },
  },
}
