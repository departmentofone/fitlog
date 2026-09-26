import { parseDecimal } from '../../lib/number'
import { useHideQuickAdd } from '../../components/QuickAddVisibility'
import { useEffect, useMemo, useState } from 'react'
import { RestTimer } from '../../components/RestTimer'
import { useUserSettings } from '../../hooks/useUserSettings'
import { summarizeLastSets, useLastSessionSetsForExercise } from '../../hooks/useWorkouts'
import { formatWeight, fromDisplayWeight, toDisplayWeight, weightStep, weightUnitLabel } from '../../lib/units'
import type { Exercise, UnitSystem, WorkoutSet } from '../../types'

/** RPE (rate of perceived exertion) - the 1-10 effort scale lifters already know. */
const RPE_LABELS: Record<number, string> = {
  1: 'Very easy',
  2: 'Easy',
  3: 'Easy',
  4: 'Moderate',
  5: 'Moderate',
  6: 'Moderate',
  7: 'Hard',
  8: 'Hard',
  9: 'Very hard',
  10: 'Failure',
}

const REPS_STEP = 1

function roundStep(value: number) {
  return Math.round(value * 100) / 100
}

/** Number field flanked by big -/+ buttons - nudging a value mid-set beats retyping it. */
function Stepper({
  label,
  unit,
  value,
  onChange,
  step,
  inputMode,
}: {
  label: string
  unit?: string
  value: string
  onChange: (next: string) => void
  step: number
  inputMode: 'decimal' | 'numeric'
}) {
  function nudge(dir: 1 | -1) {
    const current = parseDecimal(value)
    const base = Number.isNaN(current) ? 0 : current
    onChange(String(Math.max(0, roundStep(base + dir * step))))
  }
  const buttonClass =
    'flex h-11 w-10 min-[380px]:w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-lg font-semibold text-slate-200 active:bg-slate-700'
  // On a 360px-wide phone the field is only ~50px wide, so "72.5" or "102.5" got clipped at text-lg.
  const sizeClass = value.length >= 5 ? 'text-sm' : value.length === 4 ? 'text-base' : 'text-lg'

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-400">
        {label}
        {unit && <span className="text-slate-500"> ({unit})</span>}
      </span>
      <div className="flex items-center gap-1 min-[380px]:gap-1.5">
        <button type="button" onClick={() => nudge(-1)} aria-label={`Decrease ${label.toLowerCase()} by ${step}`} className={buttonClass}>
          −
        </button>
        <input
          type="text"
          inputMode={inputMode}
          aria-label={unit ? `${label} in ${unit}` : label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={0}
          className={`h-11 w-full min-w-0 rounded-xl border border-slate-700 bg-slate-800 px-0.5 text-center font-semibold tabular-nums text-white focus:border-emerald-500 focus:outline-none ${sizeClass}`}
        />
        <button type="button" onClick={() => nudge(1)} aria-label={`Increase ${label.toLowerCase()} by ${step}`} className={buttonClass}>
          +
        </button>
      </div>
    </div>
  )
}

interface SetFormProps {
  exercise: Exercise
  sessionId: string
  existingSets: WorkoutSet[]
  nextSetNumber: number
  /** `weight` is always in kg (the stored unit), whatever the user typed it in. */
  onAdd: (input: { weight: number; reps: number; difficulty: number; isWarmup: boolean }) => void
  onDeleteSet: (id: string) => void
  onUpdateSet: (input: { setId: string; weight: number; reps: number; difficulty: number }) => void
  onDone: () => void
  adding?: boolean
  /** Bump this (e.g. on a successful add-set mutation) to (re)start the rest timer. */
  restTrigger: number
  /** e.g. "A" - shown as a "Superset A" badge next to the exercise name when part of one. */
  supersetLabel?: string
}

function EditableSetRow({
  set,
  unit,
  onSave,
  onCancel,
  onDelete,
}: {
  set: WorkoutSet
  unit: UnitSystem | undefined
  onSave: (input: { weight: number; reps: number; difficulty: number }) => void
  onCancel: () => void
  onDelete: () => void
}) {
  const initialWeight = String(toDisplayWeight(set.weight, unit))
  const [weight, setWeight] = useState(initialWeight)
  const [reps, setReps] = useState(String(set.reps))
  const [difficulty, setDifficulty] = useState(set.difficulty)

  return (
    <div className="rounded-xl bg-slate-800 px-3 py-2.5">
      <p className="mb-2 text-xs font-medium text-slate-400">Edit set {set.set_number}</p>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <Stepper label="Weight" unit={weightUnitLabel(unit)} value={weight} onChange={setWeight} step={weightStep(unit)} inputMode="decimal" />
        <Stepper label="Reps" value={reps} onChange={setReps} step={REPS_STEP} inputMode="numeric" />
      </div>
      <label className="mb-1 flex justify-between text-xs text-slate-400">
        <span>Effort (RPE)</span>
        <span className="text-slate-300">
          {difficulty} · {RPE_LABELS[difficulty]}
        </span>
      </label>
      <input
        type="range"
        min={1}
        max={10}
        value={difficulty}
        aria-label="Effort, RPE 1 to 10"
        onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}
        className="mb-3 h-6 w-full accent-emerald-500"
      />
      <div className="flex gap-2">
        <button onClick={onDelete} className="min-h-11 rounded-xl bg-red-600/20 px-4 text-sm font-medium text-red-400 active:bg-red-600/30">
          Delete
        </button>
        <button onClick={onCancel} className="min-h-11 flex-1 rounded-xl bg-slate-700 text-sm text-slate-300 active:bg-slate-600">
          Cancel
        </button>
        <button
          onClick={() => {
            const w = parseDecimal(weight)
            const r = parseInt(reps, 10)
            if (!Number.isFinite(w) || w < 0 || !Number.isInteger(r) || r < 1) return
            // An untouched weight keeps its exact stored kg, so editing only the reps of an lb set
            // doesn't nudge the weight through a rounded lb -> kg round trip.
            onSave({ weight: weight === initialWeight ? set.weight : fromDisplayWeight(w, unit), reps: r, difficulty })
          }}
          className="btn btn-primary flex-1 text-sm"
        >
          Save
        </button>
      </div>
    </div>
  )
}

export function SetForm({
  exercise,
  sessionId,
  existingSets,
  nextSetNumber,
  onAdd,
  onDeleteSet,
  onUpdateSet,
  onDone,
  adding,
  restTrigger,
  supersetLabel,
}: SetFormProps) {
  useHideQuickAdd()
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [difficulty, setDifficulty] = useState(6)
  const [isWarmup, setIsWarmup] = useState(false)
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const { data: settings, isPending: settingsPending } = useUserSettings()
  const unit = settings?.unit_system
  const { data: lastSets = [] } = useLastSessionSetsForExercise(exercise.id, sessionId)
  const lastTimeSummary = useMemo(() => summarizeLastSets(lastSets, unit), [lastSets, unit])

  // Start from the weight you last used - this session's latest set, else last session's - so a
  // typical set is just "check reps, tap Add". The field holds the user's unit (kg or lb), so wait
  // for settings before pre-filling, or an lb user could get a kg number under an "lb" label.
  const suggestedKg = existingSets.at(-1)?.weight ?? lastSets.at(-1)?.weight
  const suggestedWeight = suggestedKg == null || settingsPending ? undefined : toDisplayWeight(suggestedKg, unit)
  useEffect(() => {
    if (suggestedWeight != null) setWeight((w) => (w === '' ? String(suggestedWeight) : w))
  }, [suggestedWeight])

  function handleAdd() {
    const w = parseDecimal(weight)
    const r = parseInt(reps, 10)
    // Reps must be a real rep; weight can be 0 (bodyweight) but never negative.
    if (!Number.isFinite(w) || w < 0 || !Number.isInteger(r) || r < 1) return
    onAdd({ weight: fromDisplayWeight(w, unit), reps: r, difficulty, isWarmup })
    setReps('')
    setIsWarmup(false)
  }

  return (
    <div className="card p-4">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate card-title">{exercise.name}</h3>
          {supersetLabel && (
            <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
              Superset {supersetLabel}
            </span>
          )}
        </div>
        <button onClick={onDone} className="-my-2 -mr-2 min-h-11 shrink-0 rounded-xl px-3 text-sm font-medium text-emerald-400 active:bg-white/5">
          Done
        </button>
      </div>

      {lastTimeSummary && <p className="mb-3 text-xs text-slate-500">Last time: {lastTimeSummary}</p>}

      <RestTimer restartKey={restTrigger} />

      {existingSets.length > 0 && (
        <div className="mb-3 space-y-1">
          {existingSets.map((s) =>
            editingSetId === s.id ? (
              <EditableSetRow
                key={s.id}
                set={s}
                unit={unit}
                onCancel={() => setEditingSetId(null)}
                onDelete={() => {
                  onDeleteSet(s.id)
                  setEditingSetId(null)
                }}
                onSave={(input) => {
                  onUpdateSet({ setId: s.id, ...input })
                  setEditingSetId(null)
                }}
              />
            ) : (
              <button
                key={s.id}
                onClick={() => setEditingSetId(s.id)}
                aria-label={`Edit set ${s.set_number}`}
                className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl bg-slate-800/60 px-3 py-2 text-left text-sm text-slate-300 transition active:bg-slate-800"
              >
                <span>
                  Set {s.set_number} · {formatWeight(s.weight, unit)} × {s.reps} reps
                  {s.is_warmup && <span className="ml-1.5 whitespace-nowrap text-amber-400">(warm-up)</span>}
                </span>
                <span className="shrink-0 text-xs text-slate-500">RPE {s.difficulty}</span>
              </button>
            ),
          )}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-slate-500">Set {nextSetNumber}</p>
        <label className="-my-2 -mr-2 flex min-h-11 items-center gap-2 px-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={isWarmup}
            onChange={(e) => setIsWarmup(e.target.checked)}
            className="h-5 w-5 accent-amber-500"
          />
          Warm-up
        </label>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <Stepper label="Weight" unit={weightUnitLabel(unit)} value={weight} onChange={setWeight} step={weightStep(unit)} inputMode="decimal" />
        <Stepper label="Reps" value={reps} onChange={setReps} step={REPS_STEP} inputMode="numeric" />
      </div>
      <label className="mb-1 flex justify-between text-xs text-slate-400">
        <span>Effort (RPE)</span>
        <span className="text-slate-300">
          {difficulty} · {RPE_LABELS[difficulty]}
        </span>
      </label>
      <input
        type="range"
        min={1}
        max={10}
        value={difficulty}
        aria-label="Effort, RPE 1 to 10"
        onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}
        className="mb-4 h-6 w-full accent-emerald-500"
      />
      <button
        onClick={handleAdd}
        disabled={!weight || !reps || adding}
        className="btn btn-primary min-h-12 w-full"
      >
        Add set {nextSetNumber}
      </button>
    </div>
  )
}
