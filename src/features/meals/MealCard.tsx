import { formatWhole } from '../../lib/number'
import { useRef, useState } from 'react'
import { MacroLine } from '../../components/MacroLine'
import { SwipeToDelete } from '../../components/SwipeToDelete'
import { useToast } from '../../components/ToastProvider'
import {
  useAddMealItem,
  useDeleteMealItem,
  useUpdateMealItem,
  useSetMealCompleted,
  useSignedMealPhotoUrl,
  useUploadMealPhoto,
  type MealWithItems,
} from '../../hooks/useMeals'
import { haptics } from '../../lib/haptics'
import { formatFoodAmount } from '../../lib/units'
import { useUserSettings } from '../../hooks/useUserSettings'
import { macrosForGrams, sumMacros, UNAVAILABLE_FOOD_NAME } from '../../types'
import { useActiveDiet } from '../../hooks/useDiets'
import { FoodAmountForm } from './FoodAmountForm'
import { FoodPicker } from './FoodPicker'

/**
 * Small, unobtrusive control for attaching/viewing/replacing an optional photo on a meal.
 * Renders a subtle thumbnail once a photo exists, or a plain dashed "add photo" affordance
 * otherwise - same visual language as the app's other optional dashed-border actions.
 */
function MealPhotoControl({ meal }: { meal: MealWithItems }) {
  const uploadPhoto = useUploadMealPhoto()
  const { data: photoUrl } = useSignedMealPhotoUrl(meal.photo_path)
  const { show } = useToast()
  const inputRef = useRef<HTMLInputElement | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    uploadPhoto.mutate(
      { mealId: meal.id, date: meal.date, file, previousPath: meal.photo_path },
      { onError: () => show('Could not save the photo. Please try again.', { tone: 'error' }) },
    )
  }

  return (
    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {meal.photo_path && photoUrl ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploadPhoto.isPending}
          className="block h-9 w-9 overflow-hidden rounded-lg ring-1 ring-white/10 disabled:opacity-50"
          title="Replace photo"
        >
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploadPhoto.isPending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/5 hover:text-emerald-400 disabled:opacity-50"
          title="Add photo"
          aria-label="Add photo"
        >
          {uploadPhoto.isPending ? (
            <span className="text-[11px]">…</span>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9a2 2 0 0 1 2-2h1.17a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.31 4h3.38a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 17.83 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}

export function MealCard({ meal }: { meal: MealWithItems }) {
  const { data: settings } = useUserSettings()
  const [adding, setAdding] = useState(false)
  const addItem = useAddMealItem()
  const deleteItem = useDeleteMealItem()
  const updateItem = useUpdateMealItem()
  // The logged item whose amount is being edited in place (tap a row to fix a wrong amount).
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  // A finished meal is shown collapsed; tapping it opens it here (to check it or add a forgotten
  // food) without un-finishing it - it used to flip the meal back to "not done" with no warning.
  const [expanded, setExpanded] = useState(false)
  const setCompleted = useSetMealCompleted()
  const { undoable } = useToast()

  const totals = sumMacros(meal.meal_items.map((i) => macrosForGrams(i.food, i.grams)))
  const { diet, foodIds } = useActiveDiet()

  if (meal.completed && !expanded) {
    return (
      <div className="card flex items-center gap-3 py-3 pl-4 pr-2">
        <button onClick={() => setExpanded(true)} aria-label={`Open ${meal.name}`} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="5 12.5 10 17 19 7.5" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="card-title truncate">{meal.name}</span>
              <span className="shrink-0 text-sm font-semibold text-white">{formatWhole(totals.calories)} kcal</span>
            </span>
            <span className="flex items-baseline gap-1.5 text-xs text-slate-500">
              {meal.meal_items.length} item{meal.meal_items.length === 1 ? '' : 's'} ·
              <MacroLine macros={totals} as="span" />
            </span>
          </span>
        </button>
        <MealPhotoControl meal={meal} />
      </div>
    )
  }

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="card-title">{meal.name}</h3>
        <div className="flex items-center gap-2">
          {meal.meal_items.length > 0 && (
            <>
              <span className="text-xs text-emerald-400">{formatWhole(totals.calories)} kcal</span>
              <MealPhotoControl meal={meal} />
            </>
          )}
        </div>
      </div>

      <div className="mb-3 space-y-1">
        {meal.meal_items.map((item) => {
          const m = macrosForGrams(item.food, item.grams)
          const removeItem = () =>
            undoable(
`Removed ${item.food?.name ?? UNAVAILABLE_FOOD_NAME}`,
              () => deleteItem.mutate(item.id),
              () =>
                addItem.mutate({
                  mealId: meal.id,
                  foodId: item.food_id,
                  grams: item.grams,
                  servingLabel: item.serving_label,
                  createdAt: item.created_at,
                }),
            )
          if (editingItemId === item.id && item.food) {
            return (
              <FoodAmountForm
                key={item.id}
                food={item.food}
                initialGrams={item.grams}
                submitLabel="Save"
                backLabel="Cancel"
                onBack={() => setEditingItemId(null)}
                onAdd={({ grams, servingLabel }) => {
                  updateItem.mutate({ itemId: item.id, grams, servingLabel })
                  setEditingItemId(null)
                }}
              />
            )
          }
          const amount = item.serving_label ?? formatFoodAmount(item.grams, settings?.unit_system)
          return (
            <SwipeToDelete key={item.id} onDelete={removeItem} className="rounded-xl">
              <div className="flex items-center rounded-xl bg-slate-800/60 text-sm">
                {/* Tap the row to change the amount; swipe left (or the × button) to remove. */}
                <button
                  type="button"
                  disabled={!item.food}
                  onClick={() => setEditingItemId(item.id)}
                  aria-label={`Change amount of ${item.food?.name ?? UNAVAILABLE_FOOD_NAME}`}
                  className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-3 py-2 pl-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-slate-200">{item.food?.name ?? UNAVAILABLE_FOOD_NAME}</span>
                    <span className="block text-xs text-slate-500">
                      {amount}
                      {diet && item.food && !foodIds.has(item.food_id) && (
                        <span className="ml-1.5 rounded bg-amber-500/15 px-1.5 py-px text-[10px] font-medium text-amber-400">Not on {diet.name}</span>
                      )}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-slate-300">{Math.round(m.calories)} kcal</span>
                </button>
                <button
                  type="button"
                  onClick={removeItem}
                  aria-label={`Remove ${item.food?.name ?? UNAVAILABLE_FOOD_NAME}`}
                  className="flex h-11 w-10 shrink-0 items-center justify-center text-slate-500 active:text-red-400"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </SwipeToDelete>
          )
        })}
        {meal.meal_items.length === 0 && (
          <p className="py-1 text-sm text-slate-500">Nothing logged yet — add what you ate below.</p>
        )}
      </div>

      {meal.meal_items.length > 0 && <MacroLine macros={totals} className="mb-3" />}

      {adding ? (
        <FoodPicker
          onCancel={() => setAdding(false)}
          onAdd={(input) => {
            haptics.tap()
            addItem.mutate({ mealId: meal.id, ...input })
            setAdding(false)
          }}
        />
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setAdding(true)}
            className="btn btn-secondary flex-1 text-sm"
          >
            + Add food
          </button>
          {meal.meal_items.length > 0 && (
            <button
              onClick={() => {
                // Already finished (opened to look or add something): just fold it back up.
                if (meal.completed) {
                  setExpanded(false)
                  return
                }
                haptics.success()
                setCompleted.mutate({ mealId: meal.id, completed: true })
              }}
              className="btn btn-primary text-sm"
            >
              Done
            </button>
          )}
        </div>
      )}
    </div>
  )
}
