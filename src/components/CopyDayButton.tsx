import { useState } from 'react'
import { useBackToClose } from '../hooks/useHashRoute'
import { localISO } from '../lib/localDate'
import { dayPhrase } from '../lib/dayLabel'

function shiftISO(date: string, days: number) {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * "Copy day", in the row of quiet tools under a day's log. A day with entries copies them to
 * another day; an empty day fills itself from another one ("eat what I ate yesterday"). The choices
 * open in a sheet: the date field used to unfold inside the row and push it wider than the screen.
 */
export function CopyDayButton({
  date,
  hasEntries,
  noun,
  onCopy,
}: {
  /** The day on screen. */
  date: string
  hasEntries: boolean
  /** What gets copied, for the sheet's wording: "meals" or "workout". */
  noun: string
  onCopy: (fromDate: string, toDate: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState('')
  useBackToClose(open, () => setOpen(false))

  const today = localISO()
  const day = dayPhrase(date, today)
  const relative = day === 'today' || day === 'yesterday' || day === 'tomorrow'

  function copy(from: string, to: string) {
    onCopy(from, to)
    setOpen(false)
    setPicked('')
  }

  // Copying out: to today, or to the day after the one on screen. Copying in: from the day before.
  const quick: { label: string; from: string; to: string }[] = hasEntries
    ? [
        ...(date !== today ? [{ label: 'To today', from: date, to: today }] : []),
        { label: `To ${dayPhrase(shiftISO(date, 1), today)}`, from: date, to: shiftISO(date, 1) },
      ]
    : [{ label: `From ${dayPhrase(shiftISO(date, -1), today)}`, from: shiftISO(date, -1), to: date }]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="min-h-9 flex-1 rounded-xl bg-slate-800/60 px-3 text-xs font-medium text-slate-400 transition active:bg-slate-700"
      >
        Copy day
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setOpen(false)}>
          <div className="fade-in absolute inset-0 bg-black/60" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="copy-day-title"
            onClick={(e) => e.stopPropagation()}
            className="sheet-up relative rounded-t-3xl border-t border-white/10 bg-slate-950 px-5 pt-2 pb-[max(1.25rem,var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))] shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-700" />
            <h2 id="copy-day-title" className="text-lg font-semibold text-white">
              {hasEntries ? (relative ? `Copy ${day}'s ${noun}` : `Copy the ${noun} from ${day}`) : `Fill ${day} from another day`}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {hasEntries
                ? `Everything logged ${relative ? day : 'that day'} is added to the day you pick, on top of anything already there.`
                : `Copies another day's ${noun} into ${relative ? day : 'this day'}, ready to edit.`}
            </p>

            <div className="mt-4 space-y-2">
              {quick.map((q) => (
                <button key={q.label} onClick={() => copy(q.from, q.to)} className="btn btn-secondary w-full justify-start text-sm">
                  {q.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label htmlFor="copy-day-date" className="mb-1.5 block text-xs font-semibold text-slate-400">
                {hasEntries ? 'Or pick a day to copy to' : 'Or pick a day to copy from'}
              </label>
              <div className="flex gap-2">
                <input
                  id="copy-day-date"
                  type="date"
                  value={picked}
                  max={hasEntries ? undefined : today}
                  onChange={(e) => setPicked(e.target.value)}
                  className="min-w-0 flex-1 field px-3 py-2.5 text-sm"
                />
                <button
                  onClick={() => picked && picked !== date && copy(hasEntries ? date : picked, hasEntries ? picked : date)}
                  disabled={!picked || picked === date}
                  className="btn btn-primary shrink-0 text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
