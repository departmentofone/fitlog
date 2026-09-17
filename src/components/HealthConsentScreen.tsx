import { useState } from 'react'
import { useUpdateSettings } from '../hooks/useUserSettings'
import { supabase } from '../lib/supabase'

const ITEMS = [
  'Workouts, sets, weights, and effort ratings',
  'Meals, nutrition, water, alcohol, and fasting',
  'Body weight, measurements, age, sex, and height',
  'Progress and meal photos, if you add them',
]

/**
 * One-time prominent disclosure + consent for health & fitness data (Google Play User Data policy,
 * and explicit consent for health data under GDPR/Serbian law). Shown after sign-in until agreed;
 * the agreement time is saved to user_settings.health_data_consent_at.
 */
export function HealthConsentScreen() {
  const updateSettings = useUpdateSettings()
  const [declining, setDeclining] = useState(false)

  return (
    <div className="flex h-[var(--app-height)] items-center justify-center overflow-y-auto overscroll-none bg-slate-950 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        className="w-full max-w-sm rounded-3xl border-t border-white/10 bg-slate-900 p-6 shadow-xl shadow-[var(--glow-shadow)]"
      >
        <h1 id="consent-title" className="text-xl font-semibold text-white">
          Your health and fitness data
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          To work, FitLog stores the health and fitness information you log in your private account:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {ITEMS.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          It's used only to run the app's features. It's never sold, never used for ads, and visible only to you
          unless you share something. You can export or delete everything at any time in Settings.
        </p>
        <a
          href="/privacy"
          target="_blank"
          rel="noopener"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-400"
        >
          Read the privacy policy
        </a>

        <button
          type="button"
          disabled={updateSettings.isPending || declining}
          onClick={() => updateSettings.mutate({ health_data_consent_at: new Date().toISOString() })}
          className="mt-3 min-h-12 w-full rounded-xl bg-emerald-600 font-semibold text-on-accent transition hover:brightness-90 disabled:opacity-50"
        >
          {updateSettings.isPending ? 'Saving…' : 'Agree and continue'}
        </button>
        <button
          type="button"
          disabled={updateSettings.isPending || declining}
          onClick={async () => {
            setDeclining(true)
            await supabase.auth.signOut()
          }}
          className="mt-2 min-h-11 w-full rounded-xl text-sm font-medium text-slate-400 disabled:opacity-50"
        >
          Don't agree and sign out
        </button>
      </div>
    </div>
  )
}
