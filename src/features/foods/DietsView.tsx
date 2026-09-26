import { useState } from 'react'
import { useShareGate } from '../../hooks/useShareGate'
import { EmptyState } from '../../components/EmptyState'
import { SkeletonRow } from '../../components/Skeleton'
import { useToast } from '../../components/ToastProvider'
import {
  useActiveDiet,
  useAddDietFood,
  useCreateDiet,
  useDeleteDiet,
  useDiets,
  useFollowDiet,
  useRemoveDietFood,
  useUpdateDiet,
} from '../../hooks/useDiets'
import { useMealPlans } from '../../hooks/useMealPlans'
import { UNAVAILABLE_FOOD_NAME, type DietWithFoods } from '../../types'
import { FoodSearchPanel } from '../meals/FoodSearchPanel'
import { NewFoodForm } from '../meals/NewFoodForm'

const INPUT = 'w-full field px-3 py-2.5 '

function DietCard({ diet, samples, following, open, onToggle }: { diet: DietWithFoods; samples: number; following: boolean; open: boolean; onToggle: () => void }) {
  const { show, undoable } = useToast()
  const { follow, isPending: followPending } = useFollowDiet()
  const update = useUpdateDiet()
  const del = useDeleteDiet()
  const addFood = useAddDietFood()
  const removeFood = useRemoveDietFood()
  const gate = useShareGate()

  const [adding, setAdding] = useState(false)
  const [creatingFood, setCreatingFood] = useState(false)
  const [search, setSearch] = useState('')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const foods = [...diet.diet_foods].sort((a, b) => (a.food?.name ?? '').localeCompare(b.food?.name ?? ''))

  function add(foodId: string, name: string) {
    addFood.mutate({ dietId: diet.id, foodId }, { onSuccess: () => show(`Added ${name}`) })
  }

  return (
    <div className={`rounded-2xl border-t border-white/10 bg-slate-900 p-3 ring-1 ${following ? 'ring-emerald-500/40' : 'ring-white/5'}`}>
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-start justify-between gap-3 text-left">
        <span className="min-w-0">
          {renaming !== null ? (
            <input
              autoFocus
              value={renaming}
              onChange={(e) => setRenaming(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => {
                if (renaming.trim() && renaming.trim() !== diet.name) update.mutate({ dietId: diet.id, name: renaming.trim() })
                setRenaming(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              maxLength={100}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          ) : (
            <span className="block text-sm font-medium text-white">{diet.name}</span>
          )}
          <span className="mt-0.5 block text-xs text-slate-400">
            {diet.diet_foods.length} food{diet.diet_foods.length === 1 ? '' : 's'}
            {samples > 0 && ` · ${samples} sample day${samples === 1 ? '' : 's'} in Plans`}
          </span>
        </span>
        {following && <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">Following</span>}
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-white/5 pt-3">
          {diet.description && <p className="text-sm text-slate-400">{diet.description}</p>}

          <button
            onClick={() => follow(following ? null : diet.id)}
            disabled={followPending}
            className={`min-h-11 w-full rounded-xl text-sm font-semibold disabled:opacity-50 ${following ? 'bg-slate-800 text-slate-300' : 'bg-emerald-600 text-on-accent'}`}
          >
            {following ? 'Stop following' : 'Follow this diet'}
          </button>

          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-400">Foods on this diet</p>
            {foods.length === 0 && <p className="text-xs text-slate-500">No foods yet - add some below.</p>}
            <div className="flex flex-wrap gap-1.5">
              {foods.map((f) => (
                <button
                  key={f.food_id}
                  onClick={() =>
                    undoable(
`Removed ${f.food?.name ?? UNAVAILABLE_FOOD_NAME}`,
                      () => removeFood.mutate({ dietId: diet.id, foodId: f.food_id }),
                      () => addFood.mutate({ dietId: diet.id, foodId: f.food_id }),
                    )
                  }
                  aria-label={`Remove ${f.food?.name ?? UNAVAILABLE_FOOD_NAME} from ${diet.name}`}
                  className="flex min-h-8 items-center gap-1 rounded-full bg-slate-800 px-2.5 text-xs text-slate-200 active:bg-slate-700"
                >
                  {f.food?.name ?? UNAVAILABLE_FOOD_NAME}
                  <span aria-hidden="true" className="text-slate-500">×</span>
                </button>
              ))}
            </div>
          </div>

          {creatingFood ? (
            <NewFoodForm
              onCancel={() => setCreatingFood(false)}
              onSaved={(food) => {
                setCreatingFood(false)
                add(food.id, food.name)
              }}
            />
          ) : adding ? (
            <FoodSearchPanel
              search={search}
              onSearchChange={setSearch}
              onSelectFood={(food) => {
                add(food.id, food.name)
                setSearch('')
              }}
              onCreateNew={() => setCreatingFood(true)}
              onCancel={() => {
                setAdding(false)
                setSearch('')
              }}
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="min-h-10 w-full rounded-xl border border-dashed border-slate-700 text-sm font-medium text-slate-300 active:border-emerald-500 active:text-emerald-400"
            >
              + Add foods
            </button>
          )}

          <div className="flex items-center justify-between gap-3 text-xs">
            <label className="flex items-center gap-1.5 text-slate-400">
              <input type="checkbox" checked={diet.is_shared} onChange={(e) => gate.request(e.target.checked, (on) => update.mutate({ dietId: diet.id, is_shared: on }))} className="h-4 w-4 accent-emerald-500" />
              Share to Community
            </label>
{gate.sheet}
            <span className="flex gap-3">
              <button onClick={() => setRenaming(diet.name)} className="min-h-9 text-slate-400">
                Rename
              </button>
              {/* Two taps rather than undo: bringing back a diet would also mean rebuilding its sample plans. */}
              <button
                onClick={() => {
                  if (!confirmDelete) return setConfirmDelete(true)
                  del.mutate(diet.id, { onSuccess: () => show(`Deleted "${diet.name}"`) })
                }}
                onBlur={() => setConfirmDelete(false)}
                className={`min-h-9 rounded-lg px-2 ${confirmDelete ? 'bg-red-600 font-semibold text-on-accent' : 'text-red-400'}`}
              >
                {confirmDelete ? 'Tap again to delete' : 'Delete'}
              </button>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Diets: a list of foods you eat on it. Following one puts its foods first when you add food
 * (with a toggle to show only them) and flags logged foods that aren't on it.
 */
export function DietsView() {
  const { data: diets = [], isLoading } = useDiets()
  const { data: plans = [] } = useMealPlans()
  const { diet: active } = useActiveDiet()
  const { follow } = useFollowDiet()
  const create = useCreateDiet()

  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {active ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-500/10 p-3 ring-1 ring-emerald-500/30">
          <p className="text-sm text-slate-300">
            Following <span className="font-semibold text-emerald-400">{active.name}</span>. Its foods come first when you add food, and
            anything else you log gets a small flag.
          </p>
          <button onClick={() => follow(null)} className="min-h-10 shrink-0 rounded-xl bg-slate-800 px-3 text-xs font-medium text-slate-300">
            Stop
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-400">
          Follow a diet to see its foods first when you log meals. Official ones like Mediterranean and Keto are in Community.
        </p>
      )}

      {creating ? (
        <div className="space-y-2 tile p-3">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder='Diet name, e.g. "Cutting staples"' maxLength={100} className={INPUT} />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What it's about (optional)"
            rows={2}
            maxLength={1000}
            className={`${INPUT} resize-none`}
          />
          <div className="flex gap-2">
            <button onClick={() => setCreating(false)} className="btn btn-secondary flex-1 text-sm">
              Cancel
            </button>
            <button
              disabled={!name.trim() || create.isPending}
              onClick={() =>
                create.mutate(
                  { name: name.trim(), description: description.trim() || null },
                  {
                    onSuccess: (id) => {
                      setCreating(false)
                      setName('')
                      setDescription('')
                      setOpenId(id)
                    },
                  },
                )
              }
              className="btn btn-primary flex-1 text-sm"
            >
              Create diet
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="min-h-11 w-full rounded-xl border border-dashed border-slate-700 text-sm font-medium text-slate-300 active:border-emerald-500 active:text-emerald-400"
        >
          + New diet
        </button>
      )}

      {isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}
      {!isLoading && diets.length === 0 && <EmptyState variant="list" message="No diets yet. Make one above, or follow one from Community." />}

      <div className="space-y-2">
        {diets.map((diet) => (
          <DietCard
            key={diet.id}
            diet={diet}
            samples={plans.filter((p) => p.diet_id === diet.id).length}
            following={active?.id === diet.id}
            open={openId === diet.id}
            onToggle={() => setOpenId(openId === diet.id ? null : diet.id)}
          />
        ))}
      </div>
    </div>
  )
}
