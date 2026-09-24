import { TabIcon } from 'fitlog-design-system'

const TABS = ['workouts', 'meals', 'scanner', 'diet', 'fasting', 'goals', 'history', 'achievements', 'programs', 'foods', 'community', 'calculator'] as const

// Every section's icon, as the More menu shows them.
export const AllIcons = () => (
  <div className="grid w-80 grid-cols-4 gap-2">
    {TABS.map((t) => (
      <div key={t} className="flex flex-col items-center gap-1 rounded-2xl bg-slate-900 py-3 text-slate-300 ring-1 ring-white/5">
        <TabIcon tab={t} className="h-5 w-5" />
        <span className="text-[10px] font-semibold capitalize">{t}</span>
      </div>
    ))}
  </div>
)

// The bottom bar: active tab in the accent, others muted.
export const BottomBar = () => (
  <div className="flex w-80 gap-1 border-t border-white/10 bg-slate-950/60 px-2 pt-1">
    {(['workouts', 'meals', 'more'] as const).map((t, i) => (
      <div
        key={t}
        className={`my-1 flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-semibold ${
          i === 0 ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-500'
        }`}
      >
        <TabIcon tab={t} />
        <span className="capitalize">{t}</span>
      </div>
    ))}
  </div>
)
