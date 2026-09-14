import { useState, type ReactNode } from 'react'

export type Tab = 'workouts' | 'meals' | 'diet' | 'goals' | 'misc'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'workouts', label: 'Workouts', icon: '🏋️' },
  { key: 'meals', label: 'Meals', icon: '🍽️' },
  { key: 'diet', label: 'Diet', icon: '🥗' },
  { key: 'goals', label: 'Goals', icon: '🎯' },
  { key: 'misc', label: 'Miscellaneous', icon: '🧩' },
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
  onOpenSettings,
  children,
}: {
  active: Tab
  onChange: (tab: Tab) => void
  onOpenSettings: () => void
  children: ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">
      <header className="flex items-center justify-between gap-2 border-b border-white/5 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Menu"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/5"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <LogoMark />
          <h1 className="text-lg font-semibold tracking-tight text-white">FitLog</h1>
        </div>

        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
        >
          ⚙️
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">{children}</main>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-full w-72 max-w-[80vw] flex-col bg-slate-950 pt-[env(safe-area-inset-top)] shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-4">
              <LogoMark />
              <h2 className="text-lg font-semibold text-white">FitLog</h2>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {TABS.map((tab) => {
                const isActive = active === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      onChange(tab.key)
                      setMenuOpen(false)
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                      isActive ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}
