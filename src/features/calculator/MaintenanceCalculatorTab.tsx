import { useState, type ReactNode } from 'react'
import { MaintenanceCalculator } from './MaintenanceCalculator'
import { PlateCalculator } from './PlateCalculator'

type CalculatorMode = 'maintenance' | 'plates'

const STORAGE_KEY = 'calculatorMode'

/**
 * Two calculators behind one tab. They used to be picked with two tiny text-xs buttons that read
 * more like a label than a choice, so the plate calculator was easy to miss entirely - each one is
 * now a full tile that says what it does.
 */
const MODES: { value: CalculatorMode; title: string; description: string; icon: ReactNode }[] = [
  {
    value: 'maintenance',
    title: 'Calories',
    description: 'Daily calories to cut, maintain or bulk',
    icon: (
      <>
        <path d="M12 3c2.5 3 4.5 5.6 4.5 9a4.5 4.5 0 0 1-9 0c0-1.6.6-3 1.6-4.3.3 1.3 1 2.1 1.9 2.4C11 7.6 11 5.5 12 3z" />
        <path d="M5 21h14" />
      </>
    ),
  },
  {
    value: 'plates',
    title: 'Plates',
    description: 'Which plates to load on the bar',
    icon: (
      <>
        <path d="M2 12h20" />
        <rect x="5" y="6" width="3" height="12" rx="1" />
        <rect x="16" y="6" width="3" height="12" rx="1" />
        <rect x="8.5" y="8" width="2" height="8" rx="0.5" />
        <rect x="13.5" y="8" width="2" height="8" rx="0.5" />
      </>
    ),
  },
]

function initialMode(): CalculatorMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'plates' ? 'plates' : 'maintenance'
  } catch {
    return 'maintenance'
  }
}

export function MaintenanceCalculatorTab() {
  const [mode, setMode] = useState<CalculatorMode>(initialMode)

  function choose(next: CalculatorMode) {
    setMode(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage blocked (private mode) - the choice just isn't remembered next time.
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div role="tablist" aria-label="Calculator" className="grid grid-cols-2 gap-2.5">
        {MODES.map((m) => {
          const active = mode === m.value
          return (
            <button
              key={m.value}
              role="tab"
              aria-selected={active}
              onClick={() => choose(m.value)}
              className={`flex min-h-24 flex-col items-start gap-2 rounded-2xl p-3.5 text-left ring-1 transition ${
                active ? 'bg-emerald-500/15 ring-emerald-500/50' : 'bg-slate-900 ring-white/5'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  active ? 'bg-emerald-600 text-on-accent' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {m.icon}
                </svg>
              </span>
              <span>
                <span className={`block text-sm font-semibold ${active ? 'text-emerald-400' : 'text-white'}`}>{m.title}</span>
                <span className="block text-xs leading-snug text-slate-400">{m.description}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div role="tabpanel">{mode === 'maintenance' ? <MaintenanceCalculator /> : <PlateCalculator />}</div>
    </div>
  )
}
