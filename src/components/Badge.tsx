import type { ReactNode } from 'react'

export default function Badge({ children, tone = 'neutral' }: {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'error' | 'pending'
}) {
  return <span className={`hk-badge hk-badge-${tone}`}>{children}</span>
}
