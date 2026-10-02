import { useState } from 'react'
import { useToast } from '../../components/ToastProvider'
import { useProgressEntries, useUpsertProgressEntry } from '../../hooks/useProgressEntries'
import { useUserSettings } from '../../hooks/useUserSettings'
import { haptics } from '../../lib/haptics'
import { localISO } from '../../lib/localDate'
import { parseDecimal } from '../../lib/number'
import { formatWeight, fromDisplayWeight, toDisplayWeight, weightUnitLabel } from '../../lib/units'

/**
 * Today's weigh-in, at the top of Body: the one thing people log here daily. It used to take the
 * progress calendar, four cards down. Saving also becomes your current weight (useUpsertProgressEntry).
 */
export function QuickWeighIn() {
  const { data: entries = [] } = useProgressEntries()
  const { data: settings } = useUserSettings()
  const upsert = useUpsertProgressEntry()
  const { show } = useToast()
  const unit = settings?.unit_system
  const today = localISO()

  const weighIns = entries.filter((e) => e.weight != null)
  const todays = weighIns.find((e) => e.date === today)
  const previous = weighIns.find((e) => e.date < today)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')

  function open() {
    const start = todays?.weight ?? previous?.weight ?? settings?.current_weight
    setValue(start != null ? String(toDisplayWeight(start, unit)) : '')
    setEditing(true)
  }

  function save() {
    const v = parseDecimal(value)
    if (!Number.isFinite(v) || v <= 0) return
    const kg = fromDisplayWeight(v, unit)
    upsert.mutate(
      { date: today, weight: kg, notes: entries.find((e) => e.date === today)?.notes ?? null },
      {
        onSuccess: () => {
          haptics.success()
          setEditing(false)
        },
        onError: () => show("Couldn't save your weight. Try again."),
      },
    )
  }

  function nudge(dir: 1 | -1) {
    const v = parseDecimal(value)
    const base = Number.isFinite(v) ? v : 0
    setValue(String(Math.max(0, Math.round((base + dir * 0.1) * 10) / 10)))
  }

  const change = todays?.weight != null && previous?.weight != null ? todays.weight - previous.weight : null
  const goal = settings?.weight_goal

  return (
    <section className="card card-glow p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="card-title">Today's weight</h2>
        {!editing && todays && (
          <button onClick={open} className="-my-2 -mr-2 min-h-11 px-2 text-xs font-medium text-emerald-400">
            Change
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => nudge(-1)} aria-label="Decrease by 0.1" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-lg font-semibold text-slate-200 active:bg-slate-700">
              −
            </button>
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Weight in {weightUnitLabel(unit)}</span>
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                className="h-12 w-full field px-3 pr-10 text-center text-lg font-semibold tabular-nums"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">{weightUnitLabel(unit)}</span>
            </label>
            <button type="button" onClick={() => nudge(1)} aria-label="Increase by 0.1" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-lg font-semibold text-slate-200 active:bg-slate-700">
              +
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setEditing(false)} className="btn btn-secondary flex-1 text-sm">
              Cancel
            </button>
            <button onClick={save} disabled={upsert.isPending || !value} className="btn btn-primary flex-1 text-sm">
              {upsert.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : todays?.weight != null ? (
        <div className="mt-1 flex items-end justify-between gap-3">
          <p className="text-3xl font-bold tracking-tight text-white">
            {toDisplayWeight(todays.weight, unit)} <span className="text-sm font-medium text-slate-400">{weightUnitLabel(unit)}</span>
          </p>
          <div className="pb-1 text-right text-xs text-slate-400">
            {change != null && Math.abs(change) >= 0.05 && (
              <p>
                {change < 0 ? 'Down' : 'Up'} {formatWeight(Math.abs(change), unit)} since {new Date(previous!.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
            )}
            {goal != null && <p className="text-slate-500">Goal {formatWeight(goal, unit)}</p>}
          </div>
        </div>
      ) : (
        <div className="mt-1">
          <p className="text-sm text-slate-400">
            {previous?.weight != null
              ? `Last weigh-in: ${formatWeight(previous.weight, unit)} on ${new Date(previous.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.`
              : 'Weigh in to start your trend. It also keeps your calorie numbers current.'}
          </p>
          <button onClick={open} className="btn btn-primary mt-3 w-full text-sm">
            Log today's weight
          </button>
        </div>
      )}
    </section>
  )
}
