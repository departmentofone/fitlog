import { useRef, useState } from 'react'
import { MacroLine } from '../../components/MacroLine'
import { SwipeToDelete } from '../../components/SwipeToDelete'
import { useToast } from '../../components/ToastProvider'
import {
  useAddMealItem,
  useDeleteMealItem,
  useSetMealCompleted,
  useSignedMealPhotoUrl,
  useUploadMealPhoto,
  type MealWithItems,
} from '../../hooks/useMeals'
import { haptics } from '../../lib/haptics'
import { macrosForGrams, microsForGrams, sumMacros, sumMicros, UNAVAILABLE_FOOD_NAME } from '../../types'
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
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-slate-700 text-slate-500 transition hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-50"
          title="Add photo"
        >
          {uploadPhoto.isPending ? (
            <span className="text-[11px]">…</span>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-3.5 w-3.5">
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
  const [adding, setAdding] = useState(false)
  const addItem = useAddMealItem()
  const deleteItem = useDeleteMealItem()
  const setCompleted = useSetMealCompleted()
  const { undoable } = useToast()

  const totals = sumMacros(meal.meal_items.map((i) => macrosForGrams(i.food, i.grams)))
  const micros = sumMicros(meal.meal_items.map((i) => microsForGrams(i.food, i.grams)))

  if (meal.completed) {
    return (
      <div className="w-full rounded-2xl bg-slate-900/70 border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5 transition hover:ring-emerald-500/30">
        <button
          onClick={() => setCompleted.mutate({ mealId: meal.id, completed: false })}
          className="block w-full text-left"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3 className="font-medium text-white">{meal.name}</h3>
            <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-400">Done</span>
          </div>
          <p className="mb-1 text-sm text-slate-400">
            {meal.meal_items.length} item{meal.meal_items.length === 1 ? '' : 's'} ·{' '}
            <span className="font-semibold text-emerald-400">{Math.round(totals.calories)} kcal</span>
          </p>
          <MacroLine macros={totals} />
          <p className="mt-1 text-xs text-slate-500">
            Fiber {Math.round(micros.fiber)}g · Sodium {Math.round(micros.sodium)}mg · Sugar {Math.round(micros.sugar)}g
          </p>
        </button>
        <div className="mt-2 flex justify-end">
          <MealPhotoControl meal={meal} />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-slate-900 border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-medium text-white">{meal.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-400">{Math.round(totals.calories)} kcal</span>
          <MealPhotoControl meal={meal} />
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
                }),
            )
          return (
            <SwipeToDelete key={item.id} onDelete={removeItem} className="rounded-xl">
              <div className="flex items-center justify-between rounded-xl bg-slate-800/60 px-3 py-2 text-sm text-slate-300">
                <span>
                  {item.food?.name ?? UNAVAILABLE_FOOD_NAME} · {item.serving_label ?? `${item.grams}g`}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{Math.round(m.calories)} kcal</span>
                  <button onClick={removeItem} className="text-red-400 hover:text-red-300">
                    ×
                  </button>
                </div>
              </div>
            </SwipeToDelete>
          )
        })}
        {meal.meal_items.length === 0 && <p className="text-sm text-slate-500">No items yet.</p>}
      </div>

      <MacroLine macros={totals} className="mb-3" />

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
            className="flex-1 rounded-xl border border-dashed border-slate-700 py-2 text-sm font-medium text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
          >
            + Add food
          </button>
          {meal.meal_items.length > 0 && (
            <button
              onClick={() => {
                haptics.success()
                setCompleted.mutate({ mealId: meal.id, completed: true })
              }}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-on-accent transition hover:brightness-90"
            >
              Done
            </button>
          )}
        </div>
      )}
    </div>
  )
}
