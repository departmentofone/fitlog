import { parseDecimal } from '../../lib/number'
import { useState } from 'react'
import { useToast } from '../../components/ToastProvider'
import {
  estimateAlcoholCalories,
  useAddAlcoholLog,
  useAlcoholLogsForDate,
  useDeleteAlcoholLog,
} from '../../hooks/useAlcoholLogs'
import { todayISO } from '../../hooks/useWorkouts'

const COMMON_DRINKS = [
  { name: 'Beer (500ml, 5%)', volumeMl: 500, abvPercent: 5 },
  { name: 'Wine (150ml, 12%)', volumeMl: 150, abvPercent: 12 },
  { name: 'Shot (40ml, 40%)', volumeMl: 40, abvPercent: 40 },
]

export function AlcoholSection() {
  const [date, setDate] = useState(todayISO())
  const { data: logs = [] } = useAlcoholLogsForDate(date)
  const addLog = useAddAlcoholLog()
  const deleteLog = useDeleteAlcoholLog()
  const { undoable } = useToast()

  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [volumeMl, setVolumeMl] = useState('')
  const [abvPercent, setAbvPercent] = useState('')
  const [manualCalories, setManualCalories] = useState('')
  const [useManual, setUseManual] = useState(false)

  const totalCalories = logs.reduce((sum, l) => sum + l.calories, 0)

  function reset() {
    setName('')
    setVolumeMl('')
    setAbvPercent('')
    setManualCalories('')
    setUseManual(false)
    setAdding(false)
  }

  function handleAdd() {
    if (!name.trim()) return
    const calories = useManual
      ? parseDecimal(manualCalories) || 0
      : estimateAlcoholCalories(parseDecimal(volumeMl) || 0, parseDecimal(abvPercent) || 0)
    addLog.mutate({
      date,
      name: name.trim(),
      volumeMl: useManual ? null : parseDecimal(volumeMl) || null,
      abvPercent: useManual ? null : parseDecimal(abvPercent) || null,
      calories,
    })
    reset()
  }

  const isToday = date === todayISO()
  const shiftDate = (days: number) => {
    const d = new Date(`${date}T00:00:00`)
    d.setDate(d.getDate() + days)
    setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  const dayLabel = isToday
    ? 'Today'
    : new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const navButton = 'flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 active:bg-slate-800 disabled:opacity-30'

  return (
    <div className="rounded-3xl bg-slate-900 border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      {/* Compact header: day switcher inline, and the totals only once there's something to total -
          previously a full date bar plus a big "0 kcal / 0 drinks" box every day. */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-medium text-white">Alcohol</h3>
          {logs.length > 0 && (
            <p className="text-xs text-slate-400">
              {logs.length} drink{logs.length === 1 ? '' : 's'} · {Math.round(totalCalories)} kcal
            </p>
          )}
        </div>
        <div className="flex items-center">
          <button type="button" aria-label="Previous day" onClick={() => shiftDate(-1)} className={navButton}>
            ‹
          </button>
          <span className="min-w-16 text-center text-xs font-medium text-slate-300">{dayLabel}</span>
          <button type="button" aria-label="Next day" disabled={isToday} onClick={() => shiftDate(1)} className={navButton}>
            ›
          </button>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {logs.map((l) => (
            <div key={l.id} className="flex min-h-11 items-center justify-between rounded-xl bg-slate-800/60 pl-3 text-sm text-slate-300">
              <span>{l.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500">{Math.round(l.calories)} kcal</span>
                <button
                  onClick={() => undoable(`Removed ${l.name}`, () => deleteLog.mutate(l.id), () => addLog.mutate({ date, name: l.name, volumeMl: l.volume_ml, abvPercent: l.abv_percent, calories: l.calories }))}
                  aria-label={`Remove ${l.name}`}
                  className="flex h-11 w-10 items-center justify-center text-slate-500 active:text-red-400"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="rounded-2xl bg-slate-800/60 p-3">
          <input
            autoFocus
            placeholder="Drink name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <div className="mb-2 flex flex-wrap gap-1.5">
            {COMMON_DRINKS.map((d) => (
              <button
                key={d.name}
                onClick={() => {
                  setName(d.name)
                  setVolumeMl(String(d.volumeMl))
                  setAbvPercent(String(d.abvPercent))
                  setUseManual(false)
                }}
                className="rounded-full bg-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-600"
              >
                {d.name}
              </button>
            ))}
          </div>
          <button onClick={() => setUseManual((v) => !v)} className="mb-2 text-xs text-emerald-400 hover:text-emerald-300">
            {useManual ? 'Use volume + ABV instead' : 'Enter calories directly instead'}
          </button>
          {useManual ? (
            <input
              type="text"
              inputMode="decimal"
              placeholder="Calories"
              value={manualCalories}
              onChange={(e) => setManualCalories(e.target.value)}
              className="mb-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          ) : (
            <div className="mb-2 grid grid-cols-2 gap-2">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Volume (ml)"
                value={volumeMl}
                onChange={(e) => setVolumeMl(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder="ABV %"
                value={abvPercent}
                onChange={(e) => setAbvPercent(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 rounded-xl bg-slate-700 py-2 text-sm text-slate-300 hover:bg-slate-600">
              Cancel
            </button>
            <button onClick={handleAdd} disabled={!name.trim()} className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-medium text-on-accent hover:brightness-90 disabled:opacity-50">
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full rounded-xl border border-dashed border-slate-700 py-2 text-sm font-medium text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
        >
          + Log a drink
        </button>
      )}
    </div>
  )
}
