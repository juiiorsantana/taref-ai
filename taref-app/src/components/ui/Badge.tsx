/* eslint-disable react-refresh/only-export-components */
import type { TaskTag, PriorityLevel, ClientNiche } from '../../types'

// ─── Priority Badge ───────────────────────────────────────────────────────────

const priorityConfig: Record<PriorityLevel, { label: string; color: string }> = {
  alta:  { label: 'Alta',  color: 'hsl(var(--priority-alta))' },
  media: { label: 'Média', color: 'hsl(var(--priority-media))' },
  baixa: { label: 'Baixa', color: 'hsl(var(--priority-baixa))' },
}

export const PriorityBadge = ({ priority }: { priority: PriorityLevel }) => {
  const { label, color } = priorityConfig[priority]
  return (
    <span
      style={{
        color,
        border: `1px solid ${color}`,
        backgroundColor: `${color}18`,
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '1px 6px',
        borderRadius: 'var(--radius-sm)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

// ─── Tag Badge ────────────────────────────────────────────────────────────────

const tagConfig: Record<TaskTag, { label: string; color: string }> = {
  ads:    { label: 'Ads',    color: 'hsl(var(--tag-ads))' },
  design: { label: 'Design', color: 'hsl(var(--tag-design))' },
  copy:   { label: 'Copy',   color: 'hsl(var(--tag-copy))' },
  dev:    { label: 'Dev',    color: 'hsl(var(--tag-dev))' },
  seo:    { label: 'SEO',    color: 'hsl(var(--tag-seo))' },
}

export const TagBadge = ({ tag }: { tag: TaskTag }) => {
  const { label, color } = tagConfig[tag]
  return (
    <span
      style={{
        color,
        backgroundColor: `${color}14`,
        fontSize: '10px',
        fontWeight: 500,
        padding: '1px 5px',
        borderRadius: 'var(--radius-sm)',
        display: 'inline-block',
      }}
    >
      {label}
    </span>
  )
}

// ─── Niche Badge ──────────────────────────────────────────────────────────────

const nicheConfig: Record<ClientNiche, { label: string; icon: string; color: string }> = {
  medical: { label: 'Médico',    icon: '🩺', color: 'hsl(var(--niche-medical))' },
  dental:  { label: 'Odonto',    icon: '🦷', color: 'hsl(var(--niche-dental))' },
  legal:   { label: 'Jurídico',  icon: '⚖️', color: 'hsl(var(--niche-legal))' },
  general: { label: 'Geral',     icon: '💼', color: 'hsl(var(--niche-general))' },
}

export const NicheBadge = ({ niche }: { niche: ClientNiche }) => {
  const { label, icon } = nicheConfig[niche]
  return (
    <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
      {icon} {label}
    </span>
  )
}

export const getNicheColor = (niche: ClientNiche) => nicheConfig[niche].color
export const getNicheIcon  = (niche: ClientNiche) => nicheConfig[niche].icon
