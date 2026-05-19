// ─── Primitive Enums ─────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin' | 'super_admin'

export type PriorityLevel = 'baixa' | 'media' | 'alta'

export type TaskStatus = 'todo' | 'doing' | 'done'

export type ClientNiche = 'medical' | 'dental' | 'legal' | 'general'

export type ProjectStatus = 'em_andamento' | 'pausado' | 'concluido'

export type TaskTag = 'ads' | 'design' | 'copy' | 'dev' | 'seo'

// ─── Sub-entities ─────────────────────────────────────────────────────────────

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

// ─── Core Domain Models ───────────────────────────────────────────────────────

export interface Client {
  id: string
  name: string
  niche: ClientNiche
  color: string
  description?: string
  clientSlug: string
  clientEmail: string
  isArchived: boolean
  createdAt: string
}

export interface Project {
  id: string
  clientId: string
  name: string
  color: string
  description?: string
  isArchived: boolean
  createdAt: string
  status?: ProjectStatus
}

export interface Task {
  id: string
  projectId: string
  title: string
  responsible: string
  deadline?: string
  priority: PriorityLevel
  notes?: string
  status: TaskStatus
  tags: TaskTag[]
  subtasks: SubTask[]
  createdAt: string
  completedAt?: string
}

// ─── Backup Schema ────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string
  email: string
  jobTitle: string
  avatarColor: string
  avatarInitials: string
  role?: UserRole
}

export interface BackupData {
  version: string
  exportedAt: string
  clients: Client[]
  projects: Project[]
  tasks: Task[]
  userProfile?: UserProfile
}

// ─── App State ────────────────────────────────────────────────────────────────

export interface AppState {
  clients: Client[]
  projects: Project[]
  tasks: Task[]
  activeView: 'dashboard' | 'kanban' | 'tasks' | 'settings' | 'user-management'
  activeProjectId: string | null
  activeClientId: string | null
  userProfile: UserProfile
  isLoading: boolean
}

// ─── Reducer Actions ──────────────────────────────────────────────────────────

export type ProjectAction =
  | { type: 'SET_INITIAL_STATE'; payload: { clients: Client[]; projects: Project[]; tasks: Task[]; userProfile?: UserProfile; isLoading?: boolean } }
  | { type: 'SET_LOADING'; payload: boolean }
  // Client CRUD
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'ARCHIVE_CLIENT'; payload: string }
  // Project CRUD
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ARCHIVE_PROJECT'; payload: string }
  // Task CRUD
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'MOVE_TASK'; payload: { taskId: string; targetStatus: TaskStatus } }
  | { type: 'TOGGLE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  // Navigation
  | { type: 'SET_ACTIVE_PROJECT'; payload: string | null }
  | { type: 'SET_VIEW'; payload: 'dashboard' | 'kanban' | 'tasks' | 'settings' | 'user-management' }
  | { type: 'SET_ACTIVE_CLIENT'; payload: string | null }
  // Data
  | { type: 'IMPORT_DATA'; payload: { clients: Client[]; projects: Project[]; tasks: Task[]; userProfile?: UserProfile } }
  | { type: 'UPDATE_PROFILE'; payload: UserProfile }
  | { type: 'RESET_APP' }
