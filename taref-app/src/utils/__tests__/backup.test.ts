/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportBackup, validateAndImport } from '../backup'
import type { Client, Project, Task, BackupData } from '../../types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockClient: Client = {
  id: 'c1',
  name: 'Dr. Lucas Nemes',
  niche: 'dental',
  color: '#06B6D4',
  clientSlug: 'dr-lucas-nemes',
  clientEmail: '',
  isArchived: false,
  createdAt: '2026-05-01T00:00:00.000Z',
}

const mockProject: Project = {
  id: 'p1',
  name: 'Landing Page Implantes',
  clientId: 'c1',
  color: '#06B6D4',
  isArchived: false,
  createdAt: '2026-05-01T00:00:00.000Z',
}

const mockTask: Task = {
  id: 't1',
  projectId: 'p1',
  title: 'Criar copy principal',
  responsible: 'Junior',
  priority: 'alta',
  status: 'todo',
  tags: ['copy'],
  subtasks: [],
  createdAt: '2026-05-01T00:00:00.000Z',
}

const validBackup: BackupData = {
  version: '2.0',
  exportedAt: new Date().toISOString(),
  clients: [mockClient],
  projects: [mockProject],
  tasks: [mockTask],
}

// ─── Tests: validateAndImport ─────────────────────────────────────────────────

describe('validateAndImport', () => {
  it('should parse and return valid backup data', () => {
    const result = validateAndImport(JSON.stringify(validBackup))
    expect(result.clients).toHaveLength(1)
    expect(result.projects).toHaveLength(1)
    expect(result.tasks).toHaveLength(1)
    expect(result.projects[0].id).toBe('p1')
  })

  it('should throw on invalid JSON string', () => {
    expect(() => validateAndImport('not-json')).toThrow()
  })

  it('should throw when version is not 2.0', () => {
    const broken = { ...validBackup, version: '1.0' }
    expect(() => validateAndImport(JSON.stringify(broken))).toThrow('Versão de backup incompatível.')
  })

  it('should throw when projects is not an array', () => {
    const broken = { ...validBackup, projects: null }
    expect(() => validateAndImport(JSON.stringify(broken))).toThrow('Formato de dados corrompido.')
  })

  it('should throw when tasks is not an array', () => {
    const broken = { ...validBackup, tasks: 'invalid' }
    expect(() => validateAndImport(JSON.stringify(broken))).toThrow('Formato de dados corrompido.')
  })

  it('should throw when a project is missing required id field', () => {
    const broken: BackupData = {
      ...validBackup,
      projects: [{ ...mockProject, id: '' }],
    }
    expect(() => validateAndImport(JSON.stringify(broken))).toThrow('Projeto inválido detectado.')
  })

  it('should throw when a project is missing required name field', () => {
    const broken: BackupData = {
      ...validBackup,
      projects: [{ ...mockProject, name: '' }],
    }
    expect(() => validateAndImport(JSON.stringify(broken))).toThrow('Projeto inválido detectado.')
  })

  it('should throw when a task is missing required title field', () => {
    const broken: BackupData = {
      ...validBackup,
      tasks: [{ ...mockTask, title: '' }],
    }
    expect(() => validateAndImport(JSON.stringify(broken))).toThrow('Tarefa inválida detectada.')
  })

  it('should throw when a task is missing required status field', () => {
    const broken = {
      ...validBackup,
      tasks: [{ ...mockTask, status: '' }],
    }
    expect(() => validateAndImport(JSON.stringify(broken))).toThrow('Tarefa inválida detectada.')
  })

  it('should accept backup with empty projects and tasks arrays', () => {
    const empty = { ...validBackup, projects: [], tasks: [] }
    const result = validateAndImport(JSON.stringify(empty))
    expect(result.projects).toHaveLength(0)
    expect(result.tasks).toHaveLength(0)
  })
})

// ─── Tests: exportBackup ──────────────────────────────────────────────────────

describe('exportBackup', () => {
  beforeEach(() => {
    // Mock browser APIs not available in jsdom
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as unknown as Node)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as unknown as Node)
    ;(globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    ;(globalThis as any).URL.revokeObjectURL = vi.fn()

    // Mock Blob
    ;(globalThis as any).Blob = class MockBlob {
      constructor(_content: string[]) {}
    } as unknown as typeof Blob
  })

  it('should call document.createElement with "a"', () => {
    exportBackup([mockClient], [mockProject], [mockTask])
    expect(document.createElement).toHaveBeenCalledWith('a')
  })

  it('should trigger anchor click to download the file', () => {
    const mockAnchor = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement)
    exportBackup([mockClient], [mockProject], [mockTask])
    expect(mockAnchor.click).toHaveBeenCalled()
  })

  it('should set download filename with date prefix', () => {
    const mockAnchor = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement)
    exportBackup([mockClient], [mockProject], [mockTask])
    expect(mockAnchor.download).toMatch(/^taref_ai_backup_\d{4}-\d{2}-\d{2}\.json$/)
  })

  it('should revoke object URL after download', () => {
    exportBackup([mockClient], [mockProject], [mockTask])
    expect(URL.revokeObjectURL).toHaveBeenCalled()
  })
})
