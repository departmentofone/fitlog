import { parseDecimal } from '../../lib/number'
import { useShareGate } from '../../hooks/useShareGate'
import { useState } from 'react'
import { SkeletonRow } from '../../components/Skeleton'
import { useToast } from '../../components/ToastProvider'
import { useAuth } from '../../hooks/useAuth'
import { useMealPresets } from '../../hooks/useMealPresets'
import {
  useCreateProgram,
  useDeleteProgram,
  useImportProgram,
  usePrograms,
  useRestoreProgram,
  useSetProgramShared,
} from '../../hooks/usePrograms'
import { usePresets } from '../../hooks/usePresets'
import { useRecipes } from '../../hooks/useRecipes'
import { useUserSettings } from '../../hooks/useUserSettings'
import { fromDisplayVolume, volumeUnitLabel } from '../../lib/units'
import type { DietGoal, Program } from '../../types'

function CheckList<T extends { id: string; name: string }>({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string
  items: T[]
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="mb-3">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-2 rounded-xl bg-slate-800/60 px-3 py-2 text-sm text-slate-200">
            <input type="checkbox" checked={selected.has(item.id)} onChange={() => onToggle(item.id)} className="h-4 w-4 accent-emerald-500" />
            {item.name}
          </label>
        ))}
      </div>
    </div>
  )
}

function NewProgramForm({ onDone }: { onDone: () => void }) {
  const { data: workoutPresets = [] } = usePresets()
  const { data: recipes = [] } = useRecipes()
  const { data: mealPresets = [] } = useMealPresets()
  const createProgram = useCreateProgram()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [includeGoals, setIncludeGoals] = useState(false)
  const [dietGoal, setDietGoal] = useState<DietGoal>('deficit')
  const [calorieGoal, setCalorieGoal] = useState('')
  // Typed in the unit the form opened with (ml, or fl oz for imperial); stored as ml.
  const { data: settings } = useUserSettings()
  const [unit] = useState(settings?.unit_system)
  const [waterGoal, setWaterGoal] = useState(unit === 'imperial' ? '68' : '2000')
  const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set())
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set())
  const [selectedMealPresets, setSelectedMealPresets] = useState<Set<string>>(new Set())

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, id: string) {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setter(next)
  }

  const hasAnyContent = selectedWorkouts.size > 0 || selectedRecipes.size > 0 || selectedMealPresets.size > 0

  function handleSave() {
    if (!name.trim() || !hasAnyContent) return
    createProgram.mutate({
      name: name.trim(),
      description: description.trim(),
      dietGoal: includeGoals ? dietGoal : null,
      calorieGoal: includeGoals && calorieGoal ? parseDecimal(calorieGoal) : null,
      waterGoalMl: includeGoals && waterGoal ? fromDisplayVolume(parseDecimal(waterGoal), unit) : null,
      workoutPresets: workoutPresets.filter((p) => selectedWorkouts.has(p.id)),
      recipes: recipes.filter((r) => selectedRecipes.has(r.id)),
      mealPresets: mealPresets.filter((p) => selectedMealPresets.has(p.id)),
    })
    onDone()
  }

  return (
    <div className="card p-4">
      <h3 className="mb-3 font-medium text-white">New program</h3>
      <div className="mb-3 space-y-2.5">
        <input
          placeholder="Program name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full field px-3 py-2.5"
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full field px-3 py-2.5 text-sm"
        />
      </div>

      <CheckList title="Workout presets" items={workoutPresets} selected={selectedWorkouts} onToggle={(id) => toggle(selectedWorkouts, setSelectedWorkouts, id)} />
      <CheckList title="Recipes" items={recipes} selected={selectedRecipes} onToggle={(id) => toggle(selectedRecipes, setSelectedRecipes, id)} />
      <CheckList title="Meal presets" items={mealPresets} selected={selectedMealPresets} onToggle={(id) => toggle(selectedMealPresets, setSelectedMealPresets, id)} />

      {workoutPresets.length === 0 && recipes.length === 0 && mealPresets.length === 0 && (
        <p className="mb-3 text-sm text-slate-500">
          You don't have any workout presets, recipes, or meal presets yet - build some first, then bundle them into a program.
        </p>
      )}

      <label className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
        <input type="checkbox" checked={includeGoals} onChange={(e) => setIncludeGoals(e.target.checked)} className="h-3.5 w-3.5 accent-emerald-500" />
        Include diet goals
      </label>
      {includeGoals && (
        <div className="mb-3 space-y-2">
          <select
            value={dietGoal}
            onChange={(e) => setDietGoal(e.target.value as DietGoal)}
            className="w-full field px-3 py-2 text-sm"
          >
            <option value="deficit">Deficit</option>
            <option value="maintenance">Maintenance</option>
            <option value="surplus">Surplus</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Calorie goal"
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(e.target.value)}
              className="field px-3 py-2 text-sm"
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder={`Water goal (${volumeUnitLabel(unit)})`}
              value={waterGoal}
              onChange={(e) => setWaterGoal(e.target.value)}
              className="field px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onDone} className="flex-1 rounded-xl bg-slate-800 py-2.5 text-sm text-slate-300 hover:bg-slate-700">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || !hasAnyContent || createProgram.isPending}
          className="btn btn-primary flex-1 py-2.5 text-sm"
        >
          Save program
        </button>
      </div>
    </div>
  )
}

function ProgramCard({ program, isOwner }: { program: Program; isOwner: boolean }) {
  const setShared = useSetProgramShared()
  const gate = useShareGate()
  const deleteProgram = useDeleteProgram()
  const restoreProgram = useRestoreProgram()
  const importProgram = useImportProgram()
  const { show, undoable } = useToast()
  const [applyGoals, setApplyGoals] = useState(true)

  const hasGoals = program.diet_goal != null || program.calorie_goal != null || program.water_goal_ml != null

  function handleImport() {
    importProgram.mutate(
      { program, applyGoals: hasGoals && applyGoals },
      {
        onSuccess: (result) => {
          show(`Imported "${program.name}": ${result.workoutsImported} workout preset(s), ${result.recipesImported} recipe(s), ${result.mealPresetsImported} meal preset(s).`, { duration: 6000 })
        },
      },
    )
  }

  return (
    <div className="inset p-3">
      <div className="mb-1 flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">{program.name}</h4>
        {isOwner && (
          <button
            onClick={() =>
              undoable(`Deleted "${program.name}"`, () => deleteProgram.mutate(program.id), () => restoreProgram.mutate(program))
            }
            className="text-red-400 hover:text-red-300"
          >
            ×
          </button>
        )}
      </div>
      {program.description && <p className="mb-2 text-xs text-slate-400">{program.description}</p>}
      <p className="mb-2 text-xs text-slate-500">
        {program.workouts.length} workout{program.workouts.length === 1 ? '' : 's'} · {program.recipes.length} recipe{program.recipes.length === 1 ? '' : 's'} ·{' '}
        {program.meal_presets.length} meal preset{program.meal_presets.length === 1 ? '' : 's'}
        {hasGoals && ' · includes diet goals'}
      </p>

      {isOwner ? (
        <label className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
          <input type="checkbox" checked={program.is_shared} onChange={(e) => gate.request(e.target.checked, (on) => setShared.mutate({ programId: program.id, isShared: on }))} className="h-3.5 w-3.5 accent-emerald-500" />
          Share to Community
        </label>
      ) : (
        <p className="mb-2 text-xs text-emerald-400">From Community</p>
      )}

      {hasGoals && (
        <label className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
          <input type="checkbox" checked={applyGoals} onChange={(e) => setApplyGoals(e.target.checked)} className="h-3.5 w-3.5 accent-emerald-500" />
          Also apply diet goals to my settings
        </label>
      )}

      <button
        onClick={handleImport}
        disabled={importProgram.isPending}
        className="btn btn-primary w-full py-2 text-sm"
      >
        {importProgram.isPending ? 'Importing…' : 'Import into my account'}
      </button>
      {gate.sheet}
    </div>
  )
}

export function ProgramsTab() {
  const { user } = useAuth()
  const { data: programs = [], isLoading } = usePrograms()
  const [showNew, setShowNew] = useState(false)

  return (
    <div className="space-y-4 p-4">
      {/* One card: what programs are, your programs (only once you have some), and the action. It was
          two cards - an explainer and a separate empty "Programs" list. */}
      <div className="card p-4">
        <h3 className="mb-1 font-medium text-white">Programs</h3>
        <p className="mb-3 text-sm text-slate-400">
          Bundle workout presets, recipes, meal presets and diet goals into one package. Share it to Community and
          anyone can import it in one go.
        </p>
        {isLoading && (
          <div className="mb-3 space-y-2">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}
        {programs.length > 0 && (
          <div className="mb-3 space-y-2">
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program} isOwner={program.user_id === user?.id} />
            ))}
          </div>
        )}
        {showNew ? (
          <NewProgramForm onDone={() => setShowNew(false)} />
        ) : (
          <button
            onClick={() => setShowNew(true)}
            className="min-h-11 w-full rounded-xl border border-dashed border-slate-700 text-sm font-medium text-slate-300 transition active:border-emerald-500 active:text-emerald-400"
          >
            + New program
          </button>
        )}
      </div>
    </div>
  )
}
