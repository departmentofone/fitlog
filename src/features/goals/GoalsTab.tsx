import { useState } from 'react'
import { useCreateGoal, useDeleteGoal, useGoals, useToggleGoal } from '../../hooks/useGoals'
import { useUpdateSettings, useUserSettings } from '../../hooks/useUserSettings'
import type { ActivityLevel, GoalCategory, Sex } from '../../types'

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very active' },
]

function GoalList({ category, title }: { category: GoalCategory; title: string }) {
  const { data: goals = [] } = useGoals()
  const createGoal = useCreateGoal()
  const toggleGoal = useToggleGoal()
  const deleteGoal = useDeleteGoal()
  const [title_, setTitleInput] = useState('')
  const [adding, setAdding] = useState(false)

  const filtered = goals.filter((g) => g.category === category)

  function handleAdd() {
    if (!title_.trim()) return
    createGoal.mutate({ category, title: title_.trim() })
    setTitleInput('')
    setAdding(false)
  }

  return (
    <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <h3 className="mb-3 font-medium text-white">{title}</h3>
      <div className="mb-3 space-y-1.5">
        {filtered.map((g) => (
          <div key={g.id} className="flex items-center gap-3 rounded-lg bg-slate-800/60 px-3 py-2">
            <input
              type="checkbox"
              checked={g.completed}
              onChange={(e) => toggleGoal.mutate({ id: g.id, completed: e.target.checked })}
              className="h-5 w-5 shrink-0 accent-emerald-500"
            />
            <span className={`flex-1 text-sm ${g.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
              {g.title}
            </span>
            <button onClick={() => deleteGoal.mutate(g.id)} className="text-red-400 hover:text-red-300">
              ×
            </button>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate-500">No goals yet.</p>}
      </div>

      {adding ? (
        <div className="flex gap-2">
          <input
            autoFocus
            value={title_}
            onChange={(e) => setTitleInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Goal…"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <button onClick={handleAdd} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full rounded-lg border border-dashed border-slate-700 py-2 text-sm font-medium text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
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

  function startEditing() {
    setWeight(settings?.current_weight != null ? String(settings.current_weight) : '')
    setWeightGoal(settings?.weight_goal != null ? String(settings.weight_goal) : '')
    setHeight(settings?.height_cm != null ? String(settings.height_cm) : '')
    setAge(settings?.age != null ? String(settings.age) : '')
    setSex(settings?.sex ?? '')
    setActivity(settings?.activity_level ?? '')
    setEditingStats(true)
  }

  function saveStats() {
    updateSettings.mutate({
      current_weight: weight ? parseFloat(weight) : null,
      weight_goal: weightGoal ? parseFloat(weightGoal) : null,
      height_cm: height ? parseFloat(height) : null,
      age: age ? parseInt(age, 10) : null,
      sex: sex || null,
      activity_level: activity || null,
    })
    setEditingStats(false)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-white">Personal info & weight goal</h3>
          {!editingStats && (
            <button onClick={startEditing} className="text-xs text-slate-400 hover:text-slate-200">
              Edit
            </button>
          )}
        </div>

        {editingStats ? (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <input
                placeholder="Current weight (kg)"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <input
                placeholder="Goal weight (kg)"
                type="number"
                value={weightGoal}
                onChange={(e) => setWeightGoal(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <input
                placeholder="Height (cm)"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <input
                placeholder="Age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as Sex | '')}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Sex (optional)</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityLevel | '')}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Activity level (optional)</option>
              {ACTIVITY_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setEditingStats(false)} className="flex-1 rounded-lg bg-slate-800 py-2 text-sm text-slate-300 hover:bg-slate-700">
                Cancel
              </button>
              <button onClick={saveStats} className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500">
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
            <p>Weight: {settings?.current_weight ?? '—'} kg</p>
            <p>Goal: {settings?.weight_goal ?? '—'} kg</p>
            <p>Height: {settings?.height_cm ?? '—'} cm</p>
            <p>Age: {settings?.age ?? '—'}</p>
          </div>
        )}
      </div>

      <GoalList category="workout" title="Workout goals" />
      <GoalList category="custom" title="Custom goals" />
    </div>
  )
}
