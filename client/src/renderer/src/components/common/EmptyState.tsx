import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  dense?: boolean
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  dense = false
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        dense ? 'py-4 px-4' : 'py-12 px-6'
      } bg-bg-card/50 border border-dashed border-border-light rounded-xl`}
      role="status"
    >
      <div className="p-3 rounded-full bg-bg-tertiary mb-3">
        <Icon className="w-6 h-6 text-text-muted" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
      {description && <p className="text-xs text-text-muted max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default EmptyState
