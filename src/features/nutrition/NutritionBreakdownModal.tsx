import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { DAILY_VALUES, formatAmount, percentDV } from '../../lib/nutrition'
import { macrosForGrams, microsForGrams, sumMacros, sumMicros, type MacroTotals, type MicroTotals } from '../../types'
import type { MealWithItems } from '../../hooks/useMeals'

const OMEGA3_KEYWORDS = ['salmon', 'tuna', 'sardine', 'mackerel', 'herring', 'trout', 'chia', 'flax', 'walnut']

function buildFlags(micros: MicroTotals, foodNames: string[]): { text: string; tone: 'warn' | 'good' | 'info' }[] {
  const flags: { text: string; tone: 'warn' | 'good' | 'info' }[] = []

  const sodiumPct = percentDV(micros.sodium, 2300)
  if (sodiumPct >= 100) flags.push({ text: `Sodium at ${sodiumPct}% DV — high`, tone: 'warn' })

  const fiberPct = percentDV(micros.fiber, 28)
  if (fiberPct < 15 && micros.fiber >= 0) flags.push({ text: `Fiber at ${fiberPct}% DV — low`, tone: 'info' })

  if (percentDV(micros.vitaminC, 90) >= 100) flags.push({ text: 'Vitamin C goal met', tone: 'good' })
  if (percentDV(micros.potassium, 4700) >= 50) flags.push({ text: 'Strong potassium intake', tone: 'good' })

  if (foodNames.some((n) => OMEGA3_KEYWORDS.some((k) => n.includes(k)))) {
    flags.push({ text: 'Contains an omega-3-rich food', tone: 'good' })
  }

  return flags
}

const FLAG_CLASSES: Record<string, string> = {
  warn: 'bg-red-500/10 text-red-400',
  good: 'bg-emerald-500/10 text-emerald-400',
  info: 'bg-blue-500/10 text-blue-400',
}

export function NutritionBreakdownModal({ meals, onClose }: { meals: MealWithItems[]; onClose: () => void }) {
  const items = meals.flatMap((m) => m.meal_items)
  const totals: MacroTotals = sumMacros(items.map((i) => macrosForGrams(i.food, i.grams)))
  const micros: MicroTotals = sumMicros(items.map((i) => microsForGrams(i.food, i.grams)))
  const foodNames = items.map((i) => i.food.name.toLowerCase())

  const pieData = [
    { name: 'Protein', value: Math.round(totals.protein * 4), grams: Math.round(totals.protein), color: '#60a5fa' },
    { name: 'Carbs', value: Math.round(totals.carbs * 4), grams: Math.round(totals.carbs), color: '#fbbf24' },
    { name: 'Fat', value: Math.round(totals.fat * 9), grams: Math.round(totals.fat), color: '#f87171' },
  ].filter((d) => d.value > 0)

  const flags = buildFlags(micros, foodNames)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-slate-900 p-4 shadow-xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-white">Nutrition Breakdown</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            ×
          </button>
        </div>

        {pieData.length === 0 ? (
          <p className="text-sm text-slate-500">No food logged yet today.</p>
        ) : (
          <>
            <div className="mb-2 flex items-center gap-4">
              <div className="h-28 w-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={32} outerRadius={54} paddingAngle={2}>
                      {pieData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                      formatter={(value, name) => [`${value} kcal`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5" style={{ color: d.color }}>
                      <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span className="text-slate-300">{d.grams}g</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-white/5 pt-1.5 text-sm font-medium">
                  <span className="text-slate-400">Calories</span>
                  <span className="text-white">{Math.round(totals.calories)}</span>
                </div>
              </div>
            </div>

            {flags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {flags.map((f, i) => (
                  <span key={i} className={`rounded-full px-2.5 py-1 text-xs font-medium ${FLAG_CLASSES[f.tone]}`}>
                    {f.text}
                  </span>
                ))}
              </div>
            )}

            <div className="border-t border-white/5 pt-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Micronutrients</p>
              <div className="space-y-2">
                {DAILY_VALUES.map((d) => {
                  const value = micros[d.key]
                  const pct = Math.min(100, percentDV(value, d.dv))
                  return (
                    <div key={d.key}>
                      <div className="mb-0.5 flex items-center justify-between text-xs">
                        <span className="text-slate-300">{d.label}</span>
                        <span className="text-slate-500">
                          {formatAmount(value, d.unit)} · {percentDV(value, d.dv)}% DV
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full ${pct >= 100 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
