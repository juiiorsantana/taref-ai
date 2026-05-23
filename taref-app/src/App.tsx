import './index.css'
import { useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProjectProvider, useProject } from './context/ProjectContext'
import { LoginView } from './components/auth/LoginView'
import { AdminLoginPage } from './components/auth/AdminLoginPage'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { ConnectionStatus } from './components/layout/ConnectionStatus'
import { ProjectGrid, AddProjectModal } from './components/dashboard/ProjectCard'
import { ClientPortal } from './components/dashboard/ClientPortal'
import { DataMigrator } from './components/dashboard/DataMigrator'
import { KanbanBoard } from './components/kanban/KanbanBoard'
import { TaskListView } from './components/tasks/TaskListView'
import { GlobalTasksView } from './components/tasks/GlobalTasksView'
import { GlobalDashboardView } from './components/dashboard/GlobalDashboardView'
import { ImportMdModal } from './components/dashboard/ImportMdModal'
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
  const [showImportMd, setShowImportMd] = useState(false)

  // Redirect to ClientPortal only when no client is selected AND we're not in global (Major Hub) mode
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

  const isGlobalMode = state.activeClientId === 'global'

  const renderView = () => {
    if (state.activeView === 'user-management') {
      if (!isSuperAdmin) return null
      return <UserManagementView />
    }
    if (state.activeView === 'settings') return <SettingsView />

    if (isGlobalMode) {
      if (state.activeView === 'dashboard') return <GlobalDashboardView searchQuery={searchQuery} />
      if (state.activeView === 'kanban') return <KanbanBoard />
      if (state.activeView === 'tasks') return <GlobalTasksView searchQuery={searchQuery} />
    }

    if (state.activeView === 'tasks' && state.activeClientId) return <TaskListView />
    if (state.activeView === 'kanban' && !!state.activeClientId) return <KanbanBoard />
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
          onImportMd={() => setShowImportMd(true)}
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

      <ImportMdModal
        isOpen={showImportMd}
        onClose={() => setShowImportMd(false)}
      />

      <ConnectionStatus />
      <ToastContainer />
    </div>
  )
}

// ─── Access Denied Screen ─────────────────────────────────────────────────────

const AccessDenied = () => (
  <div style={{
    minHeight: '100vh',
    backgroundColor: 'hsl(var(--bg-app))',
    backgroundImage:
      'linear-gradient(hsl(var(--border-subtle) / 0.2) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border-subtle) / 0.2) 1px, transparent 1px)',
    backgroundSize: '48px 48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  }}>
    <div style={{ textAlign: 'center', maxWidth: 360 }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 72,
        fontWeight: 900,
        color: 'hsl(var(--border-subtle))',
        lineHeight: 1,
        marginBottom: 16,
        letterSpacing: '-0.04em',
      }}>404</div>
      <h2 style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 14,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'hsl(var(--text-muted))',
        marginBottom: 24,
      }}>Página não encontrada</h2>
      <a
        href="/admin"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          background: 'hsl(var(--brand-cyan))',
          border: '2px solid hsl(var(--text-primary))',
          boxShadow: '4px 4px 0 hsl(var(--text-primary))',
          color: 'hsl(220 25% 6%)',
          fontWeight: 800,
          fontSize: 11,
          textDecoration: 'none',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        Ir para /admin
      </a>
    </div>
  </div>
)

// ─── Auth Gate ────────────────────────────────────────────────────────────────

const AuthGate = () => {
  const { user, isLoading } = useAuth()
  const isAdminRoute = window.location.pathname === '/admin'

  if (isLoading) return <LoadingScreen />

  if (!user) {
    if (isAdminRoute) return <><AdminLoginPage /><ToastContainer /></>
    return <><AccessDenied /><ToastContainer /></>
  }

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
