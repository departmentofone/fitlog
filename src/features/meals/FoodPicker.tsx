import { useState } from 'react'
import { useCreateFood, useFoodSearch } from '../../hooks/useFoods'
import { macrosForGrams, type Food } from '../../types'

interface FoodPickerProps {
  onAdd: (input: { foodId: string; grams: number; servingLabel: string | null }) => void
  onCancel: () => void
}

export function FoodPicker({ onAdd, onCancel }: FoodPickerProps) {
  const [search, setSearch] = useState('')
  const { data: foods = [] } = useFoodSearch(search)
  const [selected, setSelected] = useState<Food | null>(null)
  const [creating, setCreating] = useState(false)

  if (creating) {
    return <NewFoodForm onCreated={(food) => setSelected(food)} onCancel={() => setCreating(false)} />
  }

  if (selected) {
    return <AmountForm food={selected} onAdd={onAdd} onBack={() => setSelected(null)} />
  }

  return (
    <div className="rounded-xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-white">Add food</h3>
        <button onClick={onCancel} className="text-sm text-slate-400 hover:text-slate-200">
          Cancel
        </button>
      </div>
      <input
        autoFocus
        placeholder="Search foods…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
      />
      <div className="mb-3 max-h-64 space-y-1.5 overflow-y-auto">
        {foods.map((food) => (
          <button
            key={food.id}
            onClick={() => setSelected(food)}
            className="flex w-full items-center justify-between rounded-lg bg-slate-800 px-3 py-2.5 text-left text-white hover:bg-slate-700"
          >
            <span>{food.name}</span>
            <span className="text-xs text-slate-400">{Math.round(food.calories_per_100g)} kcal/100g</span>
          </button>
        ))}
        {foods.length === 0 && <p className="px-1 text-sm text-slate-500">No matches.</p>}
      </div>
      <button
        onClick={() => setCreating(true)}
        className="w-full rounded-lg border border-dashed border-slate-700 py-2.5 text-sm font-medium text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
      >
        + New food
      </button>
    </div>
  )
}

function AmountForm({
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

  const baseGrams = mode === 'grams' ? parseFloat(grams) || 0 : food.common_servings[mode as number]?.grams ?? 0
  const resolvedGrams = baseGrams * qty
  const preview = macrosForGrams(food, resolvedGrams)

  return (
    <div className="rounded-xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
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
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                mode === i ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {serving.label}
            </button>
          ))}
          <button
            onClick={() => setMode('grams')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              mode === 'grams' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Grams
          </button>
        </div>
      )}

      {mode === 'grams' && (
        <input
          type="number"
          inputMode="decimal"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
        />
      )}

      <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2">
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
            className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-500"
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
        className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        Add to meal
      </button>
    </div>
  )
}

function NewFoodForm({ onCreated, onCancel }: { onCreated: (food: Food) => void; onCancel: () => void }) {
  const createFood = useCreateFood()
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [servingLabel, setServingLabel] = useState('')
  const [servingGrams, setServingGrams] = useState('')

  async function handleCreate() {
    if (!name.trim() || !calories) return
    const commonServings =
      servingLabel.trim() && servingGrams
        ? [{ label: servingLabel.trim(), grams: parseFloat(servingGrams) }]
        : []
    const food = await createFood.mutateAsync({
      name: name.trim(),
      caloriesPer100g: parseFloat(calories) || 0,
      proteinPer100g: parseFloat(protein) || 0,
      carbsPer100g: parseFloat(carbs) || 0,
      fatPer100g: parseFloat(fat) || 0,
      commonServings,
    })
    onCreated(food)
  }

  return (
    <div className="rounded-xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-white">New food</h3>
        <button onClick={onCancel} className="text-sm text-slate-400 hover:text-slate-200">
          Cancel
        </button>
      </div>
      <div className="space-y-2.5">
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <p className="text-xs text-slate-500">Per 100g:</p>
        <div className="grid grid-cols-2 gap-2.5">
          <input
            placeholder="Calories"
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <input
            placeholder="Protein (g)"
            type="number"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <input
            placeholder="Carbs (g)"
            type="number"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <input
            placeholder="Fat (g)"
            type="number"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <p className="text-xs text-slate-500">Optional common serving (e.g. "1 small egg" = 38g):</p>
        <div className="grid grid-cols-2 gap-2.5">
          <input
            placeholder="Label"
            value={servingLabel}
            onChange={(e) => setServingLabel(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <input
            placeholder="Grams"
            type="number"
            value={servingGrams}
            onChange={(e) => setServingGrams(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={!name.trim() || !calories || createFood.isPending}
          className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Create food
        </button>
      </div>
    </div>
  )
}
