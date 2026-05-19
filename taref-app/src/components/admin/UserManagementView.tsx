import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Users, Mail, FolderLock } from 'lucide-react'
import { UsersTab } from './tabs/UsersTab'
import { InvitationsTab } from './tabs/InvitationsTab'
import { ProjectAccessTab } from './tabs/ProjectAccessTab'

type Tab = 'users' | 'invitations' | 'access'

export const UserManagementView = () => {
  const { isSuperAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('users')

  if (!isSuperAdmin) return null

  return (
    <div style={{ padding: '32px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, hsl(var(--brand-amber)), hsl(var(--brand-cyan)))',
          borderRadius: 'var(--radius-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Users size={18} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Painel Super Admin
          </h1>
          <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--text-faint))' }}>
            Gerenciamento de usuários, convites e permissões de projetos
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 4,
        borderBottom: '1px solid hsl(var(--border-subtle))',
        marginBottom: 20,
      }}>
        <TabButton
          icon={<Users size={13} />}
          label="Usuários"
          active={activeTab === 'users'}
          onClick={() => setActiveTab('users')}
        />
        <TabButton
          icon={<Mail size={13} />}
          label="Convites"
          active={activeTab === 'invitations'}
          onClick={() => setActiveTab('invitations')}
        />
        <TabButton
          icon={<FolderLock size={13} />}
          label="Acesso a Projetos"
          active={activeTab === 'access'}
          onClick={() => setActiveTab('access')}
        />
      </div>

      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'invitations' && <InvitationsTab />}
      {activeTab === 'access' && <ProjectAccessTab />}
    </div>
  )
}

const TabButton = ({
  icon, label, active, onClick,
}: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '10px 14px',
      background: 'transparent',
      border: 'none',
      borderBottom: active ? '2px solid hsl(var(--brand-cyan))' : '2px solid transparent',
      color: active ? 'hsl(var(--brand-cyan))' : 'hsl(var(--text-muted))',
      fontSize: '13px',
      fontWeight: active ? 600 : 500,
      cursor: 'pointer',
      marginBottom: -1,
      transition: 'all var(--duration-fast)',
    }}
  >
    {icon}
    {label}
  </button>
)
