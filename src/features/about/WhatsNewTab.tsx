import { CHANGELOG } from '../../lib/changelog'

export function WhatsNewTab() {
  return (
    <div className="space-y-4 p-4">
      {CHANGELOG.map((entry, i) => (
        <div
          key={entry.date + entry.title}
          className={`rounded-3xl bg-slate-900 border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5 ${
            i === 0 ? 'shadow-[var(--glow-shadow)]' : ''
          }`}
        >
          <p className="mb-1 text-xs text-slate-500">
            {new Date(entry.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <h3 className="mb-2 font-medium text-white">{entry.title}</h3>
          <ul className="space-y-1.5">
            {entry.changes.map((change) => (
              <li key={change} className="flex gap-2 text-sm text-slate-400">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                {change}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
