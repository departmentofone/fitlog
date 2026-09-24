import { CircularProgress, FireStreak, FitLogTheme, MacroLine } from 'fitlog-design-system'

// Wrap a whole screen once. Inside: slate surfaces, emerald accent (follows the user's palette),
// Sora, rounded-3xl frosted cards and a solid accent primary button.
export const Screen = () => (
  <FitLogTheme>
    <div className="w-80 space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Today</h2>
        <FireStreak count={9} label="day streak" />
      </div>
      <div className="rounded-3xl border-t border-white/10 bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-400">Eaten</p>
            <p className="text-3xl font-bold text-white">
              1,333 <span className="text-base font-medium text-slate-400">kcal</span>
            </p>
            <MacroLine macros={{ calories: 1333, protein: 97, carbs: 167, fat: 33 }} />
          </div>
          <CircularProgress percent={58} label="of goal" />
        </div>
      </div>
      <button className="min-h-11 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-on-accent">Log a meal</button>
      <button className="min-h-11 w-full rounded-xl border border-dashed border-slate-700 text-sm font-medium text-slate-300">+ Add exercise</button>
    </div>
  </FitLogTheme>
)
