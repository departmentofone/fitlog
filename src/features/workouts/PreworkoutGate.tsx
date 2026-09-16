export function PreworkoutGate({ onAnswer, loading }: { onAnswer: (preworkout: boolean) => void; loading?: boolean }) {
  return (
    <div className="p-4">
      <div className="rounded-3xl bg-slate-900 p-5 text-center shadow-lg shadow-black/20 shadow-[var(--glow-shadow)] ring-1 ring-white/5">
        <h2 className="mb-2 text-lg font-semibold text-white">Start today's workout</h2>
        <p className="mb-4 text-sm text-slate-400">Did you take preworkout?</p>
        <div className="flex justify-center gap-3">
          <button
            disabled={loading}
            onClick={() => onAnswer(true)}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
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
      </div>
    </div>
  )
}
