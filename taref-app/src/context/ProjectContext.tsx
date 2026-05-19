/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { AppState, ProjectAction } from '../types'
import type { Database } from '../types/database'
import {
  supabase,
  dbClientToApp,
  dbProjectToApp,
  dbTaskToApp,
  dbProfileToApp,
} from '../utils/supabaseClient'
import { api } from '../services/api'
import { useAuth } from './AuthContext'
import { showToast } from '../components/ui/Toast'
import { initialState, projectReducer } from './projectReducer'

type DbClient = Database['public']['Tables']['clients']['Row']
type DbProject = Database['public']['Tables']['projects']['Row']
type DbTask = Database['public']['Tables']['tasks']['Row']



// ─── Context ──────────────────────────────────────────────────────────────────

interface ProjectContextValue {
  state: AppState
  dispatch: React.Dispatch<ProjectAction>
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth()
  const [state, dispatch] = useReducer(projectReducer, initialState)
  const stateRef = useRef(state)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => { stateRef.current = state }, [state])

  // ── Load from Supabase on auth ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'RESET_APP' })
      return
    }

    let cancelled = false

    const loadData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const [clients, projects, tasks] = await Promise.all([
          api.clients.list(),
          api.projects.list(),
          api.tasks.list(),
        ])

        if (cancelled) return

        dispatch({
          type: 'SET_INITIAL_STATE',
          payload: {
            clients: (clients ?? []).map(dbClientToApp),
            projects: (projects ?? []).map(dbProjectToApp),
            tasks: (tasks ?? []).map(dbTaskToApp),
            isLoading: false,
          },
        })

        const sessionClientId = sessionStorage.getItem('taref_active_client')
        if (sessionClientId) {
          dispatch({ type: 'SET_ACTIVE_CLIENT', payload: sessionClientId })
        }
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[loadData] falhou', msg)
        showToast(`Erro ao carregar dados: ${msg}`, 'error')
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [user?.id])

  // ── Sync userProfile when profile arrives from auth ──────────────────────────
  useEffect(() => {
    if (!profile || !user) return
    dispatch({
      type: 'UPDATE_PROFILE',
      payload: dbProfileToApp(profile, user.email ?? ''),
    })
  }, [profile, user?.email])

  // ── Realtime subscriptions ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('public:tarefai:changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          dispatch({ type: 'UPDATE_CLIENT', payload: dbClientToApp(payload.new as DbClient) })
        } else if (payload.eventType === 'DELETE') {
          dispatch({ type: 'DELETE_CLIENT', payload: (payload.old as { id: string }).id })
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          dispatch({ type: 'UPDATE_PROJECT', payload: dbProjectToApp(payload.new as DbProject) })
        } else if (payload.eventType === 'DELETE') {
          dispatch({ type: 'DELETE_PROJECT', payload: (payload.old as { id: string }).id })
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          dispatch({ type: 'UPDATE_TASK', payload: dbTaskToApp(payload.new as DbTask) })
        } else if (payload.eventType === 'DELETE') {
          dispatch({ type: 'DELETE_TASK', payload: (payload.old as { id: string }).id })
        }
      })
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [user])

  // ── Persist active client ID to sessionStorage ───────────────────────────────
  useEffect(() => {
    if (state.activeClientId) {
      sessionStorage.setItem('taref_active_client', state.activeClientId)
    } else {
      sessionStorage.removeItem('taref_active_client')
    }
  }, [state.activeClientId])

  // ── Supabase sync (fire-and-forget after optimistic dispatch) ────────────────
  const syncToSupabase = useCallback(
    async (action: ProjectAction, prevState: AppState): Promise<void> => {
      if (!user) {
        console.warn('[Supabase sync] abortado — user é null para ação:', action.type)
        return
      }
      try {
        switch (action.type) {
          case 'ADD_CLIENT':
            await api.clients.create(action.payload, user.id)
            break
          case 'UPDATE_CLIENT':
            await api.clients.update(action.payload)
            break
          case 'DELETE_CLIENT':
            await api.clients.delete(action.payload)
            break
          case 'ARCHIVE_CLIENT':
            await api.clients.archive(action.payload)
            break
          case 'ADD_PROJECT':
            await api.projects.create(action.payload, user.id)
            break
          case 'UPDATE_PROJECT':
            await api.projects.update(action.payload)
            break
          case 'DELETE_PROJECT':
            await api.projects.delete(action.payload)
            break
          case 'ARCHIVE_PROJECT':
            await api.projects.archive(action.payload)
            break
          case 'ADD_TASK':
            await api.tasks.create(action.payload)
            break
          case 'UPDATE_TASK':
            await api.tasks.update(action.payload)
            break
          case 'DELETE_TASK':
            await api.tasks.delete(action.payload)
            break
          case 'MOVE_TASK':
            await api.tasks.move(action.payload.taskId, action.payload.targetStatus)
            break
          case 'TOGGLE_SUBTASK': {
            const task = stateRef.current.tasks.find((t) => t.id === action.payload.taskId)
            if (!task) break
            const newSubtasks = task.subtasks.map((sub) =>
              sub.id === action.payload.subtaskId ? { ...sub, completed: !sub.completed } : sub,
            )
            await api.tasks.setSubtasks(action.payload.taskId, newSubtasks)
            break
          }
          default:
            break;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[Supabase sync]', action.type, msg)
        if (action.type === 'ADD_CLIENT') {
          dispatch({ type: 'DELETE_CLIENT', payload: action.payload.id })
          showToast(`Erro ao criar cliente: ${msg}`, 'error')
        } else if (action.type === 'ADD_PROJECT') {
          dispatch({ type: 'DELETE_PROJECT', payload: action.payload.id })
          showToast(`Erro ao criar projeto: ${msg}`, 'error')
        } else if (action.type === 'MOVE_TASK') {
          const prevTask = prevState.tasks.find((t) => t.id === action.payload.taskId)
          if (prevTask) {
            dispatch({ type: 'MOVE_TASK', payload: { taskId: prevTask.id, targetStatus: prevTask.status } })
          }
          showToast('Erro ao mover tarefa', 'error')
        } else {
          showToast('Erro ao sincronizar com a nuvem', 'error')
        }
      }
    },
    [user, dispatch],
  )

  const dispatchWithSync = useCallback(
    (action: ProjectAction) => {
      const prevState = stateRef.current
      dispatch(action)
      syncToSupabase(action, prevState)
    },
    [syncToSupabase],
  )

  return (
    <ProjectContext.Provider value={{ state, dispatch: dispatchWithSync }}>
      {children}
    </ProjectContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useProject = (): ProjectContextValue => {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}
