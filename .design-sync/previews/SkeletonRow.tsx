import { SkeletonRow } from 'fitlog-design-system'

// List rows while a list (presets, diets, foods) loads.
export const LoadingList = () => (
  <div className="w-80 space-y-2 rounded-3xl bg-slate-900 p-4 ring-1 ring-white/5">
    <SkeletonRow />
    <SkeletonRow />
    <SkeletonRow />
  </div>
)
