import { formatBuildTime } from '../../lib/buildInfo'

const FEEDBACK_EMAIL = 'msolarovsocial@gmail.com'

export function AboutTab() {
  return (
    <div className="space-y-4 p-4">
      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h2 className="text-xl font-bold text-white">FitLog</h2>
        <p className="mt-1 text-sm text-slate-400">A combined workout and meal/macro tracker.</p>
      </div>

      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-2 text-sm font-medium text-white">What this app does</h3>
        <p className="text-sm leading-relaxed text-slate-400">
          FitLog logs your workouts — sets, reps, weight, muscle groups, and personal records — alongside your meals,
          macros, and calories. It also tracks fasting windows and hands out achievements as you go. You can build
          reusable workout and meal programs and share them, instead of re-entering the same routine every time.
        </p>
      </div>

      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <p className="text-sm text-slate-400">
          <span className="font-medium text-white">Free, no ads, nothing paywalled.</span> Every feature is
          available to everyone.
        </p>
      </div>

      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-2 text-sm font-medium text-white">Tip: customize your tabs</h3>
        <p className="text-sm leading-relaxed text-slate-400">
          There are a lot of tabs these days — Workouts, Meals, Scanner, Diet, Fasting, Goals, Achievements,
          Programs, About. Workouts and Meals are always pinned to the bottom bar, but only two more slots fit
          alongside them. Open <span className="font-medium text-slate-200">Settings (⚙️ in the header)</span> to
          choose which tabs show there.
        </p>
      </div>

      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-2 text-sm font-medium text-white">Data & privacy</h3>
        <p className="text-sm leading-relaxed text-slate-400">
          Your data is private to your account — it isn't shared or sold. This is a small personal project without
          a formal privacy policy, so treat that as an informal assurance rather than a legal one.
        </p>
      </div>

      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-2 text-sm font-medium text-white">Send feedback</h3>
        <p className="mb-3 text-sm text-slate-400">
          Found a bug, or have an idea for something to add? It goes straight to the developer.
        </p>
        <a
          href={`mailto:${FEEDBACK_EMAIL}`}
          className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Email {FEEDBACK_EMAIL}
        </a>
      </div>

      <p className="text-center text-xs text-slate-600">Build {formatBuildTime()}</p>
    </div>
  )
}
