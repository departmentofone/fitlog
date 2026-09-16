import { useState } from 'react'
import { MacroLine } from '../../components/MacroLine'
import { useToast } from '../../components/ToastProvider'
import { useAuth } from '../../hooks/useAuth'
import { useFoodSearch } from '../../hooks/useFoods'
import { useFrequentFoods } from '../../hooks/useFrequentFoods'
import type { MealWithItems } from '../../hooks/useMeals'
import {
  computeRecipeMacros,
  useAddRecipeToMeal,
  useCreateRecipe,
  useDeleteRecipe,
  useRecipes,
  useSetRecipeShared,
  useUpdateRecipeServings,
  type RecipeIngredientWithFood,
  type RecipeWithIngredients,
} from '../../hooks/useRecipes'
import { haptics } from '../../lib/haptics'
import type { Food } from '../../types'

interface DraftIngredient {
  food: Food
  grams: number
}

export function RecipeBuilderView({
  date: _date,
  currentMeals,
  onBack,
}: {
  date: string
  currentMeals: MealWithItems[]
  onBack: () => void
}) {
  const { user } = useAuth()
  const { data: recipes = [], isLoading } = useRecipes()
  const createRecipe = useCreateRecipe()
  const deleteRecipe = useDeleteRecipe()
  const setShared = useSetRecipeShared()
  const addToMeal = useAddRecipeToMeal()
  const { show, undoable } = useToast()

  const [name, setName] = useState('')
  const [servings, setServings] = useState(1)
  const [search, setSearch] = useState('')
  const { data: foods = [] } = useFoodSearch(search)
  const { data: frequent = [] } = useFrequentFoods()
  const [draft, setDraft] = useState<DraftIngredient[]>([])

  const draftPreview: RecipeIngredientWithFood[] = draft.map((d, i) => ({
    id: `draft-${i}`,
    recipe_id: 'draft',
    food_id: d.food.id,
    grams: d.grams,
    serving_label: null,
    created_at: '',
    food: d.food,
  }))
  const draftMacros = computeRecipeMacros(draftPreview)

  function addFoodToDraft(food: Food) {
    setDraft((cur) => [...cur, { food, grams: 100 }])
  }

  function updateDraftGrams(index: number, grams: number) {
    setDraft((cur) => cur.map((d, i) => (i === index ? { ...d, grams } : d)))
  }

  function removeDraftIngredient(index: number) {
    setDraft((cur) => cur.filter((_, i) => i !== index))
  }

  function handleSave() {
    if (!name.trim() || draft.length === 0) return
    createRecipe.mutate({
      name: name.trim(),
      servings,
      ingredients: draft.map((d) => ({ foodId: d.food.id, grams: d.grams, servingLabel: null })),
    })
    setName('')
    setServings(1)
    setSearch('')
    setDraft([])
  }

  return (
    <div className="space-y-4 p-4">
      <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-200">
        ← Back
      </button>

      <div className="rounded-2xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-3 font-medium text-white">New recipe</h3>
        <div className="mb-3 space-y-2.5">
          <input
            placeholder="Recipe name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Servings</span>
            <input
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-20 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <input
          placeholder="Search foods…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        {!search.trim() && frequent.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">Frequently used</p>
            <div className="flex flex-wrap gap-1.5">
              {frequent.map((food) => (
                <button
                  key={food.id}
                  onClick={() => addFoodToDraft(food)}
                  className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  {food.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mb-3 max-h-48 space-y-1.5 overflow-y-auto">
          {foods.map((food) => (
            <button
              key={food.id}
              onClick={() => addFoodToDraft(food)}
              className="flex w-full items-center justify-between rounded-xl bg-slate-800 px-3 py-2.5 text-left text-white hover:bg-slate-700"
            >
              <span>{food.name}</span>
              <span className="text-xs text-slate-400">{Math.round(food.calories_per_100g)} kcal/100g</span>
            </button>
          ))}
          {search.trim() && foods.length === 0 && <p className="px-1 text-sm text-slate-500">No matches.</p>}
        </div>

        {draft.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {draft.map((d, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-800/60 px-3 py-2">
                <span className="flex-1 truncate text-sm text-slate-200">{d.food.name}</span>
                <input
                  type="number"
                  min={0}
                  value={d.grams}
                  onChange={(e) => updateDraftGrams(i, parseFloat(e.target.value) || 0)}
                  className="w-20 rounded-xl border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-500">g</span>
                <button onClick={() => removeDraftIngredient(i)} className="text-red-400 hover:text-red-300">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {draft.length > 0 && (
          <div className="mb-3 rounded-xl bg-slate-800/60 px-3 py-2">
            <p className="mb-1 text-sm font-medium text-white">{Math.round(draftMacros.total.calories)} kcal total</p>
            <MacroLine macros={draftMacros.total} />
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!name.trim() || draft.length === 0 || createRecipe.isPending}
          className="w-full rounded-xl bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Save recipe
        </button>
      </div>

      <div className="rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-[var(--glow-shadow)] ring-1 ring-white/5">
        <h3 className="mb-3 font-medium text-white">Your recipes</h3>
        {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
        {!isLoading && recipes.length === 0 && (
          <p className="text-sm text-slate-500">No recipes yet — build one above.</p>
        )}
        <div className="space-y-2">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isOwner={recipe.user_id === user?.id}
              currentMeals={currentMeals}
              onDelete={() => {
                const ingredients = recipe.recipe_ingredients.map((i) => ({
                  foodId: i.food_id,
                  grams: i.grams,
                  servingLabel: i.serving_label,
                }))
                undoable(
                  `Deleted "${recipe.name}"`,
                  () => deleteRecipe.mutate(recipe.id),
                  () => createRecipe.mutate({ name: recipe.name, servings: recipe.servings, ingredients }),
                )
              }}
              onSetShared={(isShared) => setShared.mutate({ recipeId: recipe.id, isShared })}
              onAddToMeal={(mealId, servingsToAdd, mealName) => {
                addToMeal.mutate(
                  { recipe, mealId, servingsToAdd },
                  {
                    onSuccess: () => {
                      haptics.tap()
                      show(`Added to ${mealName}`)
                    },
                  },
                )
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function RecipeCard({
  recipe,
  isOwner,
  currentMeals,
  onDelete,
  onSetShared,
  onAddToMeal,
}: {
  recipe: RecipeWithIngredients
  isOwner: boolean
  currentMeals: MealWithItems[]
  onDelete: () => void
  onSetShared: (isShared: boolean) => void
  onAddToMeal: (mealId: string, servingsToAdd: number, mealName: string) => void
}) {
  const updateServings = useUpdateRecipeServings()
  const [servingsToAdd, setServingsToAdd] = useState(1)

  const macros = computeRecipeMacros(recipe.recipe_ingredients)
  const perServing = macros.perServing(recipe.servings)

  return (
    <div className="rounded-xl bg-slate-800/60 p-3">
      <div className="mb-1 flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">{recipe.name}</h4>
        {isOwner && (
          <button onClick={onDelete} className="text-red-400 hover:text-red-300">
            ×
          </button>
        )}
      </div>
      <p className="mb-2 text-xs text-slate-400">{recipe.recipe_ingredients.map((i) => i.food.name).join(', ')}</p>

      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs text-slate-500">Servings</span>
        {isOwner ? (
          <input
            type="number"
            min={1}
            value={recipe.servings}
            onChange={(e) => updateServings.mutate({ recipeId: recipe.id, servings: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            className="w-16 rounded-xl border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
        ) : (
          <span className="text-xs text-slate-300">{recipe.servings}</span>
        )}
      </div>

      <div className="mb-2 rounded-xl bg-slate-900/60 px-3 py-2">
        <p className="text-xs text-slate-400">
          Total: {Math.round(macros.total.calories)} kcal · Per serving: {Math.round(perServing.calories)} kcal
        </p>
        <MacroLine macros={perServing} />
      </div>

      {isOwner ? (
        <label className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={recipe.is_shared}
            onChange={(e) => onSetShared(e.target.checked)}
            className="h-3.5 w-3.5 accent-emerald-500"
          />
          Shared with friend
        </label>
      ) : (
        <p className="mb-2 text-xs text-emerald-400">Shared by a friend</p>
      )}

      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs text-slate-500">Add</span>
        <input
          type="number"
          min={1}
          value={servingsToAdd}
          onChange={(e) => setServingsToAdd(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="w-16 rounded-xl border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none"
        />
        <span className="text-xs text-slate-500">serving(s) to:</span>
      </div>

      {currentMeals.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {currentMeals.map((meal) => (
            <button
              key={meal.id}
              onClick={() => onAddToMeal(meal.id, servingsToAdd, meal.name)}
              className="rounded-xl bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600"
            >
              → {meal.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">Add a meal on the Meals tab first, then come back to add recipe servings to it.</p>
      )}
    </div>
  )
}
