import { useBackToClose } from '../../hooks/useHashRoute'

const RULES: { title: string; text: string }[] = [
  { title: 'Real and honest', text: 'Real meals, workouts and diets, with amounts you actually use.' },
  { title: 'Respectful', text: 'No offensive, hateful or sexual names or content.' },
  { title: 'Private', text: "No personal details - phone numbers, addresses, or other people's names." },
  { title: 'No ads', text: 'No spam, promotions or links.' },
  { title: 'Safe', text: 'No medical claims, and nothing extreme presented as advice, like crash diets.' },
]

/**
 * Community guidelines, shown before someone shares for the first time (Google Play's rules for
 * user-generated content ask for this), and viewable any time from the Community tab.
 */
export function GuidelinesSheet({ onAgree, onClose, agreeing }: { onAgree?: () => void; onClose: () => void; agreeing?: boolean }) {
  useBackToClose(true, onClose)
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="fade-in absolute inset-0 bg-black/60" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guidelines-title"
        onClick={(e) => e.stopPropagation()}
        className="sheet-up relative max-h-[85%] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-slate-950 px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-700" />
        <h2 id="guidelines-title" className="text-lg font-semibold text-white">
          Community guidelines
        </h2>
        <p className="mt-1 text-sm text-slate-400">Everything you share is visible to everyone on FitLog. Keep it:</p>
        <ul className="mt-4 space-y-3">
          {RULES.map((r) => (
            <li key={r.title} className="flex gap-3">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="5 12.5 10 17 19 7.5" />
                </svg>
              </span>
              <span className="text-sm">
                <span className="font-semibold text-white">{r.title}.</span> <span className="text-slate-400">{r.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          Anyone can report something that breaks these, and it can be removed from Community. Your name and email are never shown.
        </p>
        {onAgree ? (
          <div className="mt-5 flex gap-2">
            <button onClick={onClose} className="min-h-12 flex-1 rounded-xl bg-slate-800 text-sm font-medium text-slate-300">
              Cancel
            </button>
            <button
              onClick={onAgree}
              disabled={agreeing}
              className="btn btn-primary min-h-12 flex-1 text-sm"
            >
              I agree - share it
            </button>
          </div>
        ) : (
          <button onClick={onClose} className="mt-5 min-h-12 w-full rounded-xl bg-slate-800 text-sm font-medium text-slate-300">
            Close
          </button>
        )}
      </div>
    </div>
  )
}
