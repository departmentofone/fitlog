import { parseDecimal } from '../../lib/number'
import { useHideQuickAdd } from '../../components/QuickAddVisibility'
import { useEffect, useMemo, useRef, useState } from 'react'
import { RestTimer } from '../../components/RestTimer'
import { PlateLoad } from '../calculator/PlateLoad'
import { useUserSettings } from '../../hooks/useUserSettings'
import { summarizeLastSets, useLastSessionSetsForExercise } from '../../hooks/useWorkouts'
import { fromDisplayWeight, toDisplayWeight, weightStep, weightUnitLabel } from '../../lib/units'
import type { Exercise, PlannedSet, UnitSystem, WorkoutSet } from '../../types'

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
const SHOW_PLATES_KEY = 'fitlog-show-plates'

/** Whether the plate loading shows under the weight; remembered on this phone. */
function readShowPlates(): boolean {
  try {
    return localStorage.getItem(SHOW_PLATES_KEY) === '1'
  } catch {
    return false
  }
}

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
  /** Sets planned from a started preset, ticked off below the logged ones. */
  planned?: PlannedSet[]
  /** `weightKg`: the planned weight, or the form's when the plan has none (a template). */
  onLogPlanned?: (set: PlannedSet, difficulty: number, weightKg: number) => void
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
  planned = [],
  onLogPlanned,
}: SetFormProps) {
  useHideQuickAdd()
  const [weight, setWeight] = useState('')
  // null until the reps field is touched: until then it shows the suggested reps.
  const [repsInput, setReps] = useState<string | null>(null)
  // Effort carries over from the last set this session; a fresh exercise starts at a middling 6.
  const [difficulty, setDifficulty] = useState(() => existingSets.at(-1)?.difficulty ?? 6)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const [showPlates, setShowPlates] = useState(readShowPlates)

  function togglePlates() {
    const next = !showPlates
    setShowPlates(next)
    try {
      localStorage.setItem(SHOW_PLATES_KEY, next ? '1' : '0')
    } catch {
      // Not remembered next time - fine.
    }
  }
  const [isWarmup, setIsWarmup] = useState(false)
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const { data: settings, isPending: settingsPending } = useUserSettings()
  const unit = settings?.unit_system
  const { data: lastSets = [] } = useLastSessionSetsForExercise(exercise.id, sessionId)
  const lastTimeSummary = useMemo(() => summarizeLastSets(lastSets, unit), [lastSets, unit])

  // Start from the weight and reps you last used - this session's latest set, else last session's -
  // so a typical set is just "check the numbers, tap Add". The weight field holds the user's unit
  // (kg or lb), so wait for settings before pre-filling, or an lb user could get a kg number under
  // an "lb" label.
  const suggestedKg = planned[0]?.weight || (existingSets.at(-1)?.weight ?? lastSets.at(-1)?.weight)
  const suggestedWeight = suggestedKg == null || settingsPending ? undefined : toDisplayWeight(suggestedKg, unit)
  const suggestedReps = planned[0]?.reps ?? existingSets.at(-1)?.reps ?? lastSets.at(-1)?.reps
  useEffect(() => {
    if (suggestedWeight != null) setWeight((w) => (w === '' ? String(suggestedWeight) : w))
  }, [suggestedWeight])
  const reps = repsInput ?? (suggestedReps != null ? String(suggestedReps) : '')

  function handleAdd() {
    const w = parseDecimal(weight)
    const r = parseInt(reps, 10)
    // Reps must be a real rep; weight can be 0 (bodyweight) but never negative.
    if (!Number.isFinite(w) || w < 0 || !Number.isInteger(r) || r < 1) return
    onAdd({ weight: fromDisplayWeight(w, unit), reps: r, difficulty, isWarmup })
    // Weight and reps stay for the next set (most sets repeat the last one); only the warm-up flag
    // resets. The set table grows above the button, so keep the button on screen.
    setIsWarmup(false)
    requestAnimationFrame(() =>
      addButtonRef.current?.scrollIntoView({
        block: 'nearest',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      }),
    )
  }

  return (
    <div className="card p-4">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate card-title">{exercise.name}</h2>
          {supersetLabel && (
            <span className="chip chip-accent shrink-0">Superset {supersetLabel}</span>
          )}
        </div>
        <button onClick={onDone} className="-my-2 -mr-2 min-h-11 shrink-0 rounded-xl px-3 text-sm font-medium text-emerald-400 active:bg-white/5">
          Done
        </button>
      </div>

      {lastTimeSummary && (
        <p className="mb-3 text-sm text-slate-400">
          <span className="text-slate-500">Last time:</span> <span className="font-medium text-slate-200">{lastTimeSummary}</span>
        </p>
      )}

      <RestTimer restartKey={restTrigger} />

      {existingSets.length + planned.length > 0 && (
        // A compact table, one row per set - it used to be a stack of wrapping bubbles.
        <div className="inset mb-3 divide-y divide-white/5 overflow-hidden">
          <div className="grid grid-cols-[2.75rem_1fr_1fr_3rem] px-3 py-1.5 text-xs font-semibold text-slate-500">
            <span>Set</span>
            <span>{weightUnitLabel(unit)}</span>
            <span>Reps</span>
            <span className="text-right">RPE</span>
          </div>
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
                className="grid min-h-11 w-full grid-cols-[2.75rem_1fr_1fr_3rem] items-center px-3 text-left text-[15px] text-white transition active:bg-white/5"
              >
                <span className="flex items-center gap-1 text-slate-400">
                  {s.set_number}
                  {s.is_warmup && (
                    <span title="Warm-up" className="rounded bg-amber-400/15 px-1 text-[11px] font-bold text-amber-400">
                      W
                    </span>
                  )}
                </span>
                <span className="font-semibold">{toDisplayWeight(s.weight, unit)}</span>
                <span className="font-semibold">{s.reps}</span>
                <span className="text-right text-sm text-slate-400">{s.difficulty}</span>
              </button>
            ),
          )}
          {/* Planned sets (from a started preset): tick one when it's done and it's logged as is. */}
          {planned.map((p, i) => {
            // A template's planned set has no weight yet: it takes the one in the form below.
            const formKg = Number.isFinite(parseDecimal(weight)) ? fromDisplayWeight(parseDecimal(weight), unit) : 0
            const kg = p.weight || formKg
            return (
            <div
              key={`planned-${i}`}
              className="grid min-h-11 w-full grid-cols-[2.75rem_1fr_1fr_3rem] items-center px-3 text-[15px] text-slate-400"
            >
              <span className="flex items-center gap-1">
                {existingSets.length + i + 1}
                {p.isWarmup && <span className="rounded bg-amber-400/15 px-1 text-[11px] font-bold text-amber-400">W</span>}
              </span>
              <span className={p.weight ? '' : 'italic'}>{toDisplayWeight(kg, unit)}</span>
              <span>{p.reps}</span>
              <span className="flex justify-end">
                <button
                  onClick={() => onLogPlanned?.(p, difficulty, kg)}
                  disabled={adding}
                  aria-label={`Done: set ${existingSets.length + i + 1}, ${toDisplayWeight(kg, unit)} ${weightUnitLabel(unit)} × ${p.reps}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 ring-1 ring-slate-600 transition active:bg-emerald-600 active:text-on-accent disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </button>
              </span>
            </div>
            )
          })}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">{planned.length > 0 ? 'Extra set' : `Set ${nextSetNumber}`}</p>
        <div className="flex gap-1.5">
          <button
            onClick={togglePlates}
            aria-pressed={showPlates}
            className={`chip min-h-8 px-3 transition ${showPlates ? 'chip-accent' : 'border border-dashed border-slate-700 text-slate-400'}`}
          >
            Plates
          </button>
          <button
            onClick={() => setIsWarmup((w) => !w)}
            aria-pressed={isWarmup}
            className={`chip min-h-8 px-3 transition ${isWarmup ? 'chip-warn' : 'border border-dashed border-slate-700 text-slate-400'}`}
          >
            {isWarmup ? '✓ Warm-up' : 'Warm-up'}
          </button>
        </div>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <Stepper label="Weight" unit={weightUnitLabel(unit)} value={weight} onChange={setWeight} step={weightStep(unit)} inputMode="decimal" />
        <Stepper label="Reps" value={reps} onChange={setReps} step={REPS_STEP} inputMode="numeric" />
      </div>
      {/* What to load for the weight above, so nobody does plate math between sets. */}
      {showPlates && parseDecimal(weight) > 0 && (
        <div className="inset mb-3 px-3 py-2.5">
          <PlateLoad total={parseDecimal(weight)} unit={unit === 'imperial' ? 'lb' : 'kg'} />
        </div>
      )}
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
        ref={addButtonRef}
        onClick={handleAdd}
        disabled={!weight || !reps || adding}
        className="btn btn-primary min-h-12 w-full scroll-mb-4"
      >
        {planned.length > 0 ? 'Add an extra set' : `Add set ${nextSetNumber}`}
      </button>
    </div>
  )
}
