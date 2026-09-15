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
    title: 'Two ways to get around',
    body: (
      <div className="space-y-3 text-sm text-slate-300">
        <p>
          <span className="font-semibold text-white">☰ Menu</span> (top-left) — everything lives here: all 9 tabs,
          including Workouts, Meals, Scanner, Diet, Fasting, Goals, Achievements, Programs, and About.
        </p>
        <p>
          <span className="font-semibold text-white">Bottom bar</span> — <span className="font-semibold text-white">Workouts</span> and{' '}
          <span className="font-semibold text-white">Meals</span> are always pinned there, so your two most-used tabs
          are always one tap away.
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
          The bottom bar has <span className="font-semibold text-emerald-400">2 more open slots</span> beyond Workouts
          and Meals — pick whichever tabs you use most.
        </p>
        <p>
          Head to <span className="font-semibold text-white">Settings</span> (the{' '}
          <span className="font-semibold text-white">⚙️ icon</span>, top-right) and choose your extras under{' '}
          <span className="font-semibold text-white">&ldquo;Bottom bar&rdquo;</span>.
        </p>
      </div>
    ),
  },
  {
    title: 'A few newer additions',
    body: (
      <div className="space-y-3 text-sm text-slate-300">
        <p>
          Don&apos;t be surprised to find <span className="font-semibold text-white">Fasting</span> (track fasting
          windows), <span className="font-semibold text-white">Scanner</span> (scan food to log it fast), and{' '}
          <span className="font-semibold text-white">About</span> tucked in the Menu too.
        </p>
        <p className="text-slate-400">You&apos;re all set — go ahead and explore.</p>
      </div>
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
        className={`relative w-full max-w-sm rounded-2xl bg-slate-900 p-5 shadow-2xl shadow-black/40 ring-1 transition ${
          slide.emphasize ? 'ring-2 ring-emerald-500 bg-gradient-to-b from-emerald-500/10 to-slate-900' : 'ring-white/5'
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
            className="text-xs font-medium text-slate-500 transition hover:text-slate-300"
          >
            Skip
          </button>
        </div>

        <h2 className="mb-2 text-lg font-semibold text-white">{slide.title}</h2>
        <div className="mb-6">{slide.body}</div>

        <button
          onClick={next}
          className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          {isLast ? "Let's go" : step === SLIDES.length - 2 ? 'Got it' : 'Next'}
        </button>
      </div>
    </div>
  )
}
