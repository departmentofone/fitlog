export function PreworkoutGate({
  onAnswer,
  loading,
  onLogRestDay,
  logRestDayPending,
}: {
  onAnswer: (preworkout: boolean) => void
  loading?: boolean
  /** Once logged, WorkoutsTab swaps this whole prompt for RestDayCard. */
  onLogRestDay?: () => void
  logRestDayPending?: boolean
}) {
  return (
    <div className="p-4">
      <div className="rounded-3xl bg-slate-900 border-t border-white/10 p-5 text-center shadow-lg shadow-black/20 shadow-[var(--glow-shadow)] ring-1 ring-white/5">
        <h2 className="mb-2 text-lg font-semibold text-white">Start today's workout</h2>
        <p className="mb-4 text-sm text-slate-400">Did you take preworkout?</p>
        <div className="flex justify-center gap-3">
          <button
            disabled={loading}
            onClick={() => onAnswer(true)}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-on-accent transition hover:brightness-90 disabled:opacity-50"
          >
            Yes
          </button>
          <button
            disabled={loading}
            onClick={() => onAnswer(false)}
            className="rounded-xl bg-slate-800 px-5 py-2.5 font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
          >
            No
          </button>
        </div>
        {onLogRestDay && (
          <button
            onClick={onLogRestDay}
            disabled={logRestDayPending}
            className="mt-4 text-xs font-medium text-slate-500 underline decoration-dotted transition hover:text-emerald-400 disabled:opacity-50"
          >
            {logRestDayPending ? 'Logging rest day…' : 'Not training today? Log a rest day instead'}
          </button>
        )}
      </div>
    </div>
  )
}
