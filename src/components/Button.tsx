import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  children: ReactNode
}

export default function Button({ variant = 'primary', children, className = '', ...props }: Props) {
  const base = 'py-2.5 px-4 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm',
    secondary: 'bg-white border border-primary text-primary hover:bg-primary/5',
    danger: 'bg-white border border-owe text-owe hover:bg-owe/5',
    ghost: 'text-text-muted hover:text-text',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}