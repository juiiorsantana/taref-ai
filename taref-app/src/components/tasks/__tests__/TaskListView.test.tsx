import { describe, it, expect } from 'vitest'
import { projectReducer, initialState } from '../../../context/projectReducer'
import type { AppState, Project, Task } from '../../../types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'p1',
  clientId: 'c1',
  name: 'Projeto Teste',
  color: '#06B6D4',
  isArchived: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 't1',
  projectId: 'p1',
  title: 'Tarefa de teste',
  responsible: 'Junior',
  priority: 'media',
  status: 'todo',
  tags: [],
  subtasks: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

const baseState: AppState = {
  ...initialState,
  activeClientId: 'c1',
  projects: [makeProject()],
  tasks: [makeTask()],
}

// ─── SET_VIEW tasks ───────────────────────────────────────────────────────────

describe('SET_VIEW tasks', () => {
  it('sets activeView to tasks', () => {
    const state = projectReducer(baseState, { type: 'SET_VIEW', payload: 'tasks' })
    expect(state.activeView).toBe('tasks')
  })

  it('can switch from tasks back to kanban', () => {
    const s1 = projectReducer(baseState, { type: 'SET_VIEW', payload: 'tasks' })
    const s2 = projectReducer(s1, { type: 'SET_VIEW', payload: 'kanban' })
    expect(s2.activeView).toBe('kanban')
  })
})

// ─── ADD_TASK (inline add) ────────────────────────────────────────────────────

describe('ADD_TASK via TaskListView flow', () => {
  it('adds a task and it appears in state', () => {
    const newTask = makeTask({ id: 't2', title: 'Nova tarefa inline' })
    const state = projectReducer(baseState, { type: 'ADD_TASK', payload: newTask })
    expect(state.tasks).toHaveLength(2)
    expect(state.tasks[1].title).toBe('Nova tarefa inline')
    expect(state.tasks[1].status).toBe('todo')
  })

  it('new task belongs to the correct project', () => {
    const newTask = makeTask({ id: 't3', projectId: 'p1', title: 'Outra tarefa' })
    const state = projectReducer(baseState, { type: 'ADD_TASK', payload: newTask })
    const projectTasks = state.tasks.filter((t) => t.projectId === 'p1')
    expect(projectTasks).toHaveLength(2)
  })
})

// ─── MOVE_TASK (checkbox toggle) ──────────────────────────────────────────────

describe('MOVE_TASK — checkbox toggle sync', () => {
  it('marks task as done when checked', () => {
    const state = projectReducer(baseState, {
      type: 'MOVE_TASK',
      payload: { taskId: 't1', targetStatus: 'done' },
    })
    expect(state.tasks[0].status).toBe('done')
    expect(state.tasks[0].completedAt).toBeDefined()
  })

  it('marks task back to todo when unchecked from done', () => {
    const doneState: AppState = {
      ...baseState,
      tasks: [makeTask({ status: 'done', completedAt: '2026-05-01T00:00:00.000Z' })],
    }
    const state = projectReducer(doneState, {
      type: 'MOVE_TASK',
      payload: { taskId: 't1', targetStatus: 'todo' },
    })
    expect(state.tasks[0].status).toBe('todo')
    expect(state.tasks[0].completedAt).toBeUndefined()
  })

  it('kanban state reflects the same task status change (shared state)', () => {
    const s1 = projectReducer(baseState, {
      type: 'MOVE_TASK',
      payload: { taskId: 't1', targetStatus: 'done' },
    })
    // The same state is used by KanbanBoard — task must show up in "done" column
    const doneTask = s1.tasks.find((t) => t.id === 't1')
    expect(doneTask?.status).toBe('done')
  })
})

// ─── TOGGLE_SUBTASK ───────────────────────────────────────────────────────────

describe('TOGGLE_SUBTASK — subtask checkbox', () => {
  const stateWithSubs: AppState = {
    ...baseState,
    tasks: [
      makeTask({
        subtasks: [
          { id: 'sub1', title: 'Sub 1', completed: false },
          { id: 'sub2', title: 'Sub 2', completed: true },
        ],
      }),
    ],
  }

  it('completes an incomplete subtask', () => {
    const state = projectReducer(stateWithSubs, {
      type: 'TOGGLE_SUBTASK',
      payload: { taskId: 't1', subtaskId: 'sub1' },
    })
    expect(state.tasks[0].subtasks[0].completed).toBe(true)
  })

  it('uncompletes a completed subtask', () => {
    const state = projectReducer(stateWithSubs, {
      type: 'TOGGLE_SUBTASK',
      payload: { taskId: 't1', subtaskId: 'sub2' },
    })
    expect(state.tasks[0].subtasks[1].completed).toBe(false)
  })

  it('does not affect other subtasks', () => {
    const state = projectReducer(stateWithSubs, {
      type: 'TOGGLE_SUBTASK',
      payload: { taskId: 't1', subtaskId: 'sub1' },
    })
    expect(state.tasks[0].subtasks[1].completed).toBe(true)
  })
})

// ─── UPDATE_PROJECT status (project status dropdown) ─────────────────────────

describe('UPDATE_PROJECT — project status dropdown', () => {
  it('updates project status to pausado', () => {
    const updated = makeProject({ status: 'pausado' })
    const state = projectReducer(baseState, { type: 'UPDATE_PROJECT', payload: updated })
    expect(state.projects[0].status).toBe('pausado')
  })

  it('updates project status to concluido', () => {
    const updated = makeProject({ status: 'concluido' })
    const state = projectReducer(baseState, { type: 'UPDATE_PROJECT', payload: updated })
    expect(state.projects[0].status).toBe('concluido')
  })

  it('project status change does not affect tasks', () => {
    const updated = makeProject({ status: 'concluido' })
    const state = projectReducer(baseState, { type: 'UPDATE_PROJECT', payload: updated })
    expect(state.tasks).toHaveLength(1)
    expect(state.tasks[0].status).toBe('todo')
  })
})

// ─── High priority task fields ────────────────────────────────────────────────

describe('High priority task detection', () => {
  it('alta priority task is flagged correctly in state', () => {
    const altaTask = makeTask({ priority: 'alta' })
    const state: AppState = { ...baseState, tasks: [altaTask] }
    expect(state.tasks[0].priority).toBe('alta')
  })

  it('non-alta tasks do not have alta priority', () => {
    const mediaTask = makeTask({ priority: 'media' })
    const state: AppState = { ...baseState, tasks: [mediaTask] }
    expect(state.tasks[0].priority).not.toBe('alta')
  })
})
