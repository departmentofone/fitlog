import { useMemo } from 'react'

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function MonthCalendar({
  month,
  onMonthChange,
  markedDates,
  selectedDate,
  onSelectDate,
  maxDate,
}: {
  month: Date
  onMonthChange: (d: Date) => void
  markedDates: Set<string>
  selectedDate: string | null
  onSelectDate: (iso: string) => void
  maxDate?: string
}) {
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const startOffset = first.getDay()
    const numDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const result: (Date | null)[] = Array(startOffset).fill(null)
    for (let d = 1; d <= numDays; d++) result.push(new Date(month.getFullYear(), month.getMonth(), d))
    return result
  }, [month])

  const todayIso = toISODate(new Date())

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="h-7 w-7 rounded-full text-slate-400 hover:bg-white/5 hover:text-slate-200"
        >
          ‹
        </button>
        <span className="text-sm text-slate-300">
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="h-7 w-7 rounded-full text-slate-400 hover:bg-white/5 hover:text-slate-200"
        >
          ›
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-xs text-slate-500">
        {WEEKDAY_LABELS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />
          const iso = toISODate(date)
          const marked = markedDates.has(iso)
          const isToday = iso === todayIso
          const disabled = maxDate ? iso > maxDate : false
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onSelectDate(iso)}
              className={`relative aspect-square rounded-xl text-xs font-medium transition disabled:opacity-30 ${
                selectedDate === iso
                  ? 'bg-emerald-600 text-white'
                  : isToday
                    ? 'bg-slate-800 text-emerald-400 ring-1 ring-emerald-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {date.getDate()}
              {marked && selectedDate !== iso && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-400" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
