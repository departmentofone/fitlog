import { useMemo, useState } from 'react'
import { useShareGate } from '../../hooks/useShareGate'
import { EmptyState } from '../../components/EmptyState'
import { MacroLine } from '../../components/MacroLine'
import { SkeletonRow } from '../../components/Skeleton'
import { useToast } from '../../components/ToastProvider'
import { useDiets } from '../../hooks/useDiets'
import {
  useAddMealPlanItem,
  useCombineIntoWeek,
  useCreateMealPlan,
  useDeleteMealPlan,
  useLogPlanDay,
  useMealPlans,
  useRemoveMealPlanItem,
  useRestoreMealPlan,
  useUpdateMealPlan,
} from '../../hooks/useMealPlans'
import { todayISO } from '../../hooks/useWorkouts'
import { haptics } from '../../lib/haptics'
import { averageDay, DEFAULT_PLAN_MEALS, groupPlan, nextMealOrder } from '../../lib/mealPlans'
import { UNAVAILABLE_FOOD_NAME, type MealPlanWithItems } from '../../types'
import { FoodPicker } from '../meals/FoodPicker'

const INPUT = 'min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none'

/** Where an "add food" goes: which plan, day and meal slot, and where in that meal. */
interface AddTarget {
  planId: string
  dayIndex: number
  mealName: string
  mealOrder: number
  itemOrder: number
}

function PlanCard({ plan, dietName, open, onToggle }: { plan: MealPlanWithItems; dietName: string | null; open: boolean; onToggle: () => void }) {
  const { show, undoable } = useToast()
  const update = useUpdateMealPlan()
  const del = useDeleteMealPlan()
  const restore = useRestoreMealPlan()
  const addItem = useAddMealPlanItem()
  const removeItem = useRemoveMealPlanItem()
  const logDay = useLogPlanDay()
  const gate = useShareGate()

  const [day, setDay] = useState(0)
  const [adding, setAdding] = useState<AddTarget | null>(null)
  const [newMeal, setNewMeal] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)

  const days = useMemo(() => groupPlan(plan.meal_plan_items, plan.days), [plan.meal_plan_items, plan.days])
  const avg = averageDay(days)
  const current = days[Math.min(day, days.length - 1)]
  const unusedMeals = DEFAULT_PLAN_MEALS.filter((m) => !current.meals.some((x) => x.name.toLowerCase() === m.toLowerCase()))

  function startMeal(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const existing = current.meals.find((m) => m.name.toLowerCase() === trimmed.toLowerCase())
    setAdding({
      planId: plan.id,
      dayIndex: current.index,
      mealName: existing?.name ?? trimmed,
      mealOrder: existing?.order ?? nextMealOrder(plan.meal_plan_items, current.index),
      itemOrder: existing?.items.length ?? 0,
    })
    setNewMeal(null)
  }

  return (
    <div className="rounded-2xl border-t border-white/10 bg-slate-900 p-3 ring-1 ring-white/5">
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-start justify-between gap-3 text-left">
        <span className="min-w-0">
          {renaming !== null ? (
            <input
              autoFocus
              value={renaming}
              onChange={(e) => setRenaming(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => {
                if (renaming.trim() && renaming.trim() !== plan.name) update.mutate({ planId: plan.id, name: renaming.trim() })
                setRenaming(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          ) : (
            <span className="block text-sm font-medium text-white">{plan.name}</span>
          )}
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">{plan.days === 1 ? '1 day' : `${plan.days} days`}</span>
            {dietName && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-400">{dietName} sample</span>}
            {plan.is_shared && !dietName && <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] text-sky-400">Shared</span>}
          </span>
        </span>
        <span className="shrink-0 text-right text-xs text-slate-400">
          {plan.days > 1 && '~'}
          {Math.round(avg.calories).toLocaleString()} kcal
          {plan.days > 1 && <span className="block text-[11px] text-slate-500">per day</span>}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-white/5 pt-3">
          {plan.days > 1 && (
            <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Day">
              {days.map((d) => (
                <button
                  key={d.index}
                  role="tab"
                  aria-selected={d.index === current.index}
                  onClick={() => {
                    setDay(d.index)
                    setAdding(null)
                  }}
                  className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-semibold ${
                    d.index === current.index ? 'bg-emerald-600 text-on-accent' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Day {d.index + 1}
                </button>
              ))}
            </div>
          )}

          {current.meals.length === 0 && !adding && <p className="text-xs text-slate-500">Nothing planned for this day yet - add a meal below.</p>}

          {current.meals.map((meal) => (
            <div key={meal.name} className="rounded-xl bg-slate-800/50 p-2.5">
              <p className="mb-1 flex justify-between text-xs font-semibold text-slate-300">
                <span>{meal.name}</span>
                <span className="font-normal text-slate-500">{Math.round(meal.totals.calories)} kcal</span>
              </p>
              <ul className="space-y-0.5">
                {meal.items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate text-slate-200">{i.food?.name ?? UNAVAILABLE_FOOD_NAME}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      <span className="text-xs text-slate-500">{i.serving_label ?? `${Math.round(i.grams)} g`}</span>
                      <button
                        onClick={() =>
                          undoable(
                            `Removed ${i.food?.name ?? UNAVAILABLE_FOOD_NAME}`,
                            () => removeItem.mutate(i.id),
                            () =>
                              addItem.mutate({
                                planId: plan.id, dayIndex: i.day_index, mealName: i.meal_name, mealOrder: i.meal_order,
                                itemOrder: i.item_order, foodId: i.food_id, grams: i.grams, servingLabel: i.serving_label,
                              }),
                          )
                        }
                        aria-label={`Remove ${i.food?.name ?? UNAVAILABLE_FOOD_NAME}`}
                        className="flex h-8 w-8 items-center justify-center text-slate-500 active:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
              {adding?.mealName === meal.name ? null : (
                <button onClick={() => startMeal(meal.name)} className="mt-1 min-h-8 text-xs font-medium text-emerald-400">
                  + Add food to {meal.name}
                </button>
              )}
            </div>
          ))}

          {adding && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-400">Adding to {adding.mealName}</p>
              <FoodPicker
                onCancel={() => setAdding(null)}
                onAdd={(input) => {
                  addItem.mutate({ ...adding, ...input })
                  setAdding(null)
                }}
              />
            </div>
          )}

          {!adding &&
            (newMeal !== null ? (
              <div className="flex gap-2">
                <input autoFocus value={newMeal} onChange={(e) => setNewMeal(e.target.value)} placeholder="Meal name, e.g. Pre-workout" className={INPUT} maxLength={60} />
                <button onClick={() => startMeal(newMeal)} disabled={!newMeal.trim()} className="shrink-0 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-on-accent disabled:opacity-50">
                  Add
                </button>
                <button onClick={() => setNewMeal(null)} className="shrink-0 rounded-xl bg-slate-800 px-3 text-sm text-slate-300">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {unusedMeals.map((m) => (
                  <button key={m} onClick={() => startMeal(m)} className="min-h-9 rounded-full border border-dashed border-slate-700 px-3 text-xs font-medium text-slate-300">
                    + {m}
                  </button>
                ))}
                <button onClick={() => setNewMeal('')} className="min-h-9 rounded-full border border-dashed border-slate-700 px-3 text-xs font-medium text-slate-300">
                  + Other meal
                </button>
              </div>
            ))}

          {current.meals.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {plan.days > 1 ? `Day ${current.index + 1}` : 'Day'} total: <span className="font-semibold text-slate-200">{Math.round(current.totals.calories).toLocaleString()} kcal</span>
              </span>
              <MacroLine macros={current.totals} />
            </div>
          )}

          <button
            disabled={current.meals.length === 0 || logDay.isPending}
            onClick={() =>
              logDay.mutate(
                { plan, dayIndex: current.index, date: todayISO() },
                {
                  onSuccess: (count) => {
                    haptics.success()
                    show(`Added ${count} food${count === 1 ? '' : 's'} to today's meals`)
                  },
                  onError: () => show("Couldn't add that to today. Try again.", { tone: 'error' }),
                },
              )
            }
            className="min-h-11 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-on-accent disabled:opacity-50"
          >
            {logDay.isPending ? 'Adding…' : plan.days > 1 ? `Log day ${current.index + 1} to today` : 'Log this day to today'}
          </button>

          <div className="flex items-center justify-between gap-3 text-xs">
            {dietName ? (
              <span className="text-slate-500">Shared along with the {dietName} diet</span>
            ) : (
              <label className="flex items-center gap-1.5 text-slate-400">
                <input type="checkbox" checked={plan.is_shared} onChange={(e) => gate.request(e.target.checked, (on) => update.mutate({ planId: plan.id, is_shared: on }))} className="h-4 w-4 accent-emerald-500" />
                Share to Community
              </label>
            )}
            <span className="flex gap-3">
              <button onClick={() => setRenaming(plan.name)} className="min-h-9 text-slate-400">
                Rename
              </button>
              <button
                onClick={() => undoable(`Deleted "${plan.name}"`, () => del.mutate(plan.id), () => restore.mutate(plan))}
                className="min-h-9 text-red-400"
              >
                Delete
              </button>
            </span>
          </div>
        </div>
      )}
      {gate.sheet}
    </div>
  )
}

/**
 * Meal plans: one day of meals with amounts, or up to seven combined into a week. "Log this day"
 * puts a day's food into today's meals. Plans that belong to a diet (its sample days) are marked.
 */
export function MealPlansView() {
  const { data: plans = [], isLoading } = useMealPlans()
  const { data: diets = [] } = useDiets()
  const create = useCreateMealPlan()
  const combine = useCombineIntoWeek()
  const { show } = useToast()

  const [creating, setCreating] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [combining, setCombining] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [weekName, setWeekName] = useState('My week')

  const dietName = (id: string | null) => (id ? diets.find((d) => d.id === id)?.name ?? null : null)
  const dayPlans = plans.filter((p) => p.days === 1 && p.meal_plan_items.length > 0)

  return (
    <div className="space-y-3">
      {combining ? (
        <div className="space-y-3 rounded-2xl border-t border-white/10 bg-slate-900 p-3 ring-1 ring-white/5">
          <div>
            <h3 className="text-sm font-semibold text-white">Combine into a week</h3>
            <p className="text-xs text-slate-400">Tap day plans in the order you want them (up to 7). The originals stay as they are.</p>
          </div>
          <input value={weekName} onChange={(e) => setWeekName(e.target.value)} placeholder="Week name" maxLength={100} className={`${INPUT} w-full`} />
          <div className="space-y-1.5">
            {dayPlans.map((p) => {
              const pos = picked.indexOf(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => setPicked((cur) => (pos >= 0 ? cur.filter((x) => x !== p.id) : cur.length < 7 ? [...cur, p.id] : cur))}
                  aria-pressed={pos >= 0}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm ${pos >= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800/60 text-slate-200'}`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${pos >= 0 ? 'bg-emerald-600 text-on-accent' : 'bg-slate-700 text-slate-400'}`}>
                    {pos >= 0 ? pos + 1 : ''}
                  </span>
                  <span className="min-w-0 truncate">{p.name}</span>
                </button>
              )
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCombining(false)} className="min-h-11 flex-1 rounded-xl bg-slate-800 text-sm text-slate-300">
              Cancel
            </button>
            <button
              disabled={picked.length < 2 || !weekName.trim() || combine.isPending}
              onClick={() =>
                combine.mutate(
                  { name: weekName.trim(), plans: picked.map((id) => plans.find((p) => p.id === id)!) },
                  {
                    onSuccess: (id) => {
                      haptics.success()
                      show(`Created "${weekName.trim()}" with ${picked.length} days`)
                      setCombining(false)
                      setPicked([])
                      setOpenId(id)
                    },
                    onError: () => show("Couldn't create the week. Try again.", { tone: 'error' }),
                  },
                )
              }
              className="min-h-11 flex-1 rounded-xl bg-emerald-600 text-sm font-semibold text-on-accent disabled:opacity-50"
            >
              {picked.length < 2 ? 'Pick at least 2' : `Create ${picked.length}-day plan`}
            </button>
          </div>
        </div>
      ) : creating !== null ? (
        <div className="flex gap-2 rounded-2xl border-t border-white/10 bg-slate-900 p-3 ring-1 ring-white/5">
          <input autoFocus value={creating} onChange={(e) => setCreating(e.target.value)} placeholder='Plan name, e.g. "Training day"' maxLength={100} className={INPUT} />
          <button
            disabled={!creating.trim() || create.isPending}
            onClick={() =>
              create.mutate(
                { name: creating.trim() },
                {
                  onSuccess: (id) => {
                    setCreating(null)
                    setOpenId(id)
                  },
                },
              )
            }
            className="shrink-0 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-on-accent disabled:opacity-50"
          >
            Create
          </button>
          <button onClick={() => setCreating(null)} className="shrink-0 rounded-xl bg-slate-800 px-3 text-sm text-slate-300">
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setCreating('')}
            className="min-h-11 flex-1 rounded-xl border border-dashed border-slate-700 text-sm font-medium text-slate-300 active:border-emerald-500 active:text-emerald-400"
          >
            + New day plan
          </button>
          {dayPlans.length >= 2 && (
            <button
              onClick={() => {
                setPicked([])
                setCombining(true)
              }}
              className="min-h-11 flex-1 rounded-xl border border-dashed border-slate-700 text-sm font-medium text-slate-300 active:border-emerald-500 active:text-emerald-400"
            >
              Combine into a week
            </button>
          )}
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}
      {!isLoading && plans.length === 0 && (
        <EmptyState variant="calendar" message="No meal plans yet. Make a day plan above, or save one from Community." />
      )}

      <div className="space-y-2">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            dietName={dietName(plan.diet_id)}
            open={openId === plan.id}
            onToggle={() => setOpenId(openId === plan.id ? null : plan.id)}
          />
        ))}
      </div>
    </div>
  )
}
