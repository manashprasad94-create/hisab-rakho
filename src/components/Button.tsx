import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  children: ReactNode
  loading?: boolean
}

export default function Button({ variant = 'primary', children, className = '', loading = false, disabled, ...props }: Props) {
  return (
    <button className={`hk-button hk-button-${variant} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
