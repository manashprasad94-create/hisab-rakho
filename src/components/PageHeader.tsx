import type { ReactNode } from 'react'

export default function PageHeader({ title, description, children }: {
  title: ReactNode; description?: string; children?: ReactNode
}) {
  return <header className="page-header">
    <div className="min-w-0">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {children}
  </header>
}
