/**
 * Shown instead of the "Start today's workout" prompt once today is logged as a rest day - a clear
 * confirmation that it counted, rather than a greyed-out line of text under the preworkout question.
 * Undo removes the rest day and brings the prompt back.
 */
export function RestDayCard({ onUndo, undoing }: { onUndo: () => void; undoing?: boolean }) {
  return (
    <div className="p-4">
      <div
        role="status"
        className="pop-in rounded-3xl bg-gradient-to-br from-emerald-600/20 to-slate-900 p-6 text-center shadow-lg shadow-black/20 ring-1 ring-emerald-500/20"
      >
        <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
          <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-on-accent ring-4 ring-slate-900">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="5 12.5 10 17 19 7.5" />
            </svg>
          </span>
        </div>
        <h2 className="text-lg font-semibold text-white">Rest day logged</h2>
        <p className="mx-auto mt-1 max-w-[18rem] text-balance text-sm text-slate-400">Recovery is part of training. Your streak is safe.</p>
        <button
          onClick={onUndo}
          disabled={undoing}
          className="mt-5 min-h-11 rounded-xl bg-slate-800 px-6 text-sm font-medium text-slate-300 disabled:opacity-50"
        >
          {undoing ? 'Undoing…' : 'Undo'}
        </button>
      </div>
    </div>
  )
}
