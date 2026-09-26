import { useRef } from 'react'

function localISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function shiftISO(date: string, days: number) {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** "Today", "Yesterday", or "Thu 24 Sep" (with the year when it isn't this year). */
export function formatDayLabel(date: string, today = localISO(new Date())): string {
  if (date === today) return 'Today'
  if (date === shiftISO(today, -1)) return 'Yesterday'
  if (date === shiftISO(today, 1)) return 'Tomorrow'
  const d = new Date(date + 'T00:00:00Z')
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(date.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  })
}

/**
 * Day switcher: arrows either side of a readable label ("Today", "Thu 24 Sep") that opens the
 * native date picker. Replaced a raw date field showing "24/09/2026".
 */
export function DateNav({
  date,
  onChange,
  max,
}: {
  date: string
  onChange: (date: string) => void
  max?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const today = localISO(new Date())
  const atMax = max ? date >= max : false

  function openPicker() {
    const input = inputRef.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      // Older browsers without showPicker(): focusing still opens the picker on most phones.
      input.focus()
      input.click()
    }
  }

  const arrowClass =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-300 transition active:bg-white/10 disabled:opacity-30'

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(shiftISO(date, -1))} aria-label="Previous day" className={arrowClass}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <div className="relative flex min-w-0 flex-1 items-center justify-center gap-2">
        <button
          onClick={openPicker}
          aria-label={`${formatDayLabel(date, today)} - pick a date`}
          className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-base font-semibold text-white transition active:bg-white/10"
        >
          {formatDayLabel(date, today)}
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {date !== today && (!max || today <= max) && (
          <button onClick={() => onChange(today)} className="chip chip-accent min-h-7">
            Today
          </button>
        )}
        {/* The real picker - invisible, opened by the label above. */}
        <input
          ref={inputRef}
          type="date"
          value={date}
          max={max}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 h-0 w-0 opacity-0"
        />
      </div>

      <button onClick={() => onChange(shiftISO(date, 1))} disabled={atMax} aria-label="Next day" className={arrowClass}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  )
}
