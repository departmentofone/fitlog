import { localISO } from '../lib/localDate'
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
 * native date picker. The real <input type="date"> sits invisibly on top of the label, so the tap
 * lands on the input itself - calling showPicker() on a hidden 0x0 input did nothing on some
 * phones, which left the label's dropdown arrow looking broken.
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
  const today = localISO(new Date())
  const atMax = max ? date >= max : false
  const label = formatDayLabel(date, today)

  // Desktop Chrome only opens the picker from its calendar icon, not a click on the field, so ask
  // for it explicitly. Phones open it from the tap anyway; showPicker() may throw where unsupported.
  function openPicker(e: React.MouseEvent<HTMLInputElement>) {
    try {
      e.currentTarget.showPicker()
    } catch {
      // The tap on the input still opens the picker natively.
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
        <span className="relative flex min-h-11 items-center gap-1.5 rounded-full px-3 text-base font-semibold text-white transition focus-within:ring-2 focus-within:ring-white/30 has-[:active]:bg-white/10">
          <span aria-hidden="true">{label}</span>
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
          {/* The real picker, invisible and covering the label so taps open it directly. */}
          <input
            type="date"
            value={date}
            max={max}
            onChange={(e) => e.target.value && onChange(e.target.value)}
            onClick={openPicker}
            aria-label={`${label} - pick a date`}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
          />
        </span>
        {date !== today && (!max || today <= max) && (
          <button onClick={() => onChange(today)} className="chip chip-accent min-h-7">
            Today
          </button>
        )}
      </div>

      <button onClick={() => onChange(shiftISO(date, 1))} disabled={atMax} aria-label="Next day" className={arrowClass}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  )
}
