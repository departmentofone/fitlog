import { formatWhole } from '../../lib/number'
import { useMemo, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { ExplainerCard } from '../../components/ExplainerCard'
import { COMMUNITY_EXPLAINERS } from '../../lib/explainers'
import { MacroLine } from '../../components/MacroLine'
import { SkeletonCard } from '../../components/Skeleton'
import { useToast } from '../../components/ToastProvider'
import {
  communitySearchText,
  REPORT_TYPE,
  useCommunity,
  useCommunityReports,
  useDismissReport,
  useIsSiteOwner,
  useModerateCommunityItem,
  useReportCommunityItem,
  useSaveCommunityItem,
  type CommunityItem,
  type CommunityKind,
} from '../../hooks/useCommunity'
import { GuidelinesSheet } from './GuidelinesSheet'
import { useMealPresets, useSetMealPresetShared } from '../../hooks/useMealPresets'
import { usePresets, useSetPresetShared } from '../../hooks/usePresets'
import { useImportProgram, useSetProgramShared } from '../../hooks/usePrograms'
import { useActiveDiet, useDiets, useUpdateDiet } from '../../hooks/useDiets'
import { useMealPlans, useUpdateMealPlan } from '../../hooks/useMealPlans'
import { averageDay, groupPlan } from '../../lib/mealPlans'
import { computeRecipeMacros, useRecipes, useSetRecipeShared } from '../../hooks/useRecipes'
import { useUpdateSettings, useUserSettings } from '../../hooks/useUserSettings'
import { haptics } from '../../lib/haptics'
import { normalizeFoodText } from '../../lib/foodSearch'
import { displayWeightValue, formatFoodAmount, weightUnitLabel } from '../../lib/units'
import { macrosForGrams, sumMacros, UNAVAILABLE_EXERCISE_NAME, UNAVAILABLE_FOOD_NAME, type UnitSystem } from '../../types'

const FILTERS: { value: CommunityKind | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'diet', label: 'Diets' },
  { value: 'plan', label: 'Meal plans' },
  { value: 'meal', label: 'Meal presets' },
  { value: 'recipe', label: 'Recipes' },
  { value: 'workout', label: 'Workouts' },
  { value: 'program', label: 'Programs' },
]

const KIND_LABEL: Record<CommunityKind, string> = {
  meal: 'Meal preset',
  recipe: 'Recipe',
  workout: 'Workout',
  program: 'Program',
  plan: 'Meal plan',
  diet: 'Diet',
}
const SAVE_LABEL: Record<CommunityKind, string> = {
  meal: 'Save to my meal presets',
  recipe: 'Save to my recipes',
  workout: 'Save to my workout presets',
  program: 'Import program',
  plan: 'Save to my meal plans',
  diet: 'Follow this diet',
}

/** Where a saved copy shows up, for the confirmation toast. */
const SAVED_WHERE: Record<CommunityKind, string> = {
  meal: 'Meals → Presets',
  recipe: 'Meals → Recipes',
  workout: 'Workouts → Presets',
  program: 'your lists',
  plan: 'Foods → Plans',
  diet: 'Foods → Diets',
}

function kcal(n: number) {
  return Math.round(n).toLocaleString()
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function Summary({ item }: { item: CommunityItem }) {
  if (item.kind === 'meal') {
    const totals = sumMacros(item.meal.meal_preset_items.map((i) => macrosForGrams(i.food, i.grams)))
    return (
      <div className="space-y-0.5">
        <p className="text-xs text-slate-400">
          {plural(item.meal.meal_preset_items.length, 'food')} · <span className="font-semibold text-slate-200">{formatWhole(totals.calories)} kcal</span>
        </p>
        <MacroLine macros={totals} />
      </div>
    )
  }
  if (item.kind === 'recipe') {
    const servings = item.recipe.servings
    const perServing = computeRecipeMacros(item.recipe.recipe_ingredients).perServing(servings)
    return (
      <div className="space-y-0.5">
        <p className="text-xs text-slate-400">
          {plural(servings, 'serving')} · <span className="font-semibold text-slate-200">{Math.round(perServing.calories)} kcal</span> per serving
        </p>
        <MacroLine macros={perServing} />
      </div>
    )
  }
  if (item.kind === 'workout') {
    const items = item.workout.workout_preset_items
    const exercises = new Set(items.map((i) => i.exercise_id)).size
    const working = items.filter((i) => !i.is_warmup).length
    return <p className="text-xs text-slate-400">{plural(exercises, 'exercise')} · {plural(working, 'working set')}</p>
  }
  if (item.kind === 'plan') {
    const days = groupPlan(item.plan.meal_plan_items, item.plan.days)
    const avg = averageDay(days)
    return (
      <div className="space-y-0.5">
        {item.dietName && <p className="text-xs text-emerald-400">Sample day from the {item.dietName} diet</p>}
        <p className="text-xs text-slate-400">
          {plural(item.plan.days, 'day')} ·{' '}
          <span className="font-semibold text-slate-200">
            {item.plan.days > 1 ? '~' : ''}
            {kcal(avg.calories)} kcal
          </span>
          {item.plan.days > 1 ? ' per day' : ''}
        </p>
        <MacroLine macros={avg} />
      </div>
    )
  }
  if (item.kind === 'diet') {
    return (
      <p className="text-xs text-slate-400">
        {plural(item.diet.diet_foods.length, 'food')}
        {item.plans.length > 0 ? ` · ${plural(item.plans.length, 'sample day')}` : ''}
      </p>
    )
  }
  const p = item.program
  const parts = [plural(p.workouts.length, 'workout'), plural(p.recipes.length, 'recipe'), plural(p.meal_presets.length, 'meal preset')]
  return <p className="text-xs text-slate-400">{parts.join(' · ')}</p>
}

function Preview({ item, unit }: { item: CommunityItem; unit: UnitSystem | undefined }) {
  const row = 'flex items-baseline justify-between gap-3 py-1.5 text-sm'
  if (item.kind === 'meal' || item.kind === 'recipe') {
    const rows = item.kind === 'meal' ? item.meal.meal_preset_items : item.recipe.recipe_ingredients
    return (
      <ul className="divide-y divide-white/5">
        {rows.map((i) => (
          <li key={i.id} className={row}>
            <span className="min-w-0 text-slate-200">{i.food?.name ?? UNAVAILABLE_FOOD_NAME}</span>
            <span className="shrink-0 text-right text-xs text-slate-500">
              {i.serving_label ? `${i.serving_label} · ` : ''}
              {formatFoodAmount(i.grams, unit, 0)}
            </span>
          </li>
        ))}
      </ul>
    )
  }
  if (item.kind === 'workout') {
    // One line per exercise, in the order the preset lists them, sets as "weight × reps".
    const groups: { key: string; name: string; sets: string[] }[] = []
    for (const i of [...item.workout.workout_preset_items].sort((a, b) => a.set_number - b.set_number)) {
      let g = groups.find((x) => x.key === i.exercise_id)
      if (!g) {
        g = { key: i.exercise_id, name: i.exercise?.name ?? UNAVAILABLE_EXERCISE_NAME, sets: [] }
        groups.push(g)
      }
      const w = displayWeightValue(i.weight, unit)
      g.sets.push(`${i.is_warmup ? 'W ' : ''}${w > 0 ? `${w} × ` : ''}${i.reps}`)
    }
    return (
      <>
        <p className="pt-1.5 text-[11px] text-slate-500">Sets as {weightUnitLabel(unit)} × reps · W = warm-up</p>
        <ul className="divide-y divide-white/5">
          {groups.map((g) => (
            <li key={g.key} className="py-1.5">
              <p className="text-sm text-slate-200">{g.name}</p>
              <p className="font-mono text-xs text-slate-500">{g.sets.join(', ')}</p>
            </li>
          ))}
        </ul>
      </>
    )
  }
  if (item.kind === 'plan') {
    const days = groupPlan(item.plan.meal_plan_items, item.plan.days)
    return (
      <div className="space-y-3 py-1.5">
        {days.map((day) => (
          <div key={day.index}>
            {days.length > 1 && (
              <p className="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
                <span>Day {day.index + 1}</span>
                <span className="font-normal normal-case tracking-normal">{kcal(day.totals.calories)} kcal</span>
              </p>
            )}
            {day.meals.map((meal) => (
              <div key={meal.name} className="mb-1.5">
                <p className="flex justify-between text-xs font-medium text-slate-300">
                  <span>{meal.name}</span>
                  <span className="text-slate-500">{kcal(meal.totals.calories)} kcal</span>
                </p>
                <ul>
                  {meal.items.map((i) => (
                    <li key={i.id} className="flex items-baseline justify-between gap-3 py-0.5 text-sm">
                      <span className="min-w-0 text-slate-200">{i.food?.name ?? UNAVAILABLE_FOOD_NAME}</span>
                      <span className="shrink-0 text-xs text-slate-500">{i.serving_label ?? formatFoodAmount(i.grams, unit, 0)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }
  if (item.kind === 'diet') {
    const names = item.diet.diet_foods.map((f) => f.food?.name ?? UNAVAILABLE_FOOD_NAME).sort((a, b) => a.localeCompare(b))
    return (
      <div className="space-y-2.5 py-2">
        <div className="flex flex-wrap gap-1">
          {names.map((n, idx) => (
            <span key={`${n}-${idx}`} className="rounded-full bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300">
              {n}
            </span>
          ))}
        </div>
        {item.plans.length > 0 && (
          <p className="text-xs text-slate-400">
            Includes {item.plans.map((pl) => pl.name).join(', ')}. Saving adds {item.plans.length === 1 ? 'it' : 'them'} to Foods → Plans.
          </p>
        )}
      </div>
    )
  }
  const p = item.program
  const section = (title: string, names: string[]) =>
    names.length > 0 && (
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
        <ul className="space-y-0.5">
          {names.map((n, idx) => (
            <li key={`${n}-${idx}`} className="text-sm text-slate-200">
              {n}
            </li>
          ))}
        </ul>
      </div>
    )
  return (
    <div className="space-y-2.5 py-1">
      {section('Workouts', p.workouts.map((w) => `${w.name} (${plural(w.items.length, 'set')})`))}
      {section('Recipes', p.recipes.map((r) => r.name))}
      {section('Meal presets', p.meal_presets.map((m) => m.name))}
      {(p.diet_goal || p.calorie_goal != null) && (
        <p className="text-xs text-slate-400">
          Includes diet goals{p.calorie_goal != null ? ` · ${formatWhole(p.calorie_goal)} kcal/day` : ''}
        </p>
      )}
    </div>
  )
}

function CommunityCard({
  item,
  saved,
  following,
  unit,
  isOwner,
  onHidePerson,
}: {
  item: CommunityItem
  saved: boolean
  following: boolean
  unit: UnitSystem | undefined
  isOwner: boolean
  onHidePerson: () => void
}) {
  const { show } = useToast()
  const save = useSaveCommunityItem()
  const importProgram = useImportProgram()
  const report = useReportCommunityItem()
  const unshareMeal = useSetMealPresetShared()
  const unshareRecipe = useSetRecipeShared()
  const unshareWorkout = useSetPresetShared()
  const unshareProgram = useSetProgramShared()
  const updatePlan = useUpdateMealPlan()
  const updateDiet = useUpdateDiet()
  const moderate = useModerateCommunityItem()

  const [open, setOpen] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reason, setReason] = useState('')
  const [reported, setReported] = useState(false)
  const [imported, setImported] = useState(false)
  const [applyGoals, setApplyGoals] = useState(true)

  const hasGoals = item.kind === 'program' && (item.program.diet_goal != null || item.program.calorie_goal != null || item.program.water_goal_ml != null)
  const busy = save.isPending || importProgram.isPending
  const done = saved || imported

  function handleSave() {
    if (item.kind === 'program') {
      importProgram.mutate(
        { program: item.program, applyGoals: hasGoals && applyGoals },
        {
          onSuccess: () => {
            haptics.success()
            setImported(true)
            show(`Imported "${item.name}" - its presets and recipes are in your lists now`)
          },
          onError: () => show("Couldn't import that program. Try again.", { tone: 'error' }),
        },
      )
      return
    }
    saveCopy(item.kind === 'diet')
  }

  function saveCopy(follow: boolean) {
    if (item.kind === 'program') return
    save.mutate(
      { item, follow },
      {
        onSuccess: () => {
          haptics.success()
          show(
            follow
              ? `Following ${item.name} - its foods now come first when you add food`
              : `Saved "${item.name}" - find it in ${SAVED_WHERE[item.kind]}`,
          )
        },
        onError: () => show("Couldn't save that. Try again.", { tone: 'error' }),
      },
    )
  }

  function stopSharing() {
    const onSuccess = () => show(`"${item.name}" is no longer shared`)
    if (item.kind === 'meal') unshareMeal.mutate({ presetId: item.id, isShared: false }, { onSuccess })
    else if (item.kind === 'recipe') unshareRecipe.mutate({ recipeId: item.id, isShared: false }, { onSuccess })
    else if (item.kind === 'workout') unshareWorkout.mutate({ presetId: item.id, isShared: false }, { onSuccess })
    else if (item.kind === 'plan') updatePlan.mutate({ planId: item.id, is_shared: false }, { onSuccess })
    else if (item.kind === 'diet') updateDiet.mutate({ dietId: item.id, is_shared: false }, { onSuccess })
    else unshareProgram.mutate({ programId: item.id, isShared: false }, { onSuccess })
  }

  return (
    <article className="rounded-2xl border-t border-white/10 bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">{KIND_LABEL[item.kind]}</span>
        {item.isOfficial && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="5 12.5 10 17 19 7.5" />
            </svg>
            Official
          </span>
        )}
        {item.isMine && !item.isOfficial && <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-400">Yours</span>}
      </div>

      <h3 className="text-base font-semibold text-white">{item.name}</h3>
      {item.description && <p className="mt-0.5 text-sm text-slate-400">{item.description}</p>}
      <div className="mt-2">
        <Summary item={item} />
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-2 inline-flex min-h-9 items-center gap-1 text-xs font-medium text-slate-400"
      >
        {open ? 'Hide details' : "See what's inside"}
        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="fade-in mt-1 rounded-xl bg-slate-800/50 px-3 py-1">
          <Preview item={item} unit={unit} />
        </div>
      )}

      {item.isMine && !item.isOfficial ? (
        item.kind === 'plan' && item.dietName ? (
          // A sample day is shared along with its diet - stop sharing the diet to hide it.
          <p className="mt-3 text-xs text-slate-500">Shared with your {item.dietName} diet</p>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Shared by you</p>
            <button onClick={stopSharing} className="min-h-10 rounded-xl bg-slate-800 px-4 text-sm font-medium text-slate-300">
              Stop sharing
            </button>
          </div>
        )
      ) : (
        <div className="mt-3 space-y-2">
          {hasGoals && !done && (
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input type="checkbox" checked={applyGoals} onChange={(e) => setApplyGoals(e.target.checked)} className="h-4 w-4 accent-emerald-500" />
              Also apply its diet goals to my settings
            </label>
          )}
          <button
            onClick={handleSave}
            disabled={busy || done}
            className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition ${
              // Tonal, not solid: a solid green button on every card made the feed shout.
              done ? 'text-emerald-400 ring-1 ring-white/5' : 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 disabled:opacity-60'
            }`}
          >
            {done ? (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="5 12.5 10 17 19 7.5" />
                </svg>
                {item.kind === 'program' ? 'Imported' : following ? 'Following' : 'Saved to your account'}
              </>
            ) : busy ? (
              'Saving…'
            ) : (
              SAVE_LABEL[item.kind]
            )}
          </button>
          {item.kind === 'diet' && !done && (
            <div className="text-center">
              <button onClick={() => saveCopy(false)} disabled={busy} className="min-h-9 text-xs font-medium text-slate-400 disabled:opacity-50">
                Save without following
              </button>
            </div>
          )}

          {!item.isOfficial &&
            (reported ? (
              <p className="text-center text-xs text-slate-500">Reported - thanks for flagging it.</p>
            ) : reporting ? (
              <div className="space-y-2 rounded-xl bg-slate-800/50 p-3">
                <label htmlFor={`report-${item.id}`} className="block text-xs font-medium text-slate-400">
                  What's wrong with it? (optional)
                </label>
                <textarea
                  id={`report-${item.id}`}
                  rows={2}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. offensive name, spam, clearly wrong amounts"
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => setReporting(false)} className="min-h-10 flex-1 rounded-lg bg-slate-800 text-sm text-slate-300">
                    Cancel
                  </button>
                  <button
                    disabled={report.isPending}
                    onClick={() =>
                      report.mutate(
                        { item, reason },
                        {
                          onSuccess: () => {
                            setReported(true)
                            setReporting(false)
                          },
                          onError: () => show("Couldn't send the report. Try again.", { tone: 'error' }),
                        },
                      )
                    }
                    className="min-h-10 flex-1 rounded-lg bg-red-600 text-sm font-medium text-on-accent disabled:opacity-50"
                  >
                    Send report
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => setReporting(true)} className="min-h-9 text-xs text-slate-500 hover:text-red-400">
                  Report
                </button>
                <button onClick={onHidePerson} className="min-h-9 text-xs text-slate-500 hover:text-slate-300">
                  Hide items from this person
                </button>
              </div>
            ))}
          {isOwner && !item.isOfficial && (
            <button
              disabled={moderate.isPending}
              onClick={() =>
                moderate.mutate(
                  // A diet's sample day is shared through the diet, so take down the diet.
                  item.kind === 'plan' && item.dietName && item.plan.diet_id
                    ? { itemType: 'diet', itemId: item.plan.diet_id }
                    : { itemType: REPORT_TYPE[item.kind], itemId: item.id },
                  { onSuccess: () => show(`Removed "${item.name}" from Community`), onError: () => show("Couldn't remove it. Try again.", { tone: 'error' }) },
                )
              }
              className="min-h-10 w-full rounded-xl border border-red-500/40 text-xs font-semibold text-red-400 disabled:opacity-50"
            >
              Remove from Community (moderator)
            </button>
          )}
        </div>
      )}
    </article>
  )
}

/** Owner only: open reports, each with Remove (takes the item out of Community) or Dismiss. */
function ReportsPanel() {
  const { data: reports = [] } = useCommunityReports(true)
  const moderate = useModerateCommunityItem()
  const dismiss = useDismissReport()
  const { show } = useToast()
  if (reports.length === 0) return null
  return (
    <section className="rounded-2xl bg-red-500/5 p-3 ring-1 ring-red-500/30">
      <h3 className="mb-2 text-sm font-semibold text-white">
        Reports <span className="ml-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">{reports.length}</span>
      </h3>
      <ul className="space-y-2">
        {reports.map((r) => (
          <li key={r.id} className="rounded-xl bg-slate-900/70 p-2.5">
            <p className="text-sm text-white">{r.item_name ?? 'Unnamed item'}</p>
            <p className="text-xs text-slate-500">
              {r.item_type.replace('_', ' ')} · {new Date(r.created_at).toLocaleDateString()}
            </p>
            {r.reason && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-300">“{r.reason}”</p>}
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => moderate.mutate({ itemType: r.item_type, itemId: r.item_id }, { onSuccess: () => show('Removed from Community') })}
                className="min-h-9 flex-1 rounded-lg bg-red-600 text-xs font-semibold text-on-accent"
              >
                Remove item
              </button>
              <button onClick={() => dismiss.mutate(r.id)} className="min-h-9 flex-1 rounded-lg bg-slate-800 text-xs text-slate-300">
                Dismiss
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Browse and save presets, recipes, workouts and programs people have shared. Official FitLog
 * items come first. Sharing happens from each item's own screen ("Share to Community"), and your
 * shared items show here too, where you can stop sharing them.
 */
export function CommunityTab() {
  const { data: items = [], isLoading, error, refetch } = useCommunity()
  const { data: settings } = useUserSettings()
  const { data: myMeals = [] } = useMealPresets()
  const { data: myRecipes = [] } = useRecipes()
  const { data: myWorkouts = [] } = usePresets()
  const { data: myDiets = [] } = useDiets()
  const { data: myPlans = [] } = useMealPlans()
  const { diet: activeDiet } = useActiveDiet()
  const [filter, setFilter] = useState<CommunityKind | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showGuidelines, setShowGuidelines] = useState(false)
  const { data: isOwner = false } = useIsSiteOwner()
  const updateSettings = useUpdateSettings()
  const { undoable } = useToast()
  const hidden = useMemo(() => settings?.hidden_community_users ?? [], [settings?.hidden_community_users])

  function hidePerson(ownerId: string) {
    const previous = hidden
    undoable(
      "Hidden - you won't see items from this person",
      () => updateSettings.mutate({ hidden_community_users: [...new Set([...previous, ownerId])] }),
      () => updateSettings.mutate({ hidden_community_users: previous }),
    )
  }

  // Copies you've already saved point back at their source - that's how a card knows it's saved.
  const savedIds = useMemo(
    () =>
      new Set(
        [...myMeals, ...myRecipes, ...myWorkouts, ...myDiets, ...myPlans].map((x) => x.source_id).filter((id): id is string => !!id),
      ),
    [myMeals, myRecipes, myWorkouts, myDiets, myPlans],
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length }
    for (const i of items) c[i.kind] = (c[i.kind] ?? 0) + 1
    return c
  }, [items])

  const visible = useMemo(() => {
    const q = normalizeFoodText(search)
    return items.filter(
      (i) =>
        (i.isOfficial || !hidden.includes(i.ownerId)) &&
        (filter === 'all' || i.kind === filter) &&
        (!q || communitySearchText(i).includes(q)),
    )
  }, [items, filter, search, hidden])

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-xl font-semibold text-white">Community</h2>
        <p className="mt-1 text-sm text-slate-400">
          Diets, meal plans, recipes and workouts people have shared. Saving makes your own copy - change it however you like.{' '}
          <button onClick={() => setShowGuidelines(true)} className="font-medium text-emerald-400 underline decoration-dotted underline-offset-2">
            Guidelines
          </button>
        </p>
      </div>

      {isOwner && <ReportsPanel />}

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Filter by type">
        {FILTERS.map((f) => {
          const active = filter === f.value
          return (
            <button
              key={f.value}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.value)}
              className={`min-h-9 shrink-0 rounded-full px-3.5 text-sm font-medium transition ${
                active ? 'bg-emerald-600 text-on-accent' : 'bg-slate-900 text-slate-300 ring-1 ring-white/5'
              }`}
            >
              {f.label}
              {counts[f.value] ? <span className={`ml-1.5 text-xs ${active ? 'opacity-80' : 'text-slate-500'}`}>{counts[f.value]}</span> : null}
            </button>
          )
        })}
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or ingredient…"
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
      />

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-slate-900 p-5 text-center ring-1 ring-white/5">
          <p className="text-sm text-slate-300">Couldn't load Community right now.</p>
          <button onClick={() => refetch()} className="mt-3 min-h-10 rounded-xl bg-slate-800 px-4 text-sm font-medium text-slate-200">
            Try again
          </button>
        </div>
      ) : visible.length === 0 ? (
        search.trim() ? (
          <EmptyState variant="folder" message="Nothing matches that search." />
        ) : (
          // An empty section explains what belongs in it, with an example, instead of looking bare.
          <ExplainerCard explainer={COMMUNITY_EXPLAINERS[filter]} />
        )
      ) : (
        <div className="space-y-3">
          {visible.map((item) => (
            <CommunityCard
              key={`${item.kind}-${item.id}`}
              item={item}
              saved={savedIds.has(item.id)}
              following={item.kind === 'diet' && !!activeDiet && activeDiet.source_id === item.id}
              unit={settings?.unit_system}
              isOwner={isOwner}
              onHidePerson={() => hidePerson(item.ownerId)}
            />
          ))}
        </div>
      )}

      {hidden.length > 0 && (
        <p className="text-center text-xs text-slate-500">
          Hiding items from {hidden.length} {hidden.length === 1 ? 'person' : 'people'} ·{' '}
          <button onClick={() => updateSettings.mutate({ hidden_community_users: [] })} className="min-h-9 font-medium text-slate-300">
            Show them again
          </button>
        </p>
      )}

      {showGuidelines && <GuidelinesSheet onClose={() => setShowGuidelines(false)} />}
    </div>
  )
}
