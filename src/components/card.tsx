import type { HTMLAttributes } from 'react'

export default function Card({ children, className = '', onClick, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          event.currentTarget.click()
        }
      } : undefined}
      className={`hk-card ${onClick ? 'hk-card-interactive' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
