import { SkeletonLine } from 'fitlog-design-system'

// Single shimmer bars; size them with height/width classes to match the text they stand in for.
export const TextBlock = () => (
  <div className="w-80 space-y-2 rounded-3xl bg-slate-900 p-4 ring-1 ring-white/5">
    <SkeletonLine className="h-4 w-1/2" />
    <SkeletonLine className="h-3 w-full" />
    <SkeletonLine className="h-3 w-2/3" />
  </div>
)
