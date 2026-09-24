import { RestDayCard } from 'fitlog-design-system'

// Shown on Workouts once a rest day is logged; Undo takes it back.
export const Logged = () => (
  <div className="w-80">
    <RestDayCard onUndo={() => {}} />
  </div>
)

export const Undoing = () => (
  <div className="w-80">
    <RestDayCard onUndo={() => {}} undoing />
  </div>
)
