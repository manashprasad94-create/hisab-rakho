import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

// Layout utilities (including padding for leading icons) stay with each field.
function layoutClasses(value = '') {
  return value.split(/\s+/).filter((name) => !/^(?:border(?:-|$)|rounded|shadow|bg-|focus:|text-(?:xs|sm|lg)|py-)/.test(name)).join(' ')
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const compact = ['checkbox', 'radio', 'file', 'hidden'].includes(props.type || '')
  return <input className={`${compact ? 'hk-native-input' : 'hk-input'} ${layoutClasses(className)}`} {...props} />
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`hk-input hk-select ${layoutClasses(className)}`} {...props} />
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`hk-input hk-textarea ${layoutClasses(className)}`} {...props} />
}
