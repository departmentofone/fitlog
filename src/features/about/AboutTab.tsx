import { formatBuildTime } from '../../lib/buildInfo'

const cardClass = 'card p-4'

export function AboutTab() {
  return (
    <div className="space-y-4 p-4">
      <div className={cardClass}>
        <h2 className="text-xl font-bold text-white">FitLog</h2>
        <p className="mt-1 text-sm text-slate-400">A combined workout and meal/macro tracker.</p>
      </div>

      <div className={cardClass}>
        <h3 className="mb-2 text-sm font-medium text-white">What this app does</h3>
        <p className="text-sm leading-relaxed text-slate-400">
          FitLog logs your workouts — sets, reps, weight, muscle groups, and personal records — alongside your meals,
          macros, and calories. It also tracks fasting windows and hands out achievements as you go. You can build
          reusable workout and meal programs and share them, instead of re-entering the same routine every time.
        </p>
      </div>

      <div className={cardClass}>
        <p className="text-sm leading-relaxed text-slate-400">
          <span className="font-medium text-white">Free, no ads, no paywalls.</span> Every feature is available to
          everyone, with no paid features whatsoever.
        </p>
      </div>


      <div className={cardClass}>
        <h3 className="mb-2 text-sm font-medium text-white">Tip: customize your bottom bar</h3>
        <p className="text-sm leading-relaxed text-slate-400">
          Workouts and Meals are always in the bottom bar, and everything else is under{' '}
          <span className="font-medium text-slate-200">More</span>. You can pin two more sections next to them from{' '}
          <span className="font-medium text-slate-200">Settings</span> (the gear, top-right) → Bottom bar.
        </p>
      </div>

      <div className={cardClass}>
        <h3 className="mb-2 text-sm font-medium text-white">Data & privacy</h3>
        <p className="text-sm leading-relaxed text-slate-400">
          Your data is private to your account — it's never sold, never used for ads, and FitLog has no trackers.
          You can export everything or delete your account at any time from Settings.
        </p>
        <a
          href="/privacy"
          target="_blank"
          rel="noopener"
          className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-400"
        >
          Read the privacy policy
        </a>
      </div>

      <p className="text-center text-xs text-slate-500">Build {formatBuildTime()}</p>
    </div>
  )
}
