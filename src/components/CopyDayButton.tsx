import { useState } from 'react'

export function CopyDayButton({
  onCopy,
  disabled,
  label = 'Copy day',
}: {
  onCopy: (targetDate: string) => void
  disabled?: boolean
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [targetDate, setTargetDate] = useState('')

  if (!open) {
    return (
      <button
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="flex-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 disabled:opacity-40"
      >
        {label}
      </button>
    )
  }

  return (
    <div className="flex flex-1 items-center gap-1.5">
      <input
        type="date"
        value={targetDate}
        onChange={(e) => setTargetDate(e.target.value)}
        className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
      />
      <button
        onClick={() => {
          if (!targetDate) return
          onCopy(targetDate)
          setOpen(false)
          setTargetDate('')
        }}
        className="shrink-0 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-on-accent hover:brightness-90"
      >
        Copy
      </button>
      <button
        onClick={() => setOpen(false)}
        className="shrink-0 rounded-xl bg-slate-800 px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-700"
      >
        ×
      </button>
    </div>
  )
}
