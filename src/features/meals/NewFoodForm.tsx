import { useState } from 'react'
import { useCreateFood } from '../../hooks/useFoods'
import type { Food } from '../../types'

/** Form for creating a brand-new food (macros per 100g, an optional common serving, and optional micros). */
export function NewFoodForm({ onCreated, onCancel }: { onCreated: (food: Food) => void; onCancel: () => void }) {
  const createFood = useCreateFood()
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [servingLabel, setServingLabel] = useState('')
  const [servingGrams, setServingGrams] = useState('')

  const [showMicros, setShowMicros] = useState(false)
  const [fiber, setFiber] = useState('')
  const [sugar, setSugar] = useState('')
  const [sodium, setSodium] = useState('')
  const [cholesterol, setCholesterol] = useState('')
  const [potassium, setPotassium] = useState('')
  const [calcium, setCalcium] = useState('')
  const [iron, setIron] = useState('')
  const [vitaminC, setVitaminC] = useState('')
  const [vitaminA, setVitaminA] = useState('')

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
      fiberG: parseFloat(fiber) || 0,
      sugarG: parseFloat(sugar) || 0,
      sodiumMg: parseFloat(sodium) || 0,
      cholesterolMg: parseFloat(cholesterol) || 0,
      potassiumMg: parseFloat(potassium) || 0,
      calciumMg: parseFloat(calcium) || 0,
      ironMg: parseFloat(iron) || 0,
      vitaminCMg: parseFloat(vitaminC) || 0,
      vitaminAMcg: parseFloat(vitaminA) || 0,
    })
    onCreated(food)
  }

  return (
    <div className="rounded-2xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
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
          className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <p className="text-xs text-slate-500">Per 100g:</p>
        <div className="grid grid-cols-2 gap-2.5">
          <input
            placeholder="Calories"
            type="number"
            inputMode="decimal"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <input
            placeholder="Protein (g)"
            type="number"
            inputMode="decimal"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <input
            placeholder="Carbs (g)"
            type="number"
            inputMode="decimal"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <input
            placeholder="Fat (g)"
            type="number"
            inputMode="decimal"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <p className="text-xs text-slate-500">Optional common serving (e.g. "1 small egg" = 38g):</p>
        <div className="grid grid-cols-2 gap-2.5">
          <input
            placeholder="Label"
            value={servingLabel}
            onChange={(e) => setServingLabel(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <input
            placeholder="Grams"
            type="number"
            inputMode="decimal"
            value={servingGrams}
            onChange={(e) => setServingGrams(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <button
          onClick={() => setShowMicros((v) => !v)}
          className="text-xs font-medium text-slate-400 hover:text-slate-200"
        >
          {showMicros ? '− Hide micronutrients' : '+ Add micronutrients (optional)'}
        </button>

        {showMicros && (
          <div className="grid grid-cols-2 gap-2.5">
            <input
              placeholder="Fiber (g)"
              type="number"
              inputMode="decimal"
              value={fiber}
              onChange={(e) => setFiber(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <input
              placeholder="Sugar (g)"
              type="number"
              inputMode="decimal"
              value={sugar}
              onChange={(e) => setSugar(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <input
              placeholder="Sodium (mg)"
              type="number"
              inputMode="decimal"
              value={sodium}
              onChange={(e) => setSodium(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <input
              placeholder="Cholesterol (mg)"
              type="number"
              inputMode="decimal"
              value={cholesterol}
              onChange={(e) => setCholesterol(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <input
              placeholder="Potassium (mg)"
              type="number"
              inputMode="decimal"
              value={potassium}
              onChange={(e) => setPotassium(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <input
              placeholder="Calcium (mg)"
              type="number"
              inputMode="decimal"
              value={calcium}
              onChange={(e) => setCalcium(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <input
              placeholder="Iron (mg)"
              type="number"
              inputMode="decimal"
              value={iron}
              onChange={(e) => setIron(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <input
              placeholder="Vitamin C (mg)"
              type="number"
              inputMode="decimal"
              value={vitaminC}
              onChange={(e) => setVitaminC(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <input
              placeholder="Vitamin A (mcg)"
              type="number"
              inputMode="decimal"
              value={vitaminA}
              onChange={(e) => setVitaminA(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={!name.trim() || !calories || createFood.isPending}
          className="w-full rounded-xl bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Create food
        </button>
      </div>
    </div>
  )
}
