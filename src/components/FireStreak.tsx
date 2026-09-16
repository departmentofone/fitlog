export function FireStreak({ count, label }: { count: number; label?: string }) {
  if (count <= 0) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-400">
      {count}
      {label && <span className="font-normal text-orange-400/80">{label}</span>}
    </span>
  )
}
