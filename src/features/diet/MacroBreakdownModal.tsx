import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { MealWithItems } from '../../hooks/useMeals'
import type { MacroTotals } from '../../types'

const OMEGA3_KEYWORDS = ['salmon', 'tuna', 'sardine', 'mackerel', 'herring', 'trout', 'chia', 'flax', 'walnut']

function buildInsights(meals: MealWithItems[], totals: MacroTotals): string[] {
  const proteinKcal = totals.protein * 4
  const carbsKcal = totals.carbs * 4
  const fatKcal = totals.fat * 9
  const totalKcal = proteinKcal + carbsKcal + fatKcal
  if (totalKcal === 0) return []

  const insights: string[] = []
  if (proteinKcal / totalKcal >= 0.3) insights.push('💪 Great protein intake today.')
  if (fatKcal / totalKcal > 0.45) insights.push("🧈 A higher-fat day — worth checking portions if that's not the goal.")
  if (carbsKcal / totalKcal < 0.2) insights.push('🥑 Low-carb day.')

  const foodNames = meals.flatMap((m) => m.meal_items.map((i) => i.food.name.toLowerCase()))
  if (foodNames.some((n) => OMEGA3_KEYWORDS.some((k) => n.includes(k)))) {
    insights.push('🐟 Good source of omega-3 fats.')
  }

  if (insights.length === 0) insights.push('Log more meals to see personalized insights.')
  return insights
}

export function MacroBreakdownModal({
  meals,
  totals,
  onClose,
}: {
  meals: MealWithItems[]
  totals: MacroTotals
  onClose: () => void
}) {
  const pieData = [
    { name: 'Protein', value: Math.round(totals.protein * 4), color: '#60a5fa' },
    { name: 'Carbs', value: Math.round(totals.carbs * 4), color: '#fbbf24' },
    { name: 'Fat', value: Math.round(totals.fat * 9), color: '#f87171' },
  ].filter((d) => d.value > 0)

  const insights = buildInsights(meals, totals)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-slate-900 p-4 shadow-xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-white">Today's macro breakdown</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            ×
          </button>
        </div>

        {pieData.length === 0 ? (
          <p className="text-sm text-slate-500">No food logged yet today.</p>
        ) : (
          <>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
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
            <div className="mb-4 flex justify-center gap-4 text-xs">
              {pieData.map((d) => (
                <span key={d.name} className="flex items-center gap-1.5" style={{ color: d.color }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </span>
              ))}
            </div>
          </>
        )}

        <div className="space-y-1.5">
          {insights.map((text, i) => (
            <p key={i} className="rounded-lg bg-slate-800/60 px-3 py-2 text-sm text-slate-300">
              {text}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
