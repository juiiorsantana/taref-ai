import { LayoutDashboard, Kanban, ListTodo, Zap, ChevronDown, LogOut, Settings, Users } from 'lucide-react'
import { useProject } from '../../context/ProjectContext'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

export const Sidebar = () => {
  const { state, dispatch } = useProject()
  const { isSuperAdmin } = useAuth()
  const [showSwitcher, setShowSwitcher] = useState(false)

  const activeClient = state.clients.find((c) => c.id === state.activeClientId)
  const otherClients = state.clients.filter((c) => !c.isArchived && c.id !== state.activeClientId)

  const handleSwitchClient = (clientId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_CLIENT', payload: clientId })
    setShowSwitcher(false)
  }

  const activeCount  = state.tasks.filter((t) => t.status !== 'done').length
  const overdueCount = state.tasks.filter((t) => {
    if (!t.deadline || t.status === 'done') return false
    return new Date(t.deadline) < new Date()
  }).length

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        background: 'hsl(var(--bg-surface))',
        borderRight: '1px solid hsl(var(--border-subtle))',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid hsl(var(--border-subtle))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, hsl(var(--brand-blue)), hsl(var(--brand-cyan)))',
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={14} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.03em' }}>
              Taref<span style={{ color: 'hsl(var(--brand-cyan))' }}>.ai</span>
            </div>
            <div style={{ fontSize: '10px', color: 'hsl(var(--text-faint))', letterSpacing: '0.05em' }}>
              MAJOR AGENCY
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        <p style={{
          fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em',
          color: 'hsl(var(--text-faint))', textTransform: 'uppercase',
          padding: '0 8px 8px',
        }}>
          Navegação
        </p>
        <NavItem
          icon={<LayoutDashboard size={14} />}
          label="Dashboard"
          isActive={state.activeView === 'dashboard'}
          onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}
        />
        {state.activeClientId && (
          <NavItem
            icon={<Kanban size={14} />}
            label="Kanban"
            isActive={state.activeView === 'kanban'}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'kanban' })}
          />
        )}
        {state.activeClientId && (
          <NavItem
            icon={<ListTodo size={14} />}
            label="Tarefas"
            isActive={state.activeView === 'tasks'}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'tasks' })}
          />
        )}
        {isSuperAdmin && (
          <NavItem
            icon={<Users size={14} />}
            label="Usuários"
            isActive={state.activeView === 'user-management'}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'user-management' })}
          />
        )}

        {/* Quick stats */}
        <div style={{ margin: '16px 0', padding: '0 8px' }}>
          <div style={{ height: '1px', background: 'hsl(var(--border-subtle))' }} />
        </div>

        <p style={{
          fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em',
          color: 'hsl(var(--text-faint))', textTransform: 'uppercase',
          padding: '0 8px 8px',
        }}>
          Status
        </p>

        <StatRow label="Tarefas ativas" value={activeCount} color="hsl(var(--brand-cyan))" />
        {overdueCount > 0 && (
          <StatRow label="Atrasadas" value={overdueCount} color="hsl(var(--brand-rose))" pulse />
        )}
        <StatRow label="Projetos" value={state.projects.filter((p) => !p.isArchived).length} color="hsl(var(--brand-amber))" />
      </nav>

      {/* Client Switcher */}
      {activeClient && (
        <div style={{
          padding: '8px 10px',
          borderTop: '1px solid hsl(var(--border-subtle))',
          position: 'relative',
        }}>
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 10px',
              backgroundColor: 'hsl(var(--bg-elevated))',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: '2px',
              color: 'hsl(var(--text-primary))',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
              <div style={{
                width: 8, height: 8,
                backgroundColor: activeClient.color || 'hsl(var(--brand-cyan))',
                borderRadius: '50%',
                flexShrink: 0,
              }} />
              <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {activeClient.name}
              </span>
            </div>
            <ChevronDown size={14} style={{
              transform: showSwitcher ? 'rotate(180deg)' : 'none',
              transition: 'transform var(--duration-fast)',
              flexShrink: 0,
            }} />
          </button>

          {showSwitcher && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 4px)',
              left: 10,
              right: 10,
              backgroundColor: 'hsl(var(--bg-elevated))',
              border: '2px solid hsl(var(--border-subtle))',
              borderRadius: '2px',
              zIndex: 100,
              boxShadow: 'var(--shadow-elevated)',
              padding: '4px 0',
            }}>
              <p style={{
                fontSize: '9px', fontWeight: 600, textTransform: 'uppercase',
                color: 'hsl(var(--text-faint))', padding: '6px 10px 4px', margin: 0,
              }}>
                Alternar Cliente
              </p>

              {otherClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSwitchClient(client.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'hsl(var(--text-muted))',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'hsl(var(--bg-surface))')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{
                    width: 6, height: 6,
                    backgroundColor: client.color || 'hsl(var(--text-faint))',
                    borderRadius: '50%', flexShrink: 0,
                  }} />
                  {client.name}
                </button>
              ))}

              <div style={{ height: 1, backgroundColor: 'hsl(var(--border-subtle))', margin: '4px 0' }} />

              <button
                onClick={() => handleSwitchClient(null)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'hsl(var(--brand-rose))',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: 500,
                }}
              >
                <LogOut size={12} />
                <span>Voltar ao Portal</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* User Profile Card */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid hsl(var(--border-subtle))',
      }}>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', payload: 'settings' })}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px',
            background: state.activeView === 'settings' ? 'hsl(var(--brand-cyan) / 0.08)' : 'none',
            border: state.activeView === 'settings' ? '1px solid hsl(var(--brand-cyan) / 0.2)' : '1px solid transparent',
            borderRadius: '2px',
            cursor: 'pointer',
            textAlign: 'left',
            color: 'hsl(var(--text-primary))',
            transition: 'all var(--duration-fast) var(--ease-out)',
          }}
          onMouseEnter={(e) => {
            if (state.activeView !== 'settings') {
              e.currentTarget.style.background = 'hsl(var(--bg-elevated))'
              e.currentTarget.style.borderColor = 'hsl(var(--border-subtle))'
            }
          }}
          onMouseLeave={(e) => {
            if (state.activeView !== 'settings') {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.borderColor = 'transparent'
            }
          }}
        >
          <div style={{
            width: 32,
            height: 32,
            background: `hsl(${state.userProfile.avatarColor})`,
            color: '#fff',
            fontSize: '11px',
            fontWeight: 800,
            fontFamily: 'JetBrains Mono, monospace',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '2px',
            flexShrink: 0,
            boxShadow: 'var(--shadow-card)',
          }}>
            {state.userProfile.avatarInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              color: state.activeView === 'settings' ? 'hsl(var(--brand-cyan))' : 'hsl(var(--text-primary))',
            }}>
              {state.userProfile.name}
            </span>
            <span style={{
              fontSize: '10px',
              color: 'hsl(var(--text-muted))',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}>
              {state.userProfile.jobTitle}
            </span>
          </div>
          <Settings size={14} style={{
            color: state.activeView === 'settings' ? 'hsl(var(--brand-cyan))' : 'hsl(var(--text-faint))',
            flexShrink: 0,
          }} />
        </button>
      </div>
    </aside>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const NavItem = ({
  icon, label, isActive, onClick,
}: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 8px', borderRadius: 'var(--radius-sm)',
      background: isActive ? 'hsl(var(--brand-cyan) / 0.12)' : 'none',
      border: isActive ? '1px solid hsl(var(--brand-cyan) / 0.25)' : '1px solid transparent',
      color: isActive ? 'hsl(var(--brand-cyan))' : 'hsl(var(--text-muted))',
      fontSize: '13px', fontWeight: isActive ? 600 : 400,
      cursor: 'pointer', textAlign: 'left',
      transition: 'all var(--duration-fast)',
    }}
  >
    {icon}
    {label}
  </button>
)

const StatRow = ({
  label, value, color, pulse,
}: { label: string; value: number; color: string; pulse?: boolean }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '5px 8px',
  }}>
    <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>{label}</span>
    <span
      className={pulse ? 'overdue-blink' : ''}
      style={{
        fontSize: '12px', fontWeight: 700, color,
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {value}
    </span>
  </div>
)
