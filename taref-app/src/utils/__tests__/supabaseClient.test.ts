import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({})),
}))

import {
  generateSlug,
  dbClientToApp,
  appClientToDb,
  dbProjectToApp,
  appProjectToDb,
  dbTaskToApp,
  appTaskToDb,
} from '../supabaseClient'
import type { Database } from '../../types/database'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const dbClientRow = (): Database['public']['Tables']['clients']['Row'] => ({
  id: 'c1',
  name: 'Test Client',
  niche: 'medical',
  color: '#06B6D4',
  description: 'Some notes',
  client_slug: 'test-client-ab12',
  client_email: 'test@example.com',
  is_archived: false,
  created_at: '2025-01-01T00:00:00Z',
  created_by: 'user-1',
})

const dbProjectRow = (): Database['public']['Tables']['projects']['Row'] => ({
  id: 'p1',
  name: 'Test Project',
  client_id: 'c1',
  color: '#1E40AF',
  description: null,
  is_archived: false,
  created_at: '2025-01-02T00:00:00Z',
  created_by: 'user-1',
})

const dbTaskRow = (): Database['public']['Tables']['tasks']['Row'] => ({
  id: 't1',
  project_id: 'p1',
  title: 'Test Task',
  responsible: 'Junior',
  deadline: '2025-06-01',
  priority: 'alta',
  notes: 'Some note',
  status: 'todo',
  tags: ['ads', 'design'],
  subtasks: [{ id: 'sub1', title: 'Sub', completed: false }] as unknown as Database['public']['Tables']['tasks']['Row']['subtasks'],
  created_at: '2025-01-03T00:00:00Z',
  completed_at: null,
})

// ─── generateSlug ─────────────────────────────────────────────────────────────

describe('generateSlug', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789)
  })

  it('lowercases the name', () => {
    const slug = generateSlug('MY CLIENT')
    expect(slug).toMatch(/^my-client-/)
  })

  it('replaces spaces with hyphens', () => {
    const slug = generateSlug('my client name')
    expect(slug).toMatch(/^my-client-name-/)
  })

  it('strips Portuguese accented characters', () => {
    const slug = generateSlug('João São Paulo')
    expect(slug).toMatch(/^joao-sao-paulo-/)
    expect(slug).not.toMatch(/[àáâãéêíóôõúüç]/i)
  })

  it('strips other diacritics', () => {
    const slug = generateSlug('Café René')
    expect(slug).toMatch(/^cafe-rene-/)
  })

  it('collapses multiple spaces and special chars into a single hyphen', () => {
    const slug = generateSlug('hello   world!!!')
    expect(slug).toMatch(/^hello-world-/)
  })

  it('removes leading and trailing hyphens from the base', () => {
    const slug = generateSlug(' hello ')
    expect(slug).toMatch(/^hello-/)
    expect(slug).not.toMatch(/^-/)
  })

  it('appends a 4-char random suffix', () => {
    const slug = generateSlug('test')
    const parts = slug.split('-')
    const suffix = parts[parts.length - 1]
    expect(suffix).toHaveLength(4)
  })

  it('generates unique slugs for the same name', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.9)
    const s1 = generateSlug('Same Name')
    const s2 = generateSlug('Same Name')
    expect(s1).not.toBe(s2)
  })
})

// ─── dbClientToApp ────────────────────────────────────────────────────────────

describe('dbClientToApp', () => {
  it('maps all fields from a database row to the app model', () => {
    const row = dbClientRow()
    const client = dbClientToApp(row)
    expect(client.id).toBe('c1')
    expect(client.name).toBe('Test Client')
    expect(client.niche).toBe('medical')
    expect(client.color).toBe('#06B6D4')
    expect(client.description).toBe('Some notes')
    expect(client.clientSlug).toBe('test-client-ab12')
    expect(client.clientEmail).toBe('test@example.com')
    expect(client.isArchived).toBe(false)
    expect(client.createdAt).toBe('2025-01-01T00:00:00Z')
  })

  it('maps null description to undefined', () => {
    const row = { ...dbClientRow(), description: null }
    const client = dbClientToApp(row)
    expect(client.description).toBeUndefined()
  })

  it('does not expose created_by in the app model', () => {
    const client = dbClientToApp(dbClientRow())
    expect(Object.keys(client)).not.toContain('created_by')
    expect(Object.keys(client)).not.toContain('createdBy')
  })
})

// ─── appClientToDb ────────────────────────────────────────────────────────────

describe('appClientToDb', () => {
  const appClient = () => dbClientToApp(dbClientRow())

  it('maps all fields from the app model to a DB insert', () => {
    const row = appClientToDb(appClient(), 'user-1')
    expect(row.id).toBe('c1')
    expect(row.name).toBe('Test Client')
    expect(row.niche).toBe('medical')
    expect(row.color).toBe('#06B6D4')
    expect(row.description).toBe('Some notes')
    expect(row.client_slug).toBe('test-client-ab12')
    expect(row.client_email).toBe('test@example.com')
    expect(row.is_archived).toBe(false)
    expect(row.created_by).toBe('user-1')
  })

  it('maps undefined description to null', () => {
    const client = { ...appClient(), description: undefined }
    const row = appClientToDb(client, 'user-1')
    expect(row.description).toBeNull()
  })

  it('maps undefined clientEmail to empty string', () => {
    const client = { ...appClient(), clientEmail: undefined as unknown as string }
    const row = appClientToDb(client, 'user-1')
    expect(row.client_email).toBe('')
  })

  it('uses null for created_by when not provided', () => {
    const row = appClientToDb(appClient())
    expect(row.created_by).toBeNull()
  })

  it('generates a fallback slug when clientSlug is empty', () => {
    const client = { ...appClient(), clientSlug: '' }
    const row = appClientToDb(client, 'user-1')
    expect(row.client_slug).toBeTruthy()
    expect(row.client_slug).not.toBe('')
  })
})

// ─── dbProjectToApp ───────────────────────────────────────────────────────────

describe('dbProjectToApp', () => {
  it('maps all fields from DB row to app model', () => {
    const row = dbProjectRow()
    const project = dbProjectToApp(row)
    expect(project.id).toBe('p1')
    expect(project.clientId).toBe('c1')
    expect(project.name).toBe('Test Project')
    expect(project.color).toBe('#1E40AF')
    expect(project.description).toBeUndefined()
    expect(project.isArchived).toBe(false)
    expect(project.createdAt).toBe('2025-01-02T00:00:00Z')
  })

  it('maps null description to undefined', () => {
    const row = { ...dbProjectRow(), description: null }
    expect(dbProjectToApp(row).description).toBeUndefined()
  })

  it('maps a non-null description', () => {
    const row = { ...dbProjectRow(), description: 'A project' }
    expect(dbProjectToApp(row).description).toBe('A project')
  })
})

// ─── appProjectToDb ───────────────────────────────────────────────────────────

describe('appProjectToDb', () => {
  const appProject = () => dbProjectToApp(dbProjectRow())

  it('maps all fields to the DB insert shape', () => {
    const row = appProjectToDb(appProject(), 'user-1')
    expect(row.id).toBe('p1')
    expect(row.client_id).toBe('c1')
    expect(row.name).toBe('Test Project')
    expect(row.created_by).toBe('user-1')
  })

  it('maps undefined description to null', () => {
    const project = { ...appProject(), description: undefined }
    expect(appProjectToDb(project).description).toBeNull()
  })
})

// ─── dbTaskToApp ──────────────────────────────────────────────────────────────

describe('dbTaskToApp', () => {
  it('maps all fields from DB row to app model', () => {
    const row = dbTaskRow()
    const task = dbTaskToApp(row)
    expect(task.id).toBe('t1')
    expect(task.projectId).toBe('p1')
    expect(task.title).toBe('Test Task')
    expect(task.responsible).toBe('Junior')
    expect(task.deadline).toBe('2025-06-01')
    expect(task.priority).toBe('alta')
    expect(task.notes).toBe('Some note')
    expect(task.status).toBe('todo')
    expect(task.tags).toEqual(['ads', 'design'])
    expect(task.subtasks).toHaveLength(1)
    expect(task.completedAt).toBeUndefined()
  })

  it('maps null deadline to undefined', () => {
    const row = { ...dbTaskRow(), deadline: null }
    expect(dbTaskToApp(row).deadline).toBeUndefined()
  })

  it('maps null completed_at to undefined', () => {
    const row = { ...dbTaskRow(), completed_at: null }
    expect(dbTaskToApp(row).completedAt).toBeUndefined()
  })

  it('maps null notes to undefined', () => {
    const row = { ...dbTaskRow(), notes: null }
    expect(dbTaskToApp(row).notes).toBeUndefined()
  })

  it('defaults tags to empty array when null', () => {
    const row = { ...dbTaskRow(), tags: null as any }
    expect(dbTaskToApp(row).tags).toEqual([])
  })

  it('defaults subtasks to empty array when null', () => {
    const row = { ...dbTaskRow(), subtasks: null as any }
    expect(dbTaskToApp(row).subtasks).toEqual([])
  })
})

// ─── appTaskToDb ──────────────────────────────────────────────────────────────

describe('appTaskToDb', () => {
  const appTask = () => dbTaskToApp(dbTaskRow())

  it('maps all fields to the DB insert shape', () => {
    const row = appTaskToDb(appTask())
    expect(row.id).toBe('t1')
    expect(row.project_id).toBe('p1')
    expect(row.title).toBe('Test Task')
    expect(row.responsible).toBe('Junior')
    expect(row.priority).toBe('alta')
    expect(row.status).toBe('todo')
  })

  it('maps undefined deadline to null', () => {
    const task = { ...appTask(), deadline: undefined }
    expect(appTaskToDb(task).deadline).toBeNull()
  })

  it('maps undefined notes to null', () => {
    const task = { ...appTask(), notes: undefined }
    expect(appTaskToDb(task).notes).toBeNull()
  })

  it('maps undefined completedAt to null', () => {
    const task = { ...appTask(), completedAt: undefined }
    expect(appTaskToDb(task).completed_at).toBeNull()
  })
})
