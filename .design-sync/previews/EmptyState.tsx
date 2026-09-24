import { EmptyState } from 'fitlog-design-system'

// Each variant with the message FitLog shows for it.
export const Trophy = () => (
  <div className="w-80">
    <EmptyState variant="trophy" message="Set a lift to hit, or anything else you're working toward." />
  </div>
)

export const Calendar = () => (
  <div className="w-80">
    <EmptyState variant="calendar" message="No fasts logged yet - finish one above and it'll show up here." />
  </div>
)

export const List = () => (
  <div className="w-80">
    <EmptyState variant="list" message="No presets yet — make one above." />
  </div>
)

export const Folder = () => (
  <div className="w-80">
    <EmptyState variant="folder" message="Nothing matches that search." />
  </div>
)

export const Dumbbell = () => (
  <div className="w-80">
    <EmptyState variant="dumbbell" message="No sets logged this day." />
  </div>
)
