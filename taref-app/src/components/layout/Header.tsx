import { Search, Plus, ChevronLeft, LogOut } from 'lucide-react'
import { useProject } from '../../context/ProjectContext'
import { useAuth } from '../../context/AuthContext'

interface HeaderProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  onAddProject: () => void
}

export const Header = ({ searchQuery, onSearchChange, onAddProject }: HeaderProps) => {
  const { state, dispatch } = useProject()
  const { signOut } = useAuth()
  const activeProject = state.projects.find((p) => p.id === state.activeProjectId)
  const activeClient = state.clients.find((c) => c.id === state.activeClientId)
  const isKanban = state.activeView === 'kanban' && !!state.activeClientId

  return (
    <header
      style={{
        height: 52,
        flexShrink: 0,
        background: 'hsl(var(--bg-surface))',
        borderBottom: '1px solid hsl(var(--border-subtle))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
      }}
    >
      {/* Left / Center content */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        {isKanban ? (
          <>
            <button
              onClick={() => dispatch({ type: 'SET_ACTIVE_PROJECT', payload: null })}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none',
                color: 'hsl(var(--text-muted))', cursor: 'pointer',
                fontSize: '12px', padding: '4px 6px',
                borderRadius: 'var(--radius-sm)',
                transition: 'color var(--duration-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--text-primary))')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--text-muted))')}
            >
              <ChevronLeft size={14} />
              Dashboard
            </button>
            <div style={{ width: 1, height: 16, background: 'hsl(var(--border-subtle))' }} />
            {activeProject ? (
              <>
                <div
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: activeProject.color, flexShrink: 0,
                  }}
                />
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{activeProject.name}</span>
                  <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginLeft: 8 }}>
                    {activeClient?.name}
                  </span>
                </div>
              </>
            ) : (
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{activeClient?.name}</span>
                <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginLeft: 8 }}>
                  Todas as tarefas
                </span>
              </div>
            )}
          </>
        ) : (
          /* Search bar */
          <div style={{
            flex: 1, maxWidth: 360, display: 'flex', alignItems: 'center', gap: 8,
            background: 'hsl(var(--bg-input))',
            border: '1px solid hsl(var(--border-subtle))',
            borderRadius: 'var(--radius-sm)',
            padding: '0 10px', height: 32,
          }}>
            <Search size={13} style={{ color: 'hsl(var(--text-faint))', flexShrink: 0 }} />
            <input
              type="search"
              id="project-search"
              placeholder="Buscar projetos ou clientes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                background: 'none', border: 'none', outline: 'none',
                fontSize: '13px', color: 'hsl(var(--text-primary))',
                width: '100%',
              }}
              aria-label="Buscar projetos"
            />
          </div>
        )}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {!isKanban && (
          <button
            id="add-project-btn"
            onClick={onAddProject}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'hsl(var(--brand-cyan))',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'hsl(220 25% 6%)',
              fontSize: '12px', fontWeight: 700,
              padding: '6px 12px', cursor: 'pointer',
              transition: 'opacity var(--duration-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Plus size={13} />
            Novo Projeto
          </button>
        )}

        <div style={{ width: 1, height: 16, background: 'hsl(var(--border-subtle))' }} />

        {/* Logout */}
        <button
          onClick={() => signOut()}
          title="Sair"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28,
            background: 'none', border: '1px solid transparent',
            borderRadius: '2px', cursor: 'pointer',
            color: 'hsl(var(--text-faint))',
            transition: 'all var(--duration-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'hsl(var(--brand-rose))'
            e.currentTarget.style.borderColor = 'hsl(var(--brand-rose) / 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'hsl(var(--text-faint))'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          <LogOut size={13} />
        </button>

        {/* Header Right Profile Avatar (Point of Entry B) */}
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', payload: 'settings' })}
          style={{
            width: 28,
            height: 28,
            background: `hsl(${state.userProfile.avatarColor})`,
            color: '#fff',
            fontSize: '10px',
            fontWeight: 800,
            fontFamily: 'JetBrains Mono, monospace',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '2px',
            border: state.activeView === 'settings' ? '1px solid hsl(var(--brand-cyan))' : '1px solid transparent',
            cursor: 'pointer',
            padding: 0,
            boxShadow: 'var(--shadow-card)',
            transition: 'all var(--duration-fast) var(--ease-out)',
          }}
          onMouseEnter={(e) => {
            if (state.activeView !== 'settings') {
              e.currentTarget.style.borderColor = 'hsl(var(--border-active) / 0.5)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            if (state.activeView !== 'settings') {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.transform = 'none'
            }
          }}
        >
          {state.userProfile.avatarInitials}
        </button>
      </div>
    </header>
  )
}
