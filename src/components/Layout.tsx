import { useState, type ReactNode } from 'react'
import { useUserSettings } from '../hooks/useUserSettings'
import { formatBuildTime } from '../lib/buildInfo'
import type { Tab } from '../types'
import { OfflineBanner } from './OfflineBanner'

export type { Tab }

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'workouts', label: 'Workouts', icon: '🏋️' },
  { key: 'meals', label: 'Meals', icon: '🍽️' },
  { key: 'scanner', label: 'Scanner', icon: '📷' },
  { key: 'diet', label: 'Diet', icon: '🥗' },
  { key: 'fasting', label: 'Fasting', icon: '⏱️' },
  { key: 'goals', label: 'Goals', icon: '🎯' },
  { key: 'achievements', label: 'Achievements', icon: '🏆' },
  { key: 'programs', label: 'Programs', icon: '🗂️' },
  { key: 'about', label: 'About', icon: 'ℹ️' },
]

const SHORT_LABELS: Partial<Record<Tab, string>> = { achievements: 'Awards' }
const PINNED_TABS: Tab[] = ['workouts', 'meals']
// About lives permanently at the bottom of the menu (see below) - it's not a candidate for
// the bottom nav bar, and not part of the regular scrollable tab list either.
const MENU_TABS = TABS.filter((t) => t.key !== 'about')
const ABOUT_TAB = TABS.find((t) => t.key === 'about')!
export const BOTTOM_NAV_CHOICES = MENU_TABS.filter((t) => !PINNED_TABS.includes(t.key))
export const MAX_BOTTOM_NAV_EXTRAS = 2

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function LogoMark() {
  return (
    <svg viewBox="0 0 512 512" className="h-8 w-8 shrink-0" aria-hidden="true">
      <rect width="512" height="512" rx="160" fill="#111113" />
      <g stroke="#30d158" strokeWidth="34" strokeLinecap="round">
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
    <div className="flex h-[var(--app-height)] flex-col overflow-hidden overscroll-none bg-slate-950">
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
          className="col-start-3 flex h-8 w-8 items-center justify-center justify-self-end rounded-full text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
        >
          <SettingsIcon />
        </button>
      </header>

      <OfflineBanner />

      <main className="flex-1 overflow-y-auto overscroll-none">{children}</main>

      <nav className="flex shrink-0 gap-1 border-t border-white/10 bg-slate-950/80 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur">
        {bottomBarTabs.map((tab) => {
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`my-1 flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-semibold transition ${
                isActive ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
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
            <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
              {MENU_TABS.map((tab) => {
                const isActive = active === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      onChange(tab.key)
                      setMenuOpen(false)
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-semibold transition ${
                      isActive ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    {tab.label}
                  </button>
                )
              })}
            </nav>

            <div className="shrink-0 border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                onClick={() => {
                  onChange('about')
                  setMenuOpen(false)
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-semibold transition ${
                  active === 'about' ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <span className="text-xl">{ABOUT_TAB.icon}</span>
                {ABOUT_TAB.label}
              </button>
              <p className="mt-2 text-center text-[10px] text-slate-600">Build {formatBuildTime()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
