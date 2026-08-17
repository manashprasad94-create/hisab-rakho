export default function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' }
  const initial = name?.[0]?.toUpperCase() || '?'
  const colors = [
    'bg-teal-100 text-teal-700',
    'bg-orange-100 text-orange-700',
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-rose-100 text-rose-700',
  ]
  const colorIndex = (name?.charCodeAt(0) || 0) % colors.length

  return (
    <div className={`${sizes[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center font-semibold shrink-0`}>
      {initial}
    </div>
  )
}