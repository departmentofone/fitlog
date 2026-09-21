import { parseDecimal } from '../../lib/number'
import { useState } from 'react'
import { macrosForGrams, type Food } from '../../types'

/** Serving-size / grams entry step: pick a common serving or type grams, plus a quantity stepper. */
export function FoodAmountForm({
  food,
  onAdd,
  onBack,
}: {
  food: Food
  onAdd: (input: { foodId: string; grams: number; servingLabel: string | null }) => void
  onBack: () => void
}) {
  const [mode, setMode] = useState<'grams' | number>('grams')
  const [grams, setGrams] = useState('100')
  const [qty, setQty] = useState(1)

  const baseGrams = mode === 'grams' ? parseDecimal(grams) || 0 : food.common_servings[mode as number]?.grams ?? 0
  const resolvedGrams = baseGrams * qty
  const preview = macrosForGrams(food, resolvedGrams)

  return (
    <div className="rounded-2xl bg-slate-900 border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-white">{food.name}</h3>
        <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-200">
          Back
        </button>
      </div>

      {food.common_servings.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {food.common_servings.map((serving, i) => (
            <button
              key={serving.label}
              onClick={() => setMode(i)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
                mode === i ? 'bg-emerald-600 text-on-accent' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {serving.label}
            </button>
          ))}
          <button
            onClick={() => setMode('grams')}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
              mode === 'grams' ? 'bg-emerald-600 text-on-accent' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Grams
          </button>
        </div>
      )}

      {mode === 'grams' && (
        <input
          type="text"
          inputMode="decimal"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
        />
      )}

      <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-800/60 px-3 py-2">
        <span className="text-sm text-slate-400">Quantity</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-white transition hover:bg-slate-600"
          >
            −
          </button>
          <span className="w-5 text-center text-sm font-medium text-white">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-on-accent transition hover:brightness-90"
          >
            +
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-400">
        {Math.round(preview.calories)} kcal · P {Math.round(preview.protein)}g · C {Math.round(preview.carbs)}g ·
        F {Math.round(preview.fat)}g
      </p>

      <button
        onClick={() => {
          const baseLabel = mode === 'grams' ? null : food.common_servings[mode as number].label
          const servingLabel =
            qty > 1 ? `${qty} × ${baseLabel ?? `${baseGrams}g`}` : baseLabel
          onAdd({ foodId: food.id, grams: resolvedGrams, servingLabel })
        }}
        disabled={resolvedGrams <= 0}
        className="w-full rounded-xl bg-emerald-600 py-2.5 font-medium text-on-accent hover:brightness-90 disabled:opacity-50"
      >
        Add to meal
      </button>
    </div>
  )
}
