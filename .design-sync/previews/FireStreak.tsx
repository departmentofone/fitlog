import { FireStreak } from 'fitlog-design-system'

// The orange streak pill. Workouts and Fasting say "day streak"; Diet counts days on target.
export const WorkoutStreak = () => <FireStreak count={9} label="day streak" />

export const DietStreak = () => <FireStreak count={4} label="day on-target streak" />

// As it sits in the Workouts session card: timer on the left, streak on the right.
export const InSessionCard = () => (
  <div className="flex w-80 items-center justify-between rounded-3xl bg-gradient-to-br from-emerald-600/20 to-slate-900 px-4 py-3 ring-1 ring-white/5">
    <span className="text-lg font-semibold tabular-nums text-emerald-400">1:12:06</span>
    <FireStreak count={9} label="day streak" />
  </div>
)
