import { useState, type ReactNode } from 'react'
import { useUserSettings } from '../hooks/useUserSettings'
import { formatBuildTime } from '../lib/buildInfo'
import type { Tab } from '../types'
import { OfflineBanner } from './OfflineBanner'

export type { Tab }

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'workouts', label: 'Workouts', icon: '🏋️' },
  { key: 'meals', label: 'Meals', icon: '🍽️' },
  { key: 'diet', label: 'Diet', icon: '🥗' },
  { key: 'goals', label: 'Goals', icon: '🎯' },
  { key: 'achievements', label: 'Achievements', icon: '🏆' },
  { key: 'programs', label: 'Programs', icon: '🗂️' },
  { key: 'misc', label: 'Miscellaneous', icon: '🧩' },
]

const SHORT_LABELS: Partial<Record<Tab, string>> = { misc: 'Misc', achievements: 'Awards' }
const PINNED_TABS: Tab[] = ['workouts', 'meals']
export const BOTTOM_NAV_CHOICES = TABS.filter((t) => !PINNED_TABS.includes(t.key))
export const MAX_BOTTOM_NAV_EXTRAS = 2

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
  const { data: settings } = useUserSettings()

  const extras = (settings?.bottom_nav_tabs ?? []).filter((t) => !PINNED_TABS.includes(t)).slice(0, MAX_BOTTOM_NAV_EXTRAS)
  const bottomBarTabs = [...PINNED_TABS, ...extras]
    .map((key) => TABS.find((t) => t.key === key))
    .filter((t): t is (typeof TABS)[number] => !!t)

  return (
    <div className="flex h-[var(--app-height)] flex-col overflow-hidden overscroll-none bg-gradient-to-b from-slate-950 to-slate-900">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-white/5 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Menu"
          className="flex h-8 w-fit items-center gap-1.5 justify-self-start rounded-full pl-1 pr-2.5 text-slate-300 transition hover:bg-white/5"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
          <span className="text-xs font-medium">Menu</span>
        </button>

        <div className="col-start-2 flex items-center gap-2 justify-self-center">
          <LogoMark />
          <h1 className="text-lg font-semibold tracking-tight text-white">FitLog</h1>
        </div>

        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="col-start-3 flex h-8 w-8 items-center justify-center justify-self-end rounded-full text-lg text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
        >
          ⚙️
        </button>
      </header>

      <OfflineBanner />

      <main className="flex-1 overflow-y-auto overscroll-none">{children}</main>

      <nav className="flex shrink-0 border-t border-white/5 bg-slate-950/80 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {bottomBarTabs.map((tab) => {
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
                isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {SHORT_LABELS[tab.key] ?? tab.label}
            </button>
          )
        })}
      </nav>

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
            <p className="border-t border-white/5 px-3 py-2 text-center text-[10px] text-slate-600">
              Build {formatBuildTime()}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
