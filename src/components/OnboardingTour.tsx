import { useState } from 'react'
import { useUpdateSettings, useUserSettings } from '../hooks/useUserSettings'
import type { Tab } from '../types'
import { BOTTOM_NAV_CHOICES, MAX_BOTTOM_NAV_EXTRAS, resolveBottomNavExtras } from './Layout'
import { TabIcon } from './TabIcon'

// v2: the three-step tour (welcome, pin sections, Community). Bumped from the old key so everyone
// sees it once, including people who went through the old navigation tour.
const STORAGE_KEY = 'fitlog-onboarded-v2'

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

function CheckIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="5 12.5 10 17 19 7.5" />
    </svg>
  )
}

/**
 * First-run tour, kept to three short steps: what FitLog is, pinning two sections to the bottom
 * bar (doing it beats reading about it), and a nudge toward Community so new people know they
 * don't have to build every meal and workout from scratch.
 */
export function OnboardingTour({ onOpenCommunity }: { onOpenCommunity: () => void }) {
  const [dismissed, setDismissed] = useState(() => hasSeenTour())
  const [step, setStep] = useState(0)
  const { data: settings } = useUserSettings()
  const updateSettings = useUpdateSettings()
  const initialPins = resolveBottomNavExtras(settings)
  const [pins, setPins] = useState<Tab[] | null>(null)
  const picked = pins ?? initialPins

  if (dismissed) return null

  function savePins() {
    // Only write if they actually changed something, so an existing custom bar isn't overwritten.
    if (pins && pins.join() !== initialPins.join()) updateSettings.mutate({ bottom_nav_tabs: pins })
  }

  function finish() {
    savePins()
    markTourSeen()
    setDismissed(true)
  }

  function next() {
    if (step === STEPS - 1) return finish()
    if (step === 1) savePins()
    setStep(step + 1)
  }

  function togglePin(tab: Tab) {
    setPins((cur) => {
      const list = cur ?? initialPins
      if (list.includes(tab)) return list.filter((t) => t !== tab)
      // At the limit, the newest pick replaces the oldest instead of doing nothing.
      return [...list, tab].slice(-MAX_BOTTOM_NAV_EXTRAS)
    })
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
              What else will you use a lot?
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Workouts and Meals are always on your bottom bar. Pin up to {MAX_BOTTOM_NAV_EXTRAS} more - you can change this anytime in
              Settings.
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {BOTTOM_NAV_CHOICES.map((t) => {
                const on = picked.includes(t.key)
                return (
                  <button
                    key={t.key}
                    onClick={() => togglePin(t.key)}
                    aria-pressed={on}
                    className={`relative flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold transition ${
                      on ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/50' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {on && (
                      <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-on-accent">
                        <CheckIcon className="h-2.5 w-2.5" />
                      </span>
                    )}
                    <TabIcon tab={t.key} className="h-5 w-5" />
                    <span className="max-w-full truncate">{t.label}</span>
                  </button>
                )
              })}
            </div>
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
            {step === 0 ? 'Get started' : step === 1 ? (picked.length > 0 ? 'Continue' : 'Skip for now') : 'Start logging'}
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
