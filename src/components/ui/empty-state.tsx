import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon:        LucideIcon
  title:       string
  description?: string
  action?:     React.ReactNode
  className?:  string
  size?:       'sm' | 'md' | 'lg'
}

const SIZE_CONFIG = {
  sm: { icon: 32, title: 'text-sm',  desc: 'text-xs',  gap: 'gap-2',  py: 'py-8'  },
  md: { icon: 48, title: 'text-base', desc: 'text-sm', gap: 'gap-3',  py: 'py-12' },
  lg: { icon: 64, title: 'text-lg',  desc: 'text-sm',  gap: 'gap-4',  py: 'py-16' },
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  size = 'md',
}: EmptyStateProps) {
  const cfg = SIZE_CONFIG[size]

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${cfg.py} ${cfg.gap} ${className}`}
    >
      {/* Icon container with soft glow */}
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{
          width:           cfg.icon * 1.8,
          height:          cfg.icon * 1.8,
          backgroundColor: 'rgba(74,195,178,0.08)',
          border:          '1px dashed rgba(74,195,178,0.25)',
        }}
      >
        <Icon
          style={{ width: cfg.icon * 0.6, height: cfg.icon * 0.6, color: '#4AC3B2', opacity: 0.7 }}
        />
      </div>

      <div className="flex flex-col items-center gap-1 max-w-xs">
        <p
          className={`font-semibold text-slate-600 ${cfg.title}`}
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          {title}
        </p>
        {description && (
          <p className={`text-slate-400 leading-relaxed ${cfg.desc}`}>
            {description}
          </p>
        )}
      </div>

      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

// ── Tabla vacía (wrapper para usar dentro de <tbody>) ─────────────────────────

interface EmptyTableRowProps {
  cols:     number
  icon:     LucideIcon
  title:    string
  description?: string
}

export function EmptyTableRow({ cols, icon, title, description }: EmptyTableRowProps) {
  return (
    <tr>
      <td colSpan={cols} className="py-0">
        <EmptyState icon={icon} title={title} description={description} size="sm" />
      </td>
    </tr>
  )
}
