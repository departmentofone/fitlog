import { useFoodSearch } from '../../hooks/useFoods'
import { useFrequentFoods } from '../../hooks/useFrequentFoods'
import type { Food } from '../../types'
import { FrequentFoodsList } from './FrequentFoodsList'

interface FoodSearchPanelProps {
  search: string
  onSearchChange: (search: string) => void
  onSelectFood: (food: Food) => void
  onCreateNew: () => void
  onCancel: () => void
}

/** Search box + frequently-used pills + matching results list, with an entry point to create a new food. */
export function FoodSearchPanel({ search, onSearchChange, onSelectFood, onCreateNew, onCancel }: FoodSearchPanelProps) {
  const { data: foods = [] } = useFoodSearch(search)
  const { data: frequent = [] } = useFrequentFoods()

  return (
    <div className="rounded-2xl bg-slate-900 border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
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
        onChange={(e) => onSearchChange(e.target.value)}
        className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
      />
      {!search.trim() && <FrequentFoodsList foods={frequent} onSelect={onSelectFood} />}
      <div className="mb-3 max-h-64 space-y-1.5 overflow-y-auto">
        {foods.map((food) => (
          <button
            key={food.id}
            onClick={() => onSelectFood(food)}
            className="flex w-full items-center justify-between rounded-xl bg-slate-800 px-3 py-2.5 text-left text-white hover:bg-slate-700"
          >
            <span>{food.name}</span>
            <span className="text-xs text-slate-400">{Math.round(food.calories_per_100g)} kcal/100g</span>
          </button>
        ))}
        {foods.length === 0 && <p className="px-1 text-sm text-slate-500">No matches.</p>}
      </div>
      <button
        onClick={onCreateNew}
        className="w-full rounded-xl border border-dashed border-slate-700 py-2.5 text-sm font-medium text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
      >
        + New food
      </button>
    </div>
  )
}
