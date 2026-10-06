export default function LoadingState({ label = 'Loading', rows = 3 }: { label?: string; rows?: number }) {
  return <div role="status" aria-label={label} className="space-y-3">
    <span className="sr-only">{label}</span>
    {Array.from({ length: rows }, (_, i) => <div key={i} className="loading-row" aria-hidden="true">
      <div className="skeleton h-10 w-10 rounded-xl" />
      <div className="flex-1 space-y-2"><div className="skeleton h-3 w-2/5 rounded" /><div className="skeleton h-3 w-3/5 rounded" /></div>
    </div>)}
  </div>
}
