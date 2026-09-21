import { useState } from 'react'
import { parseDecimal } from '../../lib/number'
import { macrosForGrams, type Food } from '../../types'

export interface FoodAmount {
  foodId: string
  grams: number
  servingLabel: string | null
}

/** Trims float noise so an edited "33.333333" shows as "33.3". */
function formatGrams(grams: number): string {
  return String(Math.round(grams * 10) / 10)
}

/**
 * Amount step for a food: tap a common serving (with a quantity stepper) or type grams.
 * Used both to add a food and to edit an already-logged one (pass `initialGrams` + `submitLabel`).
 */
export function FoodAmountForm({
  food,
  onAdd,
  onBack,
  initialGrams,
  submitLabel = 'Add to meal',
  backLabel = 'Back',
}: {
  food: Food
  onAdd: (input: FoodAmount) => void
  onBack: () => void
  /** Editing an existing item: starts in grams mode with this amount. */
  initialGrams?: number
  submitLabel?: string
  backLabel?: string
}) {
  // New foods start on their natural serving ("1 large egg") when there is one - 100 g of egg is a
  // number nobody actually eats. Edits start on the logged grams.
  const [mode, setMode] = useState<'grams' | number>(
    initialGrams == null && food.common_servings.length > 0 ? 0 : 'grams',
  )
  const [grams, setGrams] = useState(initialGrams != null ? formatGrams(initialGrams) : '100')
  const [qty, setQty] = useState(1)

  const serving = typeof mode === 'number' ? food.common_servings[mode] : null
  const typedGrams = parseDecimal(grams)
  const resolvedGrams = serving ? serving.grams * qty : Number.isFinite(typedGrams) && typedGrams > 0 ? typedGrams : 0
  const preview = macrosForGrams(food, resolvedGrams)

  const chipClass = (active: boolean) =>
    `min-h-9 rounded-xl px-3 text-sm font-medium transition ${
      active ? 'bg-emerald-600 text-on-accent' : 'bg-slate-800 text-slate-300 active:bg-slate-700'
    }`
  const stepClass =
    'flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-lg font-semibold text-slate-200 active:bg-slate-700 disabled:opacity-40'

  return (
    <div className="rounded-2xl border-t border-white/10 bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="min-w-0 font-medium leading-snug text-white">{food.name}</h3>
        <button onClick={onBack} className="-my-2 -mr-2 min-h-11 shrink-0 px-2 text-sm text-slate-400">
          {backLabel}
        </button>
      </div>

      {food.common_servings.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Amount">
          {food.common_servings.map((s, i) => (
            <button key={s.label} role="radio" aria-checked={mode === i} onClick={() => setMode(i)} className={chipClass(mode === i)}>
              {s.label}
            </button>
          ))}
          <button role="radio" aria-checked={mode === 'grams'} onClick={() => setMode('grams')} className={chipClass(mode === 'grams')}>
            Grams
          </button>
        </div>
      )}

      {mode === 'grams' ? (
        <label className="mb-3 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 pr-3 focus-within:border-emerald-500">
          <span className="sr-only">Amount in grams</span>
          <input
            type="text"
            inputMode="decimal"
            autoFocus={initialGrams != null}
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="h-12 min-w-0 flex-1 bg-transparent px-3 text-lg font-semibold text-white focus:outline-none"
          />
          <span className="text-sm font-medium text-slate-400">g</span>
        </label>
      ) : (
        // Quantity only applies to servings - for grams you just type the total.
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-slate-400">
            {qty} × {serving!.label} <span className="text-slate-500">({formatGrams(resolvedGrams)} g)</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="One fewer"
              disabled={qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className={stepClass}
            >
              −
            </button>
            <button type="button" aria-label="One more" onClick={() => setQty((q) => q + 1)} className={stepClass}>
              +
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-baseline justify-between rounded-xl bg-slate-800/60 px-3 py-2.5">
        <span className="text-xl font-semibold text-white">
          {Math.round(preview.calories)} <span className="text-sm font-medium text-slate-400">kcal</span>
        </span>
        <span className="text-sm text-slate-400">
          P {Math.round(preview.protein)}g · C {Math.round(preview.carbs)}g · F {Math.round(preview.fat)}g
        </span>
      </div>

      <button
        onClick={() => {
          const servingLabel = serving ? (qty > 1 ? `${qty} × ${serving.label}` : serving.label) : null
          onAdd({ foodId: food.id, grams: resolvedGrams, servingLabel })
        }}
        disabled={resolvedGrams <= 0}
        className="min-h-12 w-full rounded-xl bg-emerald-600 font-semibold text-on-accent hover:brightness-90 disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  )
}
