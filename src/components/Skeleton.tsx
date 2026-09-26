export function SkeletonLine({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} />
}

/** A glass-card-shaped placeholder matching the app's own card treatment, so loading states
 * don't jump the layout once real content (in the same shape) arrives. */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card p-4">
      <SkeletonLine className="mb-3 h-4 w-1/3" />
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <SkeletonLine key={i} className={i === lines - 1 ? 'h-3 w-2/3' : 'h-3 w-full'} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 px-3 py-2.5">
      <SkeletonLine className="h-3.5 flex-1" />
      <SkeletonLine className="h-3.5 w-10" />
    </div>
  )
}
