import { useEffect, useState } from 'react'
import { ONBOARDING_REPLAY_EVENT, ONBOARDING_STORAGE_KEY } from '../lib/onboarding'
import type { Tab } from '../types'
import { TabIcon } from './TabIcon'

const STORAGE_KEY = ONBOARDING_STORAGE_KEY

function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    // Storage unavailable (private browsing, blocked, etc.) - fail safe by not showing the tour.
    return true
  }
}

function markTourSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // If it can't be saved, the tour may show again next time - acceptable.
  }
}

const STEPS = 3

const AREA_TOUR: { icon: Tab | 'progress'; label: string; text: string }[] = [
  { icon: 'workouts', label: 'Train', text: 'Log sets, run programs, look back at past workouts' },
  { icon: 'meals', label: 'Eat', text: 'Meals, your calorie goal, fasting and your food library' },
  { icon: 'progress', label: 'Progress', text: 'Weight, measurements, photos and awards' },
  { icon: 'community', label: 'Community', text: 'Diets, plans and workouts others shared' },
]

/**
 * First-run tour, kept to three short steps: what FitLog is, the four areas on the bottom bar,
 * and a nudge toward Community so new people know they
 * don't have to build every meal and workout from scratch.
 */
export function OnboardingTour({ onOpenCommunity }: { onOpenCommunity: () => void }) {
  const [dismissed, setDismissed] = useState(() => hasSeenTour())
  const [step, setStep] = useState(0)

  useEffect(() => {
    function reopen() {
      setStep(0)
      setDismissed(false)
    }
    window.addEventListener(ONBOARDING_REPLAY_EVENT, reopen)
    return () => window.removeEventListener(ONBOARDING_REPLAY_EVENT, reopen)
  }, [])

  if (dismissed) return null

  function finish() {
    markTourSeen()
    setDismissed(true)
  }

  function next() {
    if (step === STEPS - 1) return finish()
    setStep(step + 1)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <div className="fade-in absolute inset-0 bg-black/70" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="pop-in relative w-full max-w-sm rounded-3xl border-t border-white/10 bg-slate-900 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl shadow-black/40 ring-1 ring-white/5 backdrop-blur-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-1.5" aria-label={`Step ${step + 1} of ${STEPS}`}>
            {Array.from({ length: STEPS }, (_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-emerald-500' : 'w-1.5 bg-slate-700'}`} />
            ))}
          </div>
          <button onClick={finish} className="-my-3 -mr-3 min-h-11 px-3 text-xs font-medium text-slate-400">
            Skip
          </button>
        </div>

        {step === 0 && (
          <div>
            <div className="mb-4 flex gap-2">
              {(['workouts', 'meals', 'fasting'] as Tab[]).map((t) => (
                <span key={t} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                  <TabIcon tab={t} />
                </span>
              ))}
            </div>
            <h2 id="onboarding-title" className="text-xl font-semibold text-white">
              Welcome to FitLog
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Log your workouts, meals and fasts in one place. Everything is free - no ads, no paywalls.
            </p>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 id="onboarding-title" className="text-xl font-semibold text-white">
              Four places, everything in them
            </h2>
            <ul className="mt-4 space-y-3">
              {AREA_TOUR.map((a) => (
                <li key={a.label} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <TabIcon tab={a.icon} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="block font-semibold text-white">{a.label}</span>
                    <span className="block text-slate-400">{a.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-4 flex flex-wrap gap-1.5" aria-hidden="true">
              {['Mediterranean', 'Keto', 'DASH', 'Greek Yogurt Berry Bowl'].map((chip, i) => (
                <span key={chip} className={`rounded-full px-2.5 py-1 text-xs ${i === 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>
                  {chip}
                </span>
              ))}
            </div>
            <h2 id="onboarding-title" className="text-xl font-semibold text-white">
              You don't have to start from scratch
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Browse diets, meal plans and workouts in <span className="font-semibold text-white">Community</span> - official ones and
              ones other people shared. Save any of them in one tap.
            </p>
          </div>
        )}

        <div className="mt-6 space-y-2">
          <button onClick={next} className="min-h-12 w-full rounded-2xl bg-emerald-600 text-sm font-semibold text-on-accent">
            {step === 0 ? 'Get started' : step === 1 ? 'Continue' : 'Start logging'}
          </button>
          {step === 2 && (
            <button
              onClick={() => {
                finish()
                onOpenCommunity()
              }}
              className="min-h-11 w-full rounded-2xl text-sm font-medium text-emerald-400"
            >
              Take a look at Community
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
