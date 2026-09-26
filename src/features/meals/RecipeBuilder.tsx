import { parseDecimal, formatWhole } from '../../lib/number'
import { useShareGate } from '../../hooks/useShareGate'
import { useState } from 'react'
import { UNAVAILABLE_FOOD_NAME } from '../../types'
import { EmptyState } from '../../components/EmptyState'
import { MacroLine } from '../../components/MacroLine'
import { SkeletonRow } from '../../components/Skeleton'
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
  useRescaleRecipe,
  useSetRecipeShared,
  type RecipeIngredientWithFood,
  type RecipeWithIngredients,
} from '../../hooks/useRecipes'
import { haptics } from '../../lib/haptics'
import { foodUnitLabel, fromDisplayFoodAmount, toDisplayFoodAmount } from '../../lib/units'
import { useUserSettings } from '../../hooks/useUserSettings'
import type { Food } from '../../types'

interface DraftIngredient {
  food: Food
  grams: number
  /** Exactly what's in the field (g or oz), so a half-typed "62," keeps its comma (grams holds the parsed value). */
  gramsInput?: string
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
  const gate = useShareGate()
  const addToMeal = useAddRecipeToMeal()
  const { show, undoable } = useToast()
  const { data: settings } = useUserSettings()
  const unit = settings?.unit_system

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

  function updateDraftGrams(index: number, input: string) {
    const parsed = parseDecimal(input)
    const grams = Number.isFinite(parsed) && parsed > 0 ? fromDisplayFoodAmount(parsed, unit) : 0
    setDraft((cur) => cur.map((d, i) => (i === index ? { ...d, grams, gramsInput: input } : d)))
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

      <div className="card p-4">
        <h3 className="mb-3 font-medium text-white">New recipe</h3>
        <div className="mb-3 space-y-2.5">
          <input
            placeholder="Recipe name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full field px-3 py-2.5"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Servings</span>
            <input
              type="text"
              inputMode="decimal"
              min={1}
              value={servings}
              onChange={(e) => setServings(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-20 field px-3 py-2"
            />
          </div>
        </div>

        <input
          placeholder="Search foods…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full field px-3 py-2.5"
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
                  type="text"
                  inputMode="decimal"
                  value={d.gramsInput ?? String(toDisplayFoodAmount(d.grams, unit))}
                  onChange={(e) => updateDraftGrams(i, e.target.value)}
                  className="w-20 rounded-xl border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-500">{foodUnitLabel(unit)}</span>
                <button onClick={() => removeDraftIngredient(i)} className="text-red-400 hover:text-red-300">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {draft.length > 0 && (
          <div className="mb-3 rounded-xl bg-slate-800/60 px-3 py-2">
            <p className="mb-1 text-sm font-medium text-white">{formatWhole(draftMacros.total.calories)} kcal total</p>
            <MacroLine macros={draftMacros.total} />
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!name.trim() || draft.length === 0 || createRecipe.isPending}
          className="btn btn-primary w-full py-2.5"
        >
          Save recipe
        </button>
      </div>

      <div className="card card-glow p-4">
        <h3 className="mb-3 font-medium text-white">Your recipes</h3>
        {isLoading && (
          <div className="space-y-2">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}
        {!isLoading && recipes.length === 0 && (
          <EmptyState variant="folder" message="No recipes yet — build one above." />
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
              onSetShared={(isShared) => gate.request(isShared, (on) => setShared.mutate({ recipeId: recipe.id, isShared: on }))}
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
      {gate.sheet}
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
  const rescaleRecipe = useRescaleRecipe()
  const [servingsToAdd, setServingsToAdd] = useState(1)

  const macros = computeRecipeMacros(recipe.recipe_ingredients)
  const perServing = macros.perServing(recipe.servings)

  function handleRescale(newServings: number) {
    if (!Number.isFinite(newServings) || newServings <= 0) return
    rescaleRecipe.mutate({ recipe, newServings })
  }

  return (
    <div className="inset p-3">
      <div className="mb-1 flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">{recipe.name}</h4>
        {isOwner && (
          <button onClick={onDelete} className="text-red-400 hover:text-red-300">
            ×
          </button>
        )}
      </div>
      <p className="mb-2 text-xs text-slate-400">{recipe.recipe_ingredients.map((i) => i.food?.name ?? UNAVAILABLE_FOOD_NAME).join(', ')}</p>

      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs text-slate-500">Servings</span>
        {isOwner ? (
          <>
            <input
              key={recipe.servings}
              type="text"
              inputMode="decimal"
              min={0.1}
              step="any"
              defaultValue={recipe.servings}
              onBlur={(e) => handleRescale(parseDecimal(e.target.value))}
              disabled={rescaleRecipe.isPending}
              className="w-16 rounded-xl border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => handleRescale(recipe.servings * 0.5)}
              disabled={rescaleRecipe.isPending}
              className="rounded-lg bg-slate-700 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-600 disabled:opacity-50"
              title="Halve the recipe"
            >
              ×0.5
            </button>
            <button
              type="button"
              onClick={() => handleRescale(recipe.servings * 2)}
              disabled={rescaleRecipe.isPending}
              className="rounded-lg bg-slate-700 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-600 disabled:opacity-50"
              title="Double the recipe"
            >
              ×2
            </button>
          </>
        ) : (
          <span className="text-xs text-slate-300">{recipe.servings}</span>
        )}
      </div>

      <div className="mb-2 rounded-xl bg-slate-900/60 px-3 py-2">
        <p className="text-xs text-slate-400">
          Total: {formatWhole(macros.total.calories)} kcal · Per serving: {Math.round(perServing.calories)} kcal
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
          Share to Community
        </label>
      ) : (
        <p className="mb-2 text-xs text-emerald-400">From Community</p>
      )}

      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs text-slate-500">Add</span>
        <input
          type="text"
          inputMode="decimal"
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
