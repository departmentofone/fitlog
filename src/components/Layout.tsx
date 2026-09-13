import type { ReactNode } from 'react'

export type Tab = 'workouts' | 'meals' | 'progress' | 'settings'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'workouts', label: 'Workouts', icon: '🏋️' },
  { key: 'meals', label: 'Meals', icon: '🍽️' },
  { key: 'progress', label: 'Progress', icon: '🏆' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
]

function LogoMark() {
  return (
    <svg viewBox="0 0 512 512" className="h-7 w-7 shrink-0" aria-hidden="true">
      <rect width="512" height="512" rx="112" fill="#0f172a" />
      <g stroke="#34d399" strokeWidth="34" strokeLinecap="round">
        <line x1="96" y1="256" x2="416" y2="256" />
        <line x1="150" y1="176" x2="150" y2="336" />
        <line x1="362" y1="176" x2="362" y2="336" />
        <line x1="96" y1="208" x2="96" y2="304" />
        <line x1="416" y1="208" x2="416" y2="304" />
      </g>
    </svg>
  )
}

export function Layout({
  active,
  onChange,
  children,
}: {
  active: Tab
  onChange: (tab: Tab) => void
  children: ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-slate-950 to-slate-900">
      <header className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <LogoMark />
        <h1 className="text-lg font-semibold tracking-tight text-white">FitLog</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-white/5 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg px-2 py-1.5">
          {TABS.map((tab) => {
            const isActive = active === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => onChange(tab.key)}
                className={`mx-0.5 flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition ${
                  isActive ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
