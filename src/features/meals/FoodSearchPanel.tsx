import { useFoodLibrary, useFoodSearch } from '../../hooks/useFoods'
import { useFrequentFoods } from '../../hooks/useFrequentFoods'
import type { Food } from '../../types'
import { FrequentFoodsList } from './FrequentFoodsList'

/** Ranked results are good enough that the first handful is what you want; the rest is noise. */
const MAX_RESULTS = 20

interface FoodSearchPanelProps {
  search: string
  onSearchChange: (search: string) => void
  onSelectFood: (food: Food) => void
  onCreateNew: () => void
  onCancel: () => void
}

/** Search box + frequently-used pills + ranked results, with an entry point to create a new food. */
export function FoodSearchPanel({ search, onSearchChange, onSelectFood, onCreateNew, onCancel }: FoodSearchPanelProps) {
  const { data: results = [], isLoading } = useFoodSearch(search)
  const { data: library = [] } = useFoodLibrary()
  const { data: frequent = [] } = useFrequentFoods()
  const searching = search.trim().length > 0
  const shown = results.slice(0, MAX_RESULTS)

  return (
    <div className="rounded-2xl border-t border-white/10 bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-white">Add food</h3>
        <button onClick={onCancel} className="-my-2 -mr-2 min-h-11 px-2 text-sm text-slate-400">
          Cancel
        </button>
      </div>
      <input
        autoFocus
        type="search"
        enterKeyHint="search"
        aria-label="Search foods"
        placeholder={library.length > 0 ? `Search ${library.length} foods…` : 'Search foods…'}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="mb-3 h-12 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
      />

      {!searching && <FrequentFoodsList foods={frequent} onSelect={onSelectFood} />}

      {searching && (
        // No inner scroll box: nested scrolling inside the page is fiddly on a phone.
        <div className="mb-3 space-y-1.5">
          {shown.map((food) => (
            <button
              key={food.id}
              onClick={() => onSelectFood(food)}
              className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl bg-slate-800 px-3 py-2 text-left active:bg-slate-700"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium leading-snug text-white">{food.name}</span>
                <span className="block text-xs text-slate-500">
                  P {Math.round(food.protein_per_100g)} · C {Math.round(food.carbs_per_100g)} · F{' '}
                  {Math.round(food.fat_per_100g)} per 100 g
                </span>
              </span>
              <span className="shrink-0 text-sm font-medium text-slate-300">
                {Math.round(food.calories_per_100g)} <span className="text-xs font-normal text-slate-500">kcal</span>
              </span>
            </button>
          ))}
          {!isLoading && results.length === 0 && (
            <p className="px-1 py-2 text-sm text-slate-400">
              No foods match “{search.trim()}”. You can add it as a new food below.
            </p>
          )}
          {results.length > MAX_RESULTS && (
            <p className="px-1 pt-1 text-xs text-slate-500">
              Showing the {MAX_RESULTS} best matches — type more to narrow it down.
            </p>
          )}
        </div>
      )}

      {!searching && frequent.length === 0 && (
        <p className="mb-3 px-1 text-sm text-slate-500">Type a food to search — the foods you log most will show up here.</p>
      )}

      <button
        onClick={onCreateNew}
        className="min-h-11 w-full rounded-xl border border-dashed border-slate-700 text-sm font-medium text-slate-300 active:border-emerald-500 active:text-emerald-400"
      >
        + New food
      </button>
    </div>
  )
}
