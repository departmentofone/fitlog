import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EmptyState } from '../../components/EmptyState'
import { useCreateGoal, useDeleteGoal, useGoals, useRestoreGoal, useToggleGoal } from '../../hooks/useGoals'
import { useToast } from '../../components/ToastProvider'
import { useUpdateSettings, useUserSettings } from '../../hooks/useUserSettings'
import { useExercises } from '../../hooks/useExercises'
import { useExerciseHistory } from '../../hooks/useWorkouts'
import { useBodyMeasurements, useUpsertBodyMeasurement, type BodyMeasurement } from '../../hooks/useBodyMeasurements'
import { cmToIn, inToCm, kgToLb, lbToKg } from '../../lib/units'
import { CHART_FONT, useThemeChartColors } from '../../lib/useChartColors'
import type { ActivityLevel, Goal, GoalCategory, Sex } from '../../types'
import { ProgressCalendar } from './ProgressCalendar'
import { WeightChart } from './WeightChart'

type MeasurementField = 'waist' | 'chest' | 'arms' | 'hips'
const MEASUREMENT_FIELDS: { key: MeasurementField; column: `${MeasurementField}_cm`; label: string; color: string }[] = [
  { key: 'waist', column: 'waist_cm', label: 'Waist', color: '#34d399' },
  { key: 'chest', column: 'chest_cm', label: 'Chest', color: '#60a5fa' },
  { key: 'arms', column: 'arms_cm', label: 'Arms', color: '#fbbf24' },
  { key: 'hips', column: 'hips_cm', label: 'Hips', color: '#f87171' },
]

function BodyMeasurementsCard() {
  const { data: settings } = useUserSettings()
  const { data: measurements = [] } = useBodyMeasurements()
  const upsertMeasurement = useUpsertBodyMeasurement()
  const colors = useThemeChartColors()

  const imperial = settings?.unit_system === 'imperial'
  const lengthUnit = imperial ? 'in' : 'cm'
  const displayLength = (cm: number) => Math.round((imperial ? cmToIn(cm) : cm) * 10) / 10

  const sorted = useMemo(() => [...measurements].sort((a, b) => b.date.localeCompare(a.date)), [measurements])
  const latest = sorted[0] as BodyMeasurement | undefined
  const previous = sorted[1] as BodyMeasurement | undefined

  const availableFields = MEASUREMENT_FIELDS.filter((f) => measurements.some((m) => m[f.column] != null))
  const [metric, setMetric] = useState<MeasurementField>('waist')
  const activeField = availableFields.find((f) => f.key === metric) ?? availableFields[0]

  const [editing, setEditing] = useState(false)
  const [date, setDate] = useState('')
  const [values, setValues] = useState<Record<MeasurementField, string>>({ waist: '', chest: '', arms: '', hips: '' })

  function startEditing() {
    const todayStr = new Date().toISOString().slice(0, 10)
    const base = latest?.date === todayStr ? latest : undefined
    setDate(todayStr)
    setValues({
      waist: base?.waist_cm != null ? String(displayLength(base.waist_cm)) : '',
      chest: base?.chest_cm != null ? String(displayLength(base.chest_cm)) : '',
      arms: base?.arms_cm != null ? String(displayLength(base.arms_cm)) : '',
      hips: base?.hips_cm != null ? String(displayLength(base.hips_cm)) : '',
    })
    setEditing(true)
  }

  function save() {
    const toCm = (v: string) => (imperial ? inToCm(parseFloat(v)) : parseFloat(v))
    upsertMeasurement.mutate({
      date,
      waist_cm: values.waist ? toCm(values.waist) : null,
      chest_cm: values.chest ? toCm(values.chest) : null,
      arms_cm: values.arms ? toCm(values.arms) : null,
      hips_cm: values.hips ? toCm(values.hips) : null,
    })
    setEditing(false)
  }

  const chartData = useMemo(() => {
    if (!activeField) return []
    return [...measurements]
      .filter((m) => m[activeField.column] != null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((m) => ({
        label: new Date(m.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: displayLength(m[activeField.column]!),
      }))
  }, [measurements, activeField, imperial])

  return (
    <div
      onClick={!editing ? startEditing : undefined}
      className={`rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5 transition ${
        !editing ? 'cursor-pointer hover:ring-emerald-500/30' : ''
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-white">Body measurements</h3>
        {!editing && <span className="text-xs text-slate-500">Tap to edit</span>}
      </div>

      {editing ? (
        <div onClick={(e) => e.stopPropagation()} className="space-y-2.5">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2.5">
            {MEASUREMENT_FIELDS.map((f) => (
              <input
                key={f.key}
                placeholder={`${f.label} (${lengthUnit})`}
                type="number"
                inputMode="decimal"
                value={values[f.key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex-1 rounded-xl bg-slate-800 py-2 text-sm text-slate-300 hover:bg-slate-700">
              Cancel
            </button>
            <button onClick={save} className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500">
              Save
            </button>
          </div>
        </div>
      ) : latest ? (
        <div onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
            {MEASUREMENT_FIELDS.map((f) => {
              const value = latest[f.column]
              const prevValue = previous?.[f.column] ?? null
              const delta = value != null && prevValue != null ? displayLength(value) - displayLength(prevValue) : null
              return (
                <p key={f.key}>
                  {f.label}: {value != null ? `${displayLength(value)} ${lengthUnit}` : '—'}
                  {delta != null && Math.abs(delta) >= 0.1 && (
                    <span className={delta > 0 ? 'text-amber-400' : 'text-emerald-400'}> ({delta > 0 ? '+' : ''}{Math.round(delta * 10) / 10})</span>
                  )}
                </p>
              )
            })}
          </div>

          {activeField && chartData.length >= 2 && (
            <div className="mt-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {availableFields.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setMetric(f.key)}
                    className={`rounded-xl px-2.5 py-1 text-xs font-medium ${
                      activeField.key === f.key ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: colors.tick, fontSize: 11, fontFamily: CHART_FONT }}
                      axisLine={{ stroke: colors.axis }}
                      tickLine={false}
                      interval={Math.ceil(chartData.length / 5)}
                    />
                    <YAxis
                      tick={{ fill: colors.tick, fontSize: 11, fontFamily: CHART_FONT }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                      domain={['dataMin - 1', 'dataMax + 1']}
                    />
                    <Tooltip
                      contentStyle={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: 8, fontFamily: CHART_FONT }}
                      labelStyle={{ color: colors.tooltipText }}
                      formatter={(value) => [`${value} ${lengthUnit}`, activeField.label]}
                    />
                    <Line type="monotone" dataKey="value" stroke={activeField.color} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState variant="list" message="No measurements logged yet." />
      )}
    </div>
  )
}

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

      <WeightChart />

      <BodyMeasurementsCard />

      <ProgressCalendar />

      <GoalList category="workout" title="Workout goals" />
      <GoalList category="custom" title="Custom goals" />
    </div>
  )
}
