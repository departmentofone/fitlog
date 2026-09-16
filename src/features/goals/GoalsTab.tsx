import { useEffect, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { useCreateGoal, useDeleteGoal, useGoals, useRestoreGoal, useToggleGoal } from '../../hooks/useGoals'
import { useToast } from '../../components/ToastProvider'
import { useUpdateSettings, useUserSettings } from '../../hooks/useUserSettings'
import { useExercises } from '../../hooks/useExercises'
import { useExerciseHistory } from '../../hooks/useWorkouts'
import { cmToIn, inToCm, kgToLb, lbToKg } from '../../lib/units'
import type { ActivityLevel, Goal, GoalCategory, Sex } from '../../types'
import { ProgressCalendar } from './ProgressCalendar'

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very active' },
]

function AutoTrackedGoalRow({ goal, exerciseName, onDelete }: { goal: Goal; exerciseName: string; onDelete: () => void }) {
  const { data: history = [] } = useExerciseHistory(goal.target_exercise_id ?? undefined)
  const toggleGoal = useToggleGoal()

  const achieved = history.some(
    (h) => !h.is_warmup && h.weight >= (goal.target_weight ?? 0) && h.reps >= (goal.target_reps ?? 1),
  )

  useEffect(() => {
    if (achieved && !goal.completed) toggleGoal.mutate({ id: goal.id, completed: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achieved, goal.completed, goal.id])

  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 px-3 py-2">
      <span className={`flex-1 text-sm ${goal.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
        {exerciseName} · {goal.target_weight}kg{goal.target_reps ? ` × ${goal.target_reps}` : ''}
      </span>
      {goal.completed && <span className="shrink-0 text-xs text-emerald-400">✓ Hit!</span>}
      <button onClick={onDelete} className="text-red-400 hover:text-red-300">
        ×
      </button>
    </div>
  )
}

function GoalList({ category, title }: { category: GoalCategory; title: string }) {
  const { data: goals = [] } = useGoals()
  const { data: exercises = [] } = useExercises()
  const createGoal = useCreateGoal()
  const toggleGoal = useToggleGoal()
  const deleteGoal = useDeleteGoal()
  const restoreGoal = useRestoreGoal()
  const { undoable } = useToast()
  const [titleInput, setTitleInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [autoTrack, setAutoTrack] = useState(false)
  const [exerciseId, setExerciseId] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [targetReps, setTargetReps] = useState('')

  const filtered = goals.filter((g) => g.category === category)

  function reset() {
    setTitleInput('')
    setAutoTrack(false)
    setExerciseId('')
    setTargetWeight('')
    setTargetReps('')
    setAdding(false)
  }

  function handleAdd() {
    if (autoTrack) {
      if (!exerciseId || !targetWeight) return
      const exName = exercises.find((e) => e.id === exerciseId)?.name ?? 'Exercise'
      createGoal.mutate({
        category,
        title: `${exName} ${targetWeight}kg`,
        targetExerciseId: exerciseId,
        targetWeight: parseFloat(targetWeight),
        targetReps: targetReps ? parseInt(targetReps, 10) : null,
      })
    } else {
      if (!titleInput.trim()) return
      createGoal.mutate({ category, title: titleInput.trim() })
    }
    reset()
  }

  return (
    <div className="rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <h3 className="mb-3 font-medium text-white">{title}</h3>
      <div className="mb-3 space-y-1.5">
        {filtered.map((g) =>
          g.target_exercise_id ? (
            <AutoTrackedGoalRow
              key={g.id}
              goal={g}
              exerciseName={exercises.find((e) => e.id === g.target_exercise_id)?.name ?? g.title}
              onDelete={() =>
                undoable(`Deleted "${g.title}"`, () => deleteGoal.mutate(g.id), () => restoreGoal.mutate(g))
              }
            />
          ) : (
            <div key={g.id} className="flex items-center gap-3 rounded-xl bg-slate-800/60 px-3 py-2">
              <input
                type="checkbox"
                checked={g.completed}
                onChange={(e) => toggleGoal.mutate({ id: g.id, completed: e.target.checked })}
                className="h-5 w-5 shrink-0 accent-emerald-500"
              />
              <span className={`flex-1 text-sm ${g.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                {g.title}
              </span>
              <button
                onClick={() => undoable(`Deleted "${g.title}"`, () => deleteGoal.mutate(g.id), () => restoreGoal.mutate(g))}
                className="text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          ),
        )}
        {filtered.length === 0 && <EmptyState variant="trophy" message="No goals yet." />}
      </div>

      {adding ? (
        <div className="space-y-2">
          {category === 'workout' && (
            <label className="flex items-center gap-1.5 text-xs text-slate-400">
              <input type="checkbox" checked={autoTrack} onChange={(e) => setAutoTrack(e.target.checked)} className="h-3.5 w-3.5 accent-emerald-500" />
              Auto-track from an exercise
            </label>
          )}
          {autoTrack ? (
            <>
              <select
                value={exerciseId}
                onChange={(e) => setExerciseId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Pick an exercise…</option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
              inputMode="decimal"
                  placeholder="Target weight (kg)"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="number"
              inputMode="decimal"
                  placeholder="Reps (optional)"
                  value={targetReps}
                  onChange={(e) => setTargetReps(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </>
          ) : (
            <input
              autoFocus
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Goal…"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          )}
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 rounded-xl bg-slate-800 py-2 text-sm text-slate-300 hover:bg-slate-700">
              Cancel
            </button>
            <button onClick={handleAdd} className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500">
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full rounded-xl border border-dashed border-slate-700 py-2 text-sm font-medium text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
        >
          + Add goal
        </button>
      )}
    </div>
  )
}

export function GoalsTab() {
  const { data: settings } = useUserSettings()
  const updateSettings = useUpdateSettings()

  const [weight, setWeight] = useState('')
  const [weightGoal, setWeightGoal] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<Sex | ''>('')
  const [activity, setActivity] = useState<ActivityLevel | ''>('')
  const [editingStats, setEditingStats] = useState(false)

  const imperial = settings?.unit_system === 'imperial'
  const weightUnit = imperial ? 'lb' : 'kg'
  const heightUnit = imperial ? 'in' : 'cm'
  const displayWeight = (kg: number) => Math.round((imperial ? kgToLb(kg) : kg) * 10) / 10
  const displayHeight = (cm: number) => Math.round((imperial ? cmToIn(cm) : cm) * 10) / 10

  function startEditing() {
    setWeight(settings?.current_weight != null ? String(displayWeight(settings.current_weight)) : '')
    setWeightGoal(settings?.weight_goal != null ? String(displayWeight(settings.weight_goal)) : '')
    setHeight(settings?.height_cm != null ? String(displayHeight(settings.height_cm)) : '')
    setAge(settings?.age != null ? String(settings.age) : '')
    setSex(settings?.sex ?? '')
    setActivity(settings?.activity_level ?? '')
    setEditingStats(true)
  }

  function saveStats() {
    const toKg = (v: string) => (imperial ? lbToKg(parseFloat(v)) : parseFloat(v))
    const toCm = (v: string) => (imperial ? inToCm(parseFloat(v)) : parseFloat(v))
    updateSettings.mutate({
      current_weight: weight ? toKg(weight) : null,
      weight_goal: weightGoal ? toKg(weightGoal) : null,
      height_cm: height ? toCm(height) : null,
      age: age ? parseInt(age, 10) : null,
      sex: sex || null,
      activity_level: activity || null,
    })
    setEditingStats(false)
  }

  return (
    <div className="space-y-4 p-4">
      <div
        onClick={!editingStats ? startEditing : undefined}
        className={`rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 shadow-[var(--glow-shadow)] ring-1 ring-white/5 transition ${
          !editingStats ? 'cursor-pointer hover:ring-emerald-500/30' : ''
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-white">Personal info & weight goal</h3>
          {!editingStats && <span className="text-xs text-slate-500">Tap to edit</span>}
        </div>

        {editingStats ? (
          <div onClick={(e) => e.stopPropagation()} className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <input
                placeholder={`Current weight (${weightUnit})`}
                type="number"
              inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <input
                placeholder={`Goal weight (${weightUnit})`}
                type="number"
              inputMode="decimal"
                value={weightGoal}
                onChange={(e) => setWeightGoal(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <input
                placeholder={`Height (${heightUnit})`}
                type="number"
              inputMode="decimal"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <input
                placeholder="Age"
                type="number"
              inputMode="decimal"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as Sex | '')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Sex (optional)</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityLevel | '')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Activity level (optional)</option>
              {ACTIVITY_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setEditingStats(false)} className="flex-1 rounded-xl bg-slate-800 py-2 text-sm text-slate-300 hover:bg-slate-700">
                Cancel
              </button>
              <button onClick={saveStats} className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500">
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
            <p>Weight: {settings?.current_weight != null ? `${displayWeight(settings.current_weight)} ${weightUnit}` : '—'}</p>
            <p>Goal: {settings?.weight_goal != null ? `${displayWeight(settings.weight_goal)} ${weightUnit}` : '—'}</p>
            <p>Height: {settings?.height_cm != null ? `${displayHeight(settings.height_cm)} ${heightUnit}` : '—'}</p>
            <p>Age: {settings?.age ?? '—'}</p>
          </div>
        )}
      </div>

      <ProgressCalendar />

      <GoalList category="workout" title="Workout goals" />
      <GoalList category="custom" title="Custom goals" />
    </div>
  )
}
