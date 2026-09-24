import { MacroLine } from 'fitlog-design-system'

// Protein / carbs / fat in their fixed colours (blue, amber, red), as under every meal and total.
export const DayTotals = () => <MacroLine macros={{ calories: 1333, protein: 97, carbs: 167, fat: 33 }} className="text-base" />

export const UnderAMeal = () => (
  <div className="w-72 rounded-2xl border-t border-white/10 bg-slate-900/70 p-4 ring-1 ring-white/5">
    <div className="mb-1 flex items-center justify-between gap-2">
      <h3 className="font-medium text-white">Lunch</h3>
      <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-400">Done</span>
    </div>
    <p className="mb-1 text-sm text-slate-400">
      4 items · <span className="font-semibold text-emerald-400">637 kcal</span>
    </p>
    <MacroLine macros={{ calories: 637, protein: 55, carbs: 64, fat: 16 }} />
  </div>
)
