import { parseDecimal } from '../../lib/number'
import { useState } from 'react'
import { useCreateFood, useUpdateFood } from '../../hooks/useFoods'
import { useUserSettings } from '../../hooks/useUserSettings'
import { fromDisplayFoodAmount, toDisplayFoodAmount } from '../../lib/units'
import type { Food } from '../../types'

/**
 * Form for creating a brand-new food, or editing one you own (pass `food`) - same fields either
 * way, just backed by a different mutation. Used by FoodPicker (create, while logging a meal) and
 * the Foods tab (create or edit, while managing the library).
 */
export function NewFoodForm({ food, onSaved, onCancel }: { food?: Food; onSaved: (food: Food) => void; onCancel: () => void }) {
  const createFood = useCreateFood()
  const updateFood = useUpdateFood()
  const saving = food ? updateFood : createFood
  const [name, setName] = useState(food?.name ?? '')
  const [calories, setCalories] = useState(food ? String(food.calories_per_100g) : '')
  const [protein, setProtein] = useState(food ? String(food.protein_per_100g) : '')
  const [carbs, setCarbs] = useState(food ? String(food.carbs_per_100g) : '')
  const [fat, setFat] = useState(food ? String(food.fat_per_100g) : '')
  const [servingLabel, setServingLabel] = useState(food?.common_servings[0]?.label ?? '')
  // Nutrition stays "per 100 g" (the database's basis), but the serving's weight is typed in the
  // user's unit - g, or oz for imperial.
  const { data: settings } = useUserSettings()
  const [unit] = useState(settings?.unit_system)
  const firstServing = food?.common_servings[0]
  const [initialServingAmount] = useState(firstServing ? String(toDisplayFoodAmount(firstServing.grams, unit)) : '')
  const [servingAmount, setServingAmount] = useState(initialServingAmount)

  const [showMicros, setShowMicros] = useState(false)
  const [fiber, setFiber] = useState(food ? String(food.fiber_g) : '')
  const [sugar, setSugar] = useState(food ? String(food.sugar_g) : '')
  const [sodium, setSodium] = useState(food ? String(food.sodium_mg) : '')
  const [cholesterol, setCholesterol] = useState(food ? String(food.cholesterol_mg) : '')
  const [potassium, setPotassium] = useState(food ? String(food.potassium_mg) : '')
  const [calcium, setCalcium] = useState(food ? String(food.calcium_mg) : '')
  const [iron, setIron] = useState(food ? String(food.iron_mg) : '')
  const [vitaminC, setVitaminC] = useState(food ? String(food.vitamin_c_mg) : '')
  const [vitaminA, setVitaminA] = useState(food ? String(food.vitamin_a_mcg) : '')

  async function handleSave() {
    if (!name.trim() || !calories) return
    const commonServings =
      servingLabel.trim() && servingAmount
        ? [
            {
              label: servingLabel.trim(),
              grams:
                firstServing && servingAmount === initialServingAmount
                  ? firstServing.grams
                  : fromDisplayFoodAmount(parseDecimal(servingAmount), unit),
            },
          ]
        : []
    const input = {
      name: name.trim(),
      caloriesPer100g: parseDecimal(calories) || 0,
      proteinPer100g: parseDecimal(protein) || 0,
      carbsPer100g: parseDecimal(carbs) || 0,
      fatPer100g: parseDecimal(fat) || 0,
      commonServings,
      fiberG: parseDecimal(fiber) || 0,
      sugarG: parseDecimal(sugar) || 0,
      sodiumMg: parseDecimal(sodium) || 0,
      cholesterolMg: parseDecimal(cholesterol) || 0,
      potassiumMg: parseDecimal(potassium) || 0,
      calciumMg: parseDecimal(calcium) || 0,
      ironMg: parseDecimal(iron) || 0,
      vitaminCMg: parseDecimal(vitaminC) || 0,
      vitaminAMcg: parseDecimal(vitaminA) || 0,
    }
    try {
      const saved = food ? await updateFood.mutateAsync({ id: food.id, ...input }) : await createFood.mutateAsync(input)
      onSaved(saved)
    } catch {
      return // shown under the button via saving.isError
    }
  }

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-white">{food ? 'Edit food' : 'New food'}</h3>
        <button onClick={onCancel} className="text-sm text-slate-400 hover:text-slate-200">
          Cancel
        </button>
      </div>
      <div className="space-y-2.5">
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full field px-3 py-2.5"
        />
        <p className="text-xs text-slate-500">Per 100g:</p>
        <div className="grid grid-cols-2 gap-2.5">
          <input
            placeholder="Calories"
            type="text"
            inputMode="decimal"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="field px-3 py-2"
          />
          <input
            placeholder="Protein (g)"
            type="text"
            inputMode="decimal"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            className="field px-3 py-2"
          />
          <input
            placeholder="Carbs (g)"
            type="text"
            inputMode="decimal"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            className="field px-3 py-2"
          />
          <input
            placeholder="Fat (g)"
            type="text"
            inputMode="decimal"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            className="field px-3 py-2"
          />
        </div>
        <p className="text-xs text-slate-500">Optional common serving (e.g. "1 small egg" = {unit === 'imperial' ? '1.3 oz' : '38g'}):</p>
        <div className="grid grid-cols-2 gap-2.5">
          <input
            placeholder="Label"
            value={servingLabel}
            onChange={(e) => setServingLabel(e.target.value)}
            className="field px-3 py-2"
          />
          <input
            placeholder={unit === 'imperial' ? 'Ounces' : 'Grams'}
            type="text"
            inputMode="decimal"
            value={servingAmount}
            onChange={(e) => setServingAmount(e.target.value)}
            className="field px-3 py-2"
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
              type="text"
              inputMode="decimal"
              value={fiber}
              onChange={(e) => setFiber(e.target.value)}
              className="field px-3 py-2"
            />
            <input
              placeholder="Sugar (g)"
              type="text"
              inputMode="decimal"
              value={sugar}
              onChange={(e) => setSugar(e.target.value)}
              className="field px-3 py-2"
            />
            <input
              placeholder="Sodium (mg)"
              type="text"
              inputMode="decimal"
              value={sodium}
              onChange={(e) => setSodium(e.target.value)}
              className="field px-3 py-2"
            />
            <input
              placeholder="Cholesterol (mg)"
              type="text"
              inputMode="decimal"
              value={cholesterol}
              onChange={(e) => setCholesterol(e.target.value)}
              className="field px-3 py-2"
            />
            <input
              placeholder="Potassium (mg)"
              type="text"
              inputMode="decimal"
              value={potassium}
              onChange={(e) => setPotassium(e.target.value)}
              className="field px-3 py-2"
            />
            <input
              placeholder="Calcium (mg)"
              type="text"
              inputMode="decimal"
              value={calcium}
              onChange={(e) => setCalcium(e.target.value)}
              className="field px-3 py-2"
            />
            <input
              placeholder="Iron (mg)"
              type="text"
              inputMode="decimal"
              value={iron}
              onChange={(e) => setIron(e.target.value)}
              className="field px-3 py-2"
            />
            <input
              placeholder="Vitamin C (mg)"
              type="text"
              inputMode="decimal"
              value={vitaminC}
              onChange={(e) => setVitaminC(e.target.value)}
              className="field px-3 py-2"
            />
            <input
              placeholder="Vitamin A (mcg)"
              type="text"
              inputMode="decimal"
              value={vitaminA}
              onChange={(e) => setVitaminA(e.target.value)}
              className="field px-3 py-2"
            />
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!name.trim() || !calories || saving.isPending}
          className="btn btn-primary w-full py-2.5"
        >
          {saving.isPending ? 'Saving…' : food ? 'Save changes' : 'Create food'}
        </button>
        {saving.isError && (
          <p role="alert" className="text-center text-xs text-red-400">
            Couldn't save this food. Check your connection and try again.
          </p>
        )}
      </div>
    </div>
  )
}
