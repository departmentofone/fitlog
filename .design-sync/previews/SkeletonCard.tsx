import { SkeletonCard } from 'fitlog-design-system'

// Shimmering placeholder cards while a screen loads - sized like the card that's coming.
export const Loading = () => (
  <div className="w-80 space-y-3">
    <SkeletonCard lines={2} />
    <SkeletonCard lines={3} />
  </div>
)
