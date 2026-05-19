import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = ({ label, error, id, className = '', ...props }: InputProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && (
      <label
        htmlFor={id}
        style={{ fontSize: '12px', fontWeight: 500, color: 'hsl(var(--text-muted))' }}
      >
        {label}
      </label>
    )}
    <input
      id={id}
      className={className}
      style={{
        background: 'hsl(var(--bg-input))',
        border: `1px solid ${error ? 'hsl(var(--brand-rose))' : 'hsl(var(--border-subtle))'}`,
        borderRadius: 'var(--radius-sm)',
        color: 'hsl(var(--text-primary))',
        fontSize: '13px',
        padding: '8px 10px',
        outline: 'none',
        width: '100%',
        transition: 'border-color var(--duration-fast)',
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border-active))' }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = error
          ? 'hsl(var(--brand-rose))'
          : 'hsl(var(--border-subtle))'
      }}
      {...props}
    />
    {error && (
      <span style={{ fontSize: '11px', color: 'hsl(var(--brand-rose))' }}>{error}</span>
    )}
  </div>
)
