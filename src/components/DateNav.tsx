export function DateNav({
  date,
  onChange,
  max,
}: {
  date: string
  onChange: (date: string) => void
  max?: string
}) {
  function shift(days: number) {
    const d = new Date(date + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + days)
    onChange(d.toISOString().slice(0, 10))
  }

  const atMax = max ? date >= max : false

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => shift(-1)}
        aria-label="Previous day"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 transition hover:bg-slate-700"
      >
        ‹
      </button>
      <input
        type="date"
        value={date}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 field px-2 py-2 text-sm"
      />
      <button
        onClick={() => shift(1)}
        disabled={atMax}
        aria-label="Next day"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 transition hover:bg-slate-700 disabled:opacity-30"
      >
        ›
      </button>
    </div>
  )
}
