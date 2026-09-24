import type { Explainer } from '../lib/explainers'

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16.5" />
      <circle cx="12" cy="7.75" r="0.6" fill="currentColor" />
    </svg>
  )
}

/**
 * What an empty Community section is for, plus one realistic example. The example sits in a
 * dashed box labelled "Example" so it can't be mistaken for something someone shared.
 */
export function ExplainerCard({ explainer }: { explainer: Explainer }) {
  const { title, body, example } = explainer
  return (
    <section className="fade-in rounded-2xl bg-emerald-500/[0.07] p-3.5 ring-1 ring-emerald-500/25">
      <div className="flex items-center gap-2">
        <span className="text-emerald-400">
          <InfoIcon />
        </span>
        <h3 className="flex-1 text-sm font-semibold text-white">{title}</h3>
      </div>
      <p className="mt-1 text-[13px] leading-snug text-slate-300">{body}</p>

      <div className="mt-2.5 rounded-xl border border-dashed border-slate-600 bg-slate-900/60 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-medium text-white">{example.name}</p>
          <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Example
          </span>
        </div>
        <ul className="mt-1 space-y-0.5">
          {example.lines.map((line) => (
            <li key={line} className="text-xs leading-snug text-slate-400">
              {line}
            </li>
          ))}
        </ul>
        {example.footer && <p className="mt-1 text-xs font-medium tabular-nums text-emerald-400/90">{example.footer}</p>}
      </div>
    </section>
  )
}
