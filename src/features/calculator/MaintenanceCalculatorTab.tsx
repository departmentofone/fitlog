import { useEffect, useState } from 'react'
import { estimateTDEE } from '../../lib/tdee'
import { cmToIn, inToCm, kgToLb, lbToKg } from '../../lib/units'
import { useUpdateSettings, useUserSettings } from '../../hooks/useUserSettings'
import type { ActivityLevel, DietGoal, Sex } from '../../types'

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; hint: string }[] = [
  { value: 'sedentary', label: 'Sedentary', hint: 'Little or no exercise' },
  { value: 'light', label: 'Light', hint: '1-3 workouts/week' },
  { value: 'moderate', label: 'Moderate', hint: '3-5 workouts/week' },
  { value: 'active', label: 'Active', hint: '6-7 workouts/week' },
  { value: 'very_active', label: 'Very active', hint: 'Physical job or 2x/day training' },
]

const fieldClass =
  'rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none'

export function MaintenanceCalculatorTab() {
  const { data: settings } = useUserSettings()
  const updateSettings = useUpdateSettings()
  const imperial = settings?.unit_system === 'imperial'
  const weightUnit = imperial ? 'lb' : 'kg'
  const heightUnit = imperial ? 'in' : 'cm'

  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<Sex | ''>('')
  const [activity, setActivity] = useState<ActivityLevel | ''>('')
  const [preFilled, setPreFilled] = useState(false)

  // Pre-fill once from the saved profile (Goals tab), if present - fields stay freely editable
  // afterward so this also works as a standalone "what if" calculator.
  useEffect(() => {
    if (!settings || preFilled) return
    if (settings.current_weight != null) {
      setWeight(String(Math.round((imperial ? kgToLb(settings.current_weight) : settings.current_weight) * 10) / 10))
    }
    if (settings.height_cm != null) {
      setHeight(String(Math.round((imperial ? cmToIn(settings.height_cm) : settings.height_cm) * 10) / 10))
    }
    if (settings.age != null) setAge(String(settings.age))
    if (settings.sex) setSex(settings.sex)
    if (settings.activity_level) setActivity(settings.activity_level)
    setPreFilled(true)
  }, [settings, preFilled, imperial])

  const weightKg = weight ? (imperial ? lbToKg(parseFloat(weight)) : parseFloat(weight)) : null
  const heightCm = height ? (imperial ? inToCm(parseFloat(height)) : parseFloat(height)) : null
  const ageNum = age ? parseInt(age, 10) : null

  const maintenance =
    weightKg != null && !isNaN(weightKg) && heightCm != null && !isNaN(heightCm) && ageNum != null && !isNaN(ageNum) && sex && activity
      ? estimateTDEE({ current_weight: weightKg, height_cm: heightCm, age: ageNum, sex, activity_level: activity })
      : null

  const cuttingGoal = maintenance != null ? maintenance - 500 : null
  const bulkingGoal = maintenance != null ? maintenance + 300 : null

  function applyGoal(goal: DietGoal) {
    if (maintenance == null) return
    const calorie_goal = goal === 'deficit' ? cuttingGoal! : goal === 'surplus' ? bulkingGoal! : maintenance
    updateSettings.mutate({ calorie_goal, diet_goal: goal })
  }

  function saveStatsToProfile() {
    if (weightKg == null || heightCm == null || ageNum == null || !sex || !activity) return
    updateSettings.mutate({ current_weight: weightKg, height_cm: heightCm, age: ageNum, sex, activity_level: activity })
  }

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-[var(--glow-shadow)] ring-1 ring-white/5">
        <h3 className="mb-1 font-medium text-white">Maintenance calculator</h3>
        <p className="mb-3 text-sm text-slate-400">
          Estimates your daily maintenance calories (Mifflin-St Jeor). Pre-filled from your profile if you've set one — change
          any field to try a different scenario.
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <input
            placeholder={`Weight (${weightUnit})`}
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={fieldClass}
          />
          <input
            placeholder={`Height (${heightUnit})`}
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className={fieldClass}
          />
          <input placeholder="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} className={fieldClass} />
          <select value={sex} onChange={(e) => setSex(e.target.value as Sex | '')} className={fieldClass}>
            <option value="">Sex</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <p className="mb-1.5 mt-3 text-xs text-slate-500">Activity level</p>
        <div className="space-y-1.5">
          {ACTIVITY_OPTIONS.map((a) => (
            <button
              key={a.value}
              onClick={() => setActivity(a.value)}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition ${
                activity === a.value ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="font-medium">{a.label}</span>
              <span className={activity === a.value ? 'text-emerald-100' : 'text-slate-500'}>{a.hint}</span>
            </button>
          ))}
        </div>

        <button
          onClick={saveStatsToProfile}
          disabled={weightKg == null || heightCm == null || ageNum == null || !sex || !activity}
          className="mt-3 w-full rounded-xl bg-slate-800 py-2 text-sm text-slate-300 transition hover:bg-slate-700 disabled:opacity-40"
        >
          Save these stats to my profile
        </button>
      </div>

      <div className="rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-3 font-medium text-white">Result</h3>
        {maintenance == null ? (
          <p className="text-sm text-slate-500">Fill in weight, height, age, sex, and activity level above to see your estimate.</p>
        ) : (
          <div className="space-y-2.5">
            <div className="rounded-2xl bg-slate-800/60 p-3 text-center">
              <p className="text-2xl font-semibold text-white">{maintenance} kcal</p>
              <p className="text-xs text-slate-500">Estimated maintenance</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => applyGoal('deficit')}
                className="rounded-xl bg-slate-800 px-2 py-2.5 text-center text-sm font-medium text-slate-200 transition hover:bg-slate-700"
              >
                Cutting
                <br />
                <span className="text-xs text-slate-400">{cuttingGoal} kcal</span>
              </button>
              <button
                onClick={() => applyGoal('surplus')}
                className="rounded-xl bg-slate-800 px-2 py-2.5 text-center text-sm font-medium text-slate-200 transition hover:bg-slate-700"
              >
                Bulking
                <br />
                <span className="text-xs text-slate-400">{bulkingGoal} kcal</span>
              </button>
            </div>
            <button
              onClick={() => applyGoal('maintenance')}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              Set as my calorie goal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
