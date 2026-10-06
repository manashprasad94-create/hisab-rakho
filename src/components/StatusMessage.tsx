import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import type { ReactNode } from 'react'

export default function StatusMessage({ children, tone = 'error' }: {
  children: ReactNode; tone?: 'error' | 'success' | 'info'
}) {
  const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info
  return <div className={`status-message status-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
    <Icon size={18} aria-hidden="true" className="shrink-0 mt-0.5" />
    <div className="min-w-0">{children}</div>
  </div>
}
