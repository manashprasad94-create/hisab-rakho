import type { LucideIcon } from 'lucide-react'

export default function EmptyState({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
        <Icon size={24} className="text-primary" strokeWidth={1.5} />
      </div>
      <p className="font-medium text-text">{title}</p>
      {subtitle && <p className="text-sm text-text-muted mt-1 max-w-xs">{subtitle}</p>}
    </div>
  )
}