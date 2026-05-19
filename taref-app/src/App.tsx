import './index.css'
import { useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProjectProvider, useProject } from './context/ProjectContext'
import { LoginView } from './components/auth/LoginView'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { ConnectionStatus } from './components/layout/ConnectionStatus'
import { ProjectGrid, AddProjectModal } from './components/dashboard/ProjectCard'
import { ClientPortal } from './components/dashboard/ClientPortal'
import { DataMigrator } from './components/dashboard/DataMigrator'
import { KanbanBoard } from './components/kanban/KanbanBoard'
import { TaskListView } from './components/tasks/TaskListView'
import { SettingsView } from './components/dashboard/SettingsView'
import { UserManagementView } from './components/admin/UserManagementView'
import { AcceptInviteView } from './components/auth/AcceptInviteView'
import { ToastContainer } from './components/ui/Toast'
import { Loader } from 'lucide-react'

// ─── Loading Screen ───────────────────────────────────────────────────────────

const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh',
    backgroundColor: 'hsl(var(--bg-app))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 16,
  }}>
    <Loader size={28} style={{ color: 'hsl(var(--brand-cyan))', animation: 'spin 1s linear infinite' }} />
    <p style={{
      fontSize: '12px',
      fontFamily: 'JetBrains Mono, monospace',
      color: 'hsl(var(--text-faint))',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    }}>
      Autenticando...
    </p>
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </div>
)

// ─── Inner App (requires ProjectProvider + AuthProvider in scope) ─────────────

const AppContent = () => {
  const { state } = useProject()
  const { isAdmin, isSuperAdmin } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddProject, setShowAddProject] = useState(false)

  if (!state.activeClientId) {
    return (
      <>
        <ClientPortal />
        <AddProjectModal isOpen={showAddProject} onClose={() => setShowAddProject(false)} />
        {isAdmin && <DataMigrator />}
        <ConnectionStatus />
        <ToastContainer />
      </>
    )
  }

  const isKanban = state.activeView === 'kanban' && !!state.activeClientId

  const renderView = () => {
    if (state.activeView === 'user-management') {
      if (!isSuperAdmin) return null
      return <UserManagementView />
    }
    if (state.activeView === 'settings') return <SettingsView />
    if (state.activeView === 'tasks' && state.activeClientId) return <TaskListView />
    if (isKanban) return <KanbanBoard />
    return (
      <ProjectGrid
        searchQuery={searchQuery}
        onAddProject={() => setShowAddProject(true)}
      />
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'hsl(var(--bg-app))',
      }}
    >
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddProject={() => setShowAddProject(true)}
        />

        <main
          id="main-content"
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
        >
          {renderView()}
        </main>
      </div>

      <AddProjectModal
        isOpen={showAddProject}
        onClose={() => setShowAddProject(false)}
      />

      <ConnectionStatus />
      <ToastContainer />
    </div>
  )
}

// ─── Auth Gate ────────────────────────────────────────────────────────────────

const AuthGate = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />
  if (!user) return <><LoginView /><ToastContainer /></>

  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const inviteToken = new URLSearchParams(window.location.search).get('invite')

  if (inviteToken) {
    return (
      <ThemeProvider>
        <AcceptInviteView token={inviteToken} />
        <ToastContainer />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ThemeProvider>
  )
}
