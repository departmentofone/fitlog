import type { Food } from '../../types'

/** Row of quick-select pills for a user's frequently logged foods. Renders nothing when empty. */
export function FrequentFoodsList({ foods, onSelect }: { foods: Food[]; onSelect: (food: Food) => void }) {
  if (foods.length === 0) return null

  return (
    <div className="mb-3">
      <p className="mb-1.5 eyebrow">Frequently used</p>
      <div className="flex flex-wrap gap-1.5">
        {foods.map((food) => (
          <button
            key={food.id}
            onClick={() => onSelect(food)}
            className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            {food.name}
          </button>
        ))}
      </div>
    </div>
  )
}
