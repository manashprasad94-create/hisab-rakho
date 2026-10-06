export default function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' }
  const initial = name?.[0]?.toUpperCase() || '?'
  const colors = [
    'avatar-ink',
    'avatar-sand',
    'avatar-slate',
    'avatar-lilac',
    'avatar-stone',
  ]
  const colorIndex = (name?.charCodeAt(0) || 0) % colors.length

  return (
    <div aria-hidden="true" className={`${sizes[size]} ${colors[colorIndex]} hk-avatar rounded-xl flex items-center justify-center font-semibold shrink-0`}>
      {initial}
    </div>
  )
}
