import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  children: ReactNode
  loading?: boolean
}

export default function Button({ variant = 'primary', size = 'md', children, className = '', loading = false, disabled, ...props }: Props) {
  const sizeClass = size === 'sm' ? 'hk-button-sm' : ''
  return (
    <button className={`hk-button hk-button-${variant} ${sizeClass} ${className}`.trim()} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <LoaderCircle size={size === 'sm' ? 14 : 17} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
