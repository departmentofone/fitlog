import { CountUp } from 'fitlog-design-system'

// Big numbers animate up (~600ms) when they change. durationMs={0} here only so the preview card shows
// the settled value; leave it out in real screens. From the History tab's "Your week" card.
export const WeekStats = () => (
  <div className="grid w-80 grid-cols-2 gap-3">
    <div className="rounded-2xl bg-slate-800/60 p-3">
      <p className="text-3xl font-bold text-white">
        <CountUp value={31255} format={(n) => Math.round(n).toLocaleString()} durationMs={0} />
      </p>
      <p className="text-xs text-slate-400">kg moved</p>
    </div>
    <div className="rounded-2xl bg-slate-800/60 p-3">
      <p className="text-3xl font-bold text-blue-400">
        <CountUp value={97} suffix="g" durationMs={0} />
      </p>
      <p className="text-xs text-slate-400">avg protein/day</p>
    </div>
  </div>
)

// Calories eaten, as on the Diet tab.
export const Calories = () => (
  <p className="text-sm text-slate-400">
    <span className="font-semibold text-white">
      <CountUp value={1333} durationMs={0} /> kcal
    </span>{' '}
    eaten
  </p>
)
