import type { AppState, ProjectAction, UserProfile } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: '',
  email: '',
  jobTitle: '',
  avatarColor: '197 90% 42%',
  avatarInitials: 'MA',
}

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ─── Initial State ────────────────────────────────────────────────────────────

export const initialState: AppState = {
  clients: [],
  projects: [],
  tasks: [],
  activeView: 'dashboard',
  activeProjectId: null,
  activeClientId: null,
  userProfile: DEFAULT_USER_PROFILE,
  isLoading: false,
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

export const projectReducer = (state: AppState, action: ProjectAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_INITIAL_STATE':
      return {
        ...state,
        clients: action.payload.clients,
        projects: action.payload.projects,
        tasks: action.payload.tasks,
        userProfile: action.payload.userProfile ?? state.userProfile,
        isLoading: action.payload.isLoading ?? false,
      }

    // ── Client CRUD ──────────────────────────────────────────────────────────
    case 'ADD_CLIENT':
      if (state.clients.some((c) => c.id === action.payload.id)) return state
      return { ...state, clients: [...state.clients, action.payload] }

    case 'UPDATE_CLIENT': {
      const exists = state.clients.some((c) => c.id === action.payload.id)
      if (!exists) return { ...state, clients: [...state.clients, action.payload] }
      return {
        ...state,
        clients: state.clients.map((c) => (c.id === action.payload.id ? action.payload : c)),
      }
    }

    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter((c) => c.id !== action.payload),
        projects: state.projects.filter((p) => p.clientId !== action.payload),
        tasks: state.tasks.filter(
          (t) =>
            !state.projects
              .filter((p) => p.clientId === action.payload)
              .some((p) => p.id === t.projectId),
        ),
        activeClientId: state.activeClientId === action.payload ? null : state.activeClientId,
      }

    case 'ARCHIVE_CLIENT':
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.payload ? { ...c, isArchived: true } : c,
        ),
      }

    // ── Project CRUD ─────────────────────────────────────────────────────────
    case 'ADD_PROJECT':
      if (state.projects.some((p) => p.id === action.payload.id)) return state
      return { ...state, projects: [...state.projects, action.payload] }

    case 'UPDATE_PROJECT': {
      const exists = state.projects.some((p) => p.id === action.payload.id)
      if (!exists) return { ...state, projects: [...state.projects, action.payload] }
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.payload.id ? action.payload : p)),
      }
    }

    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.payload),
        tasks: state.tasks.filter((t) => t.projectId !== action.payload),
      }

    case 'ARCHIVE_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload ? { ...p, isArchived: true } : p,
        ),
      }

    // ── Task CRUD ────────────────────────────────────────────────────────────
    case 'ADD_TASK':
      if (state.tasks.some((t) => t.id === action.payload.id)) return state
      return { ...state, tasks: [...state.tasks, action.payload] }

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)),
      }

    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload) }

    case 'MOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id !== action.payload.taskId) return t
          const isDone = action.payload.targetStatus === 'done'
          return {
            ...t,
            status: action.payload.targetStatus,
            completedAt: isDone ? new Date().toISOString() : undefined,
          }
        }),
      }

    case 'TOGGLE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id !== action.payload.taskId) return t
          return {
            ...t,
            subtasks: t.subtasks.map((sub) =>
              sub.id === action.payload.subtaskId
                ? { ...sub, completed: !sub.completed }
                : sub,
            ),
          }
        }),
      }

    // ── Navigation ───────────────────────────────────────────────────────────
    case 'SET_ACTIVE_PROJECT':
      return {
        ...state,
        activeProjectId: action.payload,
        activeView: action.payload ? 'kanban' : 'dashboard',
      }

    case 'SET_VIEW':
      return { ...state, activeView: action.payload }

    case 'SET_ACTIVE_CLIENT':
      return {
        ...state,
        activeClientId: action.payload,
        activeProjectId: null,
        activeView: 'dashboard',
      }

    // ── Data operations ──────────────────────────────────────────────────────
    case 'IMPORT_DATA':
      return {
        ...state,
        clients: action.payload.clients,
        projects: action.payload.projects,
        tasks: action.payload.tasks,
        userProfile: action.payload.userProfile ?? state.userProfile,
        activeView: 'settings',
      }

    case 'UPDATE_PROFILE':
      return { ...state, userProfile: action.payload }

    case 'RESET_APP':
      return { ...initialState }

    default:
      return state
  }
}
