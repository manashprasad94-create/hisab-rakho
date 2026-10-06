import type { LucideIcon } from 'lucide-react'

export default function EmptyState({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle?: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={26} className="text-primary" strokeWidth={1.6} aria-hidden="true" />
      </div>
      <p className="font-semibold text-text text-base">{title}</p>
      {subtitle && <p className="text-sm text-text-muted mt-2 max-w-xs leading-relaxed">{subtitle}</p>}
    </div>
  )
}
