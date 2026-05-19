import { describe, it, expect } from 'vitest'
import { projectReducer, initialState } from '../projectReducer'
import type { Client, Project, Task, AppState } from '../../types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeClient = (overrides: Partial<Client> = {}): Client => ({
  id: 'c1',
  name: 'Test Client',
  niche: 'medical',
  color: '#06B6D4',
  clientSlug: 'test-client',
  clientEmail: '',
  isArchived: false,
  createdAt: new Date().toISOString(),
  ...overrides,
})

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'p1',
  name: 'Test Project',
  clientId: 'c1',
  color: '#06B6D4',
  isArchived: false,
  createdAt: new Date().toISOString(),
  ...overrides,
})

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 't1',
  projectId: 'p1',
  title: 'Test Task',
  responsible: 'Junior',
  priority: 'alta',
  status: 'todo',
  tags: [],
  subtasks: [],
  createdAt: new Date().toISOString(),
  ...overrides,
})

const stateWithClient: AppState = {
  ...initialState,
  clients: [makeClient()],
}

const stateWithProject: AppState = {
  ...stateWithClient,
  projects: [makeProject()],
}

const stateWithTask: AppState = {
  ...stateWithProject,
  tasks: [makeTask()],
}

// ─── ADD_CLIENT ───────────────────────────────────────────────────────────────

describe('ADD_CLIENT', () => {
  it('adds a new client to the empty list', () => {
    const c = makeClient({ id: 'c2' })
    const state = projectReducer(initialState, { type: 'ADD_CLIENT', payload: c })
    expect(state.clients).toHaveLength(1)
    expect(state.clients[0].id).toBe('c2')
  })

  it('ignores a client with a duplicate id', () => {
    const c = makeClient({ name: 'Duplicate' })
    const state = projectReducer(stateWithClient, { type: 'ADD_CLIENT', payload: c })
    expect(state.clients).toHaveLength(1)
    expect(state.clients[0].name).toBe('Test Client')
  })

  it('preserves other clients when adding a new one', () => {
    const c2 = makeClient({ id: 'c2', name: 'Second' })
    const state = projectReducer(stateWithClient, { type: 'ADD_CLIENT', payload: c2 })
    expect(state.clients).toHaveLength(2)
  })
})

// ─── UPDATE_CLIENT ────────────────────────────────────────────────────────────

describe('UPDATE_CLIENT', () => {
  it('updates name on an existing client', () => {
    const updated = makeClient({ name: 'Updated Name' })
    const state = projectReducer(stateWithClient, { type: 'UPDATE_CLIENT', payload: updated })
    expect(state.clients[0].name).toBe('Updated Name')
    expect(state.clients).toHaveLength(1)
  })

  it('upserts a client that does not exist yet', () => {
    const newClient = makeClient({ id: 'c-new', name: 'New Client' })
    const state = projectReducer(stateWithClient, { type: 'UPDATE_CLIENT', payload: newClient })
    expect(state.clients).toHaveLength(2)
    expect(state.clients.some((c) => c.id === 'c-new')).toBe(true)
  })

  it('does not affect other clients', () => {
    const c2 = makeClient({ id: 'c2', name: 'Other' })
    const s = { ...stateWithClient, clients: [makeClient(), c2] }
    const updated = makeClient({ name: 'Changed' })
    const state = projectReducer(s, { type: 'UPDATE_CLIENT', payload: updated })
    expect(state.clients).toHaveLength(2)
    expect(state.clients.find((c) => c.id === 'c2')?.name).toBe('Other')
  })

  it('updates isArchived when client is archived via UPDATE_CLIENT', () => {
    const archived = makeClient({ isArchived: true })
    const state = projectReducer(stateWithClient, { type: 'UPDATE_CLIENT', payload: archived })
    expect(state.clients[0].isArchived).toBe(true)
  })
})

// ─── DELETE_CLIENT ────────────────────────────────────────────────────────────

describe('DELETE_CLIENT', () => {
  it('removes the client from the list', () => {
    const state = projectReducer(stateWithClient, { type: 'DELETE_CLIENT', payload: 'c1' })
    expect(state.clients).toHaveLength(0)
  })

  it('cascades and removes all projects belonging to the deleted client', () => {
    const state = projectReducer(stateWithTask, { type: 'DELETE_CLIENT', payload: 'c1' })
    expect(state.projects).toHaveLength(0)
  })

  it('cascades and removes all tasks of the deleted client projects', () => {
    const state = projectReducer(stateWithTask, { type: 'DELETE_CLIENT', payload: 'c1' })
    expect(state.tasks).toHaveLength(0)
  })

  it('does not remove tasks from unrelated projects', () => {
    const otherClient = makeClient({ id: 'c2', name: 'Other' })
    const otherProject = makeProject({ id: 'p2', clientId: 'c2' })
    const otherTask = makeTask({ id: 't2', projectId: 'p2' })
    const s: AppState = {
      ...stateWithTask,
      clients: [...stateWithTask.clients, otherClient],
      projects: [...stateWithTask.projects, otherProject],
      tasks: [...stateWithTask.tasks, otherTask],
    }
    const state = projectReducer(s, { type: 'DELETE_CLIENT', payload: 'c1' })
    expect(state.tasks).toHaveLength(1)
    expect(state.tasks[0].id).toBe('t2')
  })

  it('clears activeClientId when the active client is deleted', () => {
    const s = { ...stateWithClient, activeClientId: 'c1' }
    const state = projectReducer(s, { type: 'DELETE_CLIENT', payload: 'c1' })
    expect(state.activeClientId).toBeNull()
  })

  it('preserves activeClientId when a different client is deleted', () => {
    const s = { ...stateWithClient, activeClientId: 'c1', clients: [makeClient(), makeClient({ id: 'c2', name: 'Other' })] }
    const state = projectReducer(s, { type: 'DELETE_CLIENT', payload: 'c2' })
    expect(state.activeClientId).toBe('c1')
  })

  it('does nothing to unrelated clients', () => {
    const c2 = makeClient({ id: 'c2', name: 'Other' })
    const s = { ...stateWithClient, clients: [makeClient(), c2] }
    const state = projectReducer(s, { type: 'DELETE_CLIENT', payload: 'c1' })
    expect(state.clients).toHaveLength(1)
    expect(state.clients[0].id).toBe('c2')
  })
})

// ─── ARCHIVE_CLIENT ───────────────────────────────────────────────────────────

describe('ARCHIVE_CLIENT', () => {
  it('sets isArchived to true on the target client', () => {
    const state = projectReducer(stateWithClient, { type: 'ARCHIVE_CLIENT', payload: 'c1' })
    expect(state.clients[0].isArchived).toBe(true)
  })

  it('does not affect other clients', () => {
    const c2 = makeClient({ id: 'c2', name: 'Other' })
    const s = { ...stateWithClient, clients: [makeClient(), c2] }
    const state = projectReducer(s, { type: 'ARCHIVE_CLIENT', payload: 'c1' })
    expect(state.clients.find((c) => c.id === 'c2')?.isArchived).toBe(false)
  })

  it('keeps the client in the list (not deleted)', () => {
    const state = projectReducer(stateWithClient, { type: 'ARCHIVE_CLIENT', payload: 'c1' })
    expect(state.clients).toHaveLength(1)
  })
})

// ─── SET_INITIAL_STATE ────────────────────────────────────────────────────────

describe('SET_INITIAL_STATE', () => {
  it('replaces state with provided clients, projects and tasks', () => {
    const c = makeClient({ id: 'c99' })
    const p = makeProject({ id: 'p99', clientId: 'c99' })
    const t = makeTask({ id: 't99' })
    const state = projectReducer(initialState, {
      type: 'SET_INITIAL_STATE',
      payload: { clients: [c], projects: [p], tasks: [t] },
    })
    expect(state.clients).toHaveLength(1)
    expect(state.projects).toHaveLength(1)
    expect(state.projects[0].id).toBe('p99')
    expect(state.tasks[0].id).toBe('t99')
  })
})

// ─── ADD_PROJECT ──────────────────────────────────────────────────────────────

describe('ADD_PROJECT', () => {
  it('adds a new project to the list', () => {
    const p = makeProject({ id: 'p2' })
    const state = projectReducer(initialState, { type: 'ADD_PROJECT', payload: p })
    expect(state.projects).toHaveLength(1)
    expect(state.projects[0].id).toBe('p2')
  })
})

// ─── UPDATE_PROJECT ───────────────────────────────────────────────────────────

describe('UPDATE_PROJECT', () => {
  it('updates a project by id', () => {
    const updated = makeProject({ name: 'Updated Name' })
    const state = projectReducer(stateWithProject, { type: 'UPDATE_PROJECT', payload: updated })
    expect(state.projects[0].name).toBe('Updated Name')
  })

  it('does not affect other projects', () => {
    const p2 = makeProject({ id: 'p2', name: 'Other' })
    const s = { ...stateWithProject, projects: [makeProject(), p2] }
    const updated = makeProject({ name: 'Changed' })
    const state = projectReducer(s, { type: 'UPDATE_PROJECT', payload: updated })
    expect(state.projects).toHaveLength(2)
    expect(state.projects[1].name).toBe('Other')
  })
})

// ─── DELETE_PROJECT ───────────────────────────────────────────────────────────

describe('DELETE_PROJECT', () => {
  it('removes the project and all its tasks', () => {
    const state = projectReducer(stateWithTask, { type: 'DELETE_PROJECT', payload: 'p1' })
    expect(state.projects).toHaveLength(0)
    expect(state.tasks).toHaveLength(0)
  })
})

// ─── ARCHIVE_PROJECT ──────────────────────────────────────────────────────────

describe('ARCHIVE_PROJECT', () => {
  it('sets isArchived to true on the project', () => {
    const state = projectReducer(stateWithProject, { type: 'ARCHIVE_PROJECT', payload: 'p1' })
    expect(state.projects[0].isArchived).toBe(true)
  })
})

// ─── ADD_TASK ─────────────────────────────────────────────────────────────────

describe('ADD_TASK', () => {
  it('adds a task to the list', () => {
    const t = makeTask({ id: 't2' })
    const state = projectReducer(stateWithProject, { type: 'ADD_TASK', payload: t })
    expect(state.tasks).toHaveLength(1)
    expect(state.tasks[0].id).toBe('t2')
  })
})

// ─── UPDATE_TASK ──────────────────────────────────────────────────────────────

describe('UPDATE_TASK', () => {
  it('updates a task by id', () => {
    const updated = makeTask({ title: 'Updated Title' })
    const state = projectReducer(stateWithTask, { type: 'UPDATE_TASK', payload: updated })
    expect(state.tasks[0].title).toBe('Updated Title')
  })
})

// ─── DELETE_TASK ──────────────────────────────────────────────────────────────

describe('DELETE_TASK', () => {
  it('removes a task by id', () => {
    const state = projectReducer(stateWithTask, { type: 'DELETE_TASK', payload: 't1' })
    expect(state.tasks).toHaveLength(0)
  })
})

// ─── MOVE_TASK ────────────────────────────────────────────────────────────────

describe('MOVE_TASK', () => {
  it('changes task status to doing', () => {
    const state = projectReducer(stateWithTask, {
      type: 'MOVE_TASK',
      payload: { taskId: 't1', targetStatus: 'doing' },
    })
    expect(state.tasks[0].status).toBe('doing')
  })

  it('sets completedAt when moved to done', () => {
    const state = projectReducer(stateWithTask, {
      type: 'MOVE_TASK',
      payload: { taskId: 't1', targetStatus: 'done' },
    })
    expect(state.tasks[0].status).toBe('done')
    expect(state.tasks[0].completedAt).toBeDefined()
  })

  it('clears completedAt when moved out of done', () => {
    const doneTask = makeTask({ status: 'done', completedAt: new Date().toISOString() })
    const s = { ...stateWithProject, tasks: [doneTask] }
    const state = projectReducer(s, {
      type: 'MOVE_TASK',
      payload: { taskId: 't1', targetStatus: 'todo' },
    })
    expect(state.tasks[0].completedAt).toBeUndefined()
  })
})

// ─── TOGGLE_SUBTASK ───────────────────────────────────────────────────────────

describe('TOGGLE_SUBTASK', () => {
  it('toggles a subtask from false to true', () => {
    const taskWithSub = makeTask({
      subtasks: [{ id: 'sub1', title: 'Sub', completed: false }],
    })
    const s = { ...stateWithProject, tasks: [taskWithSub] }
    const state = projectReducer(s, {
      type: 'TOGGLE_SUBTASK',
      payload: { taskId: 't1', subtaskId: 'sub1' },
    })
    expect(state.tasks[0].subtasks[0].completed).toBe(true)
  })

  it('toggles a subtask from true to false', () => {
    const taskWithSub = makeTask({
      subtasks: [{ id: 'sub1', title: 'Sub', completed: true }],
    })
    const s = { ...stateWithProject, tasks: [taskWithSub] }
    const state = projectReducer(s, {
      type: 'TOGGLE_SUBTASK',
      payload: { taskId: 't1', subtaskId: 'sub1' },
    })
    expect(state.tasks[0].subtasks[0].completed).toBe(false)
  })
})

// ─── IMPORT_DATA ──────────────────────────────────────────────────────────────

describe('IMPORT_DATA', () => {
  it('replaces clients, projects and tasks with imported data', () => {
    const c = makeClient({ id: 'imported-c' })
    const p = makeProject({ id: 'imported-p', clientId: 'imported-c' })
    const t = makeTask({ id: 'imported-t' })
    const state = projectReducer(stateWithTask, {
      type: 'IMPORT_DATA',
      payload: { clients: [c], projects: [p], tasks: [t] },
    })
    expect(state.clients[0].id).toBe('imported-c')
    expect(state.projects[0].id).toBe('imported-p')
    expect(state.tasks[0].id).toBe('imported-t')
  })
})

// ─── RESET_APP ────────────────────────────────────────────────────────────────

describe('RESET_APP', () => {
  it('resets state to initial (empty) state', () => {
    const state = projectReducer(stateWithTask, { type: 'RESET_APP' })
    expect(state.projects).toHaveLength(0)
    expect(state.tasks).toHaveLength(0)
  })
})

// ─── SET_VIEW ─────────────────────────────────────────────────────────────────

describe('SET_VIEW', () => {
  it('changes activeView to kanban', () => {
    const state = projectReducer(initialState, { type: 'SET_VIEW', payload: 'kanban' })
    expect(state.activeView).toBe('kanban')
  })
})

// ─── SET_ACTIVE_PROJECT ───────────────────────────────────────────────────────

describe('SET_ACTIVE_PROJECT', () => {
  it('sets activeProjectId', () => {
    const state = projectReducer(initialState, { type: 'SET_ACTIVE_PROJECT', payload: 'p1' })
    expect(state.activeProjectId).toBe('p1')
  })

  it('clears activeProjectId when null', () => {
    const s = { ...initialState, activeProjectId: 'p1' }
    const state = projectReducer(s, { type: 'SET_ACTIVE_PROJECT', payload: null })
    expect(state.activeProjectId).toBeNull()
  })
})
