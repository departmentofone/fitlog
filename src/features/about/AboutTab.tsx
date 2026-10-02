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
        <h2 className="mb-2 card-title">What this app does</h2>
        <p className="text-sm leading-relaxed text-slate-400">
          FitLog logs your workouts (sets, reps, weight, muscle groups and personal records) alongside your meals,
          macros, and calories. It also tracks fasting windows and hands out achievements as you go. You can build
          reusable workout and meal programs and share them, instead of re-entering the same routine every time.
        </p>
      </div>

      <div className={cardClass}>
        <p className="text-sm leading-relaxed text-slate-400">
          FitLog is made by one person who enjoys building apps.
        </p>
      </div>

      <div className={cardClass}>
        <h2 className="mb-2 card-title">Data & privacy</h2>
        <p className="text-sm leading-relaxed text-slate-400">
          Your data is private to your account. It isn't sold or used for ads, and FitLog has no trackers.
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
