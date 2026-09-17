import { useState, type ReactNode } from 'react'

const STORAGE_KEY = 'fitlog-onboarded'

function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    // Storage unavailable (private browsing, blocked, etc.) — fail safe by not showing the tour.
    return true
  }
}

function markTourSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Ignore — if we can't persist it, the tour may reappear next load, which is acceptable.
  }
}

type Slide = {
  title: string
  body: ReactNode
  emphasize?: boolean
}

const SLIDES: Slide[] = [
  {
    title: 'Welcome to FitLog',
    body: (
      <p className="text-sm text-slate-300">
        FitLog is your all-in-one workout and meal/macro tracker — log your training and your food in one place, and see
        how they connect.
      </p>
    ),
  },
  {
    title: 'Getting around',
    body: (
      <div className="space-y-3 text-sm text-slate-300">
        <p>
          The <span className="font-semibold text-white">bottom bar</span> keeps your most-used sections one tap away —{' '}
          <span className="font-semibold text-white">Workouts</span> and <span className="font-semibold text-white">Meals</span>{' '}
          are always there.
        </p>
        <p>
          <span className="font-semibold text-white">More</span> (bottom-right) opens every other section: Scanner, Diet,
          Fasting, Goals, History, Achievements, Programs, and the Calculator.
        </p>
        <p>
          The <span className="font-semibold text-white">+</span> button logs a set, a meal, or starts a fast from anywhere.
        </p>
      </div>
    ),
  },
  {
    title: 'Make the bottom bar yours',
    emphasize: true,
    body: (
      <div className="space-y-3 text-sm text-slate-200">
        <p>
          The bottom bar has <span className="font-semibold text-emerald-400">2 open slots</span> — fill them with
          whichever sections you use most.
        </p>
        <p>
          Open <span className="font-semibold text-white">Settings</span> (the gear, top-right) and choose them under{' '}
          <span className="font-semibold text-white">&ldquo;Bottom bar&rdquo;</span>.
        </p>
      </div>
    ),
  },
  {
    title: "You're all set",
    body: (
      <p className="text-sm text-slate-300">
        Tip: the system back gesture works everywhere — it steps back through screens and closes sheets.
      </p>
    ),
  },
]

export function OnboardingTour() {
  const [dismissed, setDismissed] = useState(() => hasSeenTour())
  const [step, setStep] = useState(0)

  if (dismissed) return null

  const isLast = step === SLIDES.length - 1
  const slide = SLIDES[step]

  const finish = () => {
    markTourSeen()
    setDismissed(true)
  }

  const next = () => {
    if (isLast) {
      finish()
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" />
      <div
        className={`relative w-full max-w-sm rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-5 shadow-2xl shadow-black/40 ring-1 transition ${
          slide.emphasize
            ? 'shadow-[var(--glow-shadow)] ring-2 ring-emerald-500 bg-gradient-to-b from-emerald-500/10 to-slate-900'
            : 'ring-white/5'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-5 rounded-full transition ${i === step ? 'bg-emerald-500' : 'bg-slate-700'}`}
              />
            ))}
          </div>
          <button
            onClick={finish}
            className="-my-3 -mr-3 min-h-11 px-3 text-xs font-medium text-slate-400"
          >
            Skip
          </button>
        </div>

        <h2 className="mb-2 text-lg font-semibold text-white">{slide.title}</h2>
        <div className="mb-6">{slide.body}</div>

        <button
          onClick={next}
          className="w-full rounded-2xl bg-emerald-600 py-2.5 text-sm font-semibold text-on-accent transition hover:brightness-90"
        >
          {isLast ? "Let's go" : step === SLIDES.length - 2 ? 'Got it' : 'Next'}
        </button>
      </div>
    </div>
  )
}
