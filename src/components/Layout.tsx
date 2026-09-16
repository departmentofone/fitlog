import { useState, type ReactNode } from 'react'
import { useUserSettings } from '../hooks/useUserSettings'
import { formatBuildTime } from '../lib/buildInfo'
import type { Tab } from '../types'
import { OfflineBanner } from './OfflineBanner'
import { SearchOverlay } from './SearchOverlay'

export type { Tab }

type TabGroup = 'track' | 'progress' | 'tools'

const GROUP_LABELS: Record<TabGroup, string> = {
  track: 'Track',
  progress: 'Progress',
  tools: 'Tools',
}
const GROUP_ORDER: TabGroup[] = ['track', 'progress', 'tools']

const TABS: { key: Tab; label: string; icon: string; group: TabGroup | null }[] = [
  { key: 'workouts', label: 'Workouts', icon: '🏋️', group: 'track' },
  { key: 'meals', label: 'Meals', icon: '🍽️', group: 'track' },
  { key: 'scanner', label: 'Scanner', icon: '📷', group: 'track' },
  { key: 'diet', label: 'Diet', icon: '🥗', group: 'track' },
  { key: 'fasting', label: 'Fasting', icon: '⏱️', group: 'track' },
  { key: 'goals', label: 'Goals', icon: '🎯', group: 'progress' },
  { key: 'history', label: 'History', icon: '📅', group: 'progress' },
  { key: 'achievements', label: 'Achievements', icon: '🏆', group: 'progress' },
  { key: 'programs', label: 'Programs', icon: '🗂️', group: 'tools' },
  { key: 'calculator', label: 'Calculator', icon: '🧮', group: 'tools' },
  { key: 'about', label: 'About', icon: 'ℹ️', group: null },
]

const SHORT_LABELS: Partial<Record<Tab, string>> = { achievements: 'Awards' }
const PINNED_TABS: Tab[] = ['workouts', 'meals']
// About lives permanently at the bottom of the menu (see below) - it's not a candidate for
// the bottom nav bar, and not part of the regular grouped tab list either.
const MENU_TABS = TABS.filter((t) => t.key !== 'about')
const ABOUT_TAB = TABS.find((t) => t.key === 'about')!
// Achievements and History are look-back/celebration screens, not something worth a one-tap
// slot - excluded from bottom-bar customization (still reachable from the menu as usual).
const EXCLUDED_FROM_BOTTOM_NAV: Tab[] = ['achievements', 'history']
export const BOTTOM_NAV_CHOICES = MENU_TABS.filter(
  (t) => !PINNED_TABS.includes(t.key) && !EXCLUDED_FROM_BOTTOM_NAV.includes(t.key),
)
export const MAX_BOTTOM_NAV_EXTRAS = 2

export interface QuickAddAction {
  key: string
  label: string
  icon: ReactNode
  onSelect: () => void
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function LogoMark() {
  return (
    <svg viewBox="0 0 512 512" className="h-8 w-8 shrink-0" aria-hidden="true">
      <rect width="512" height="512" rx="160" fill="#0b0f1e" />
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

function QuickAddFab({ actions }: { actions: QuickAddAction[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2">
      {open && (
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {actions.map((action) => (
            <button
              key={action.key}
              onClick={() => {
                action.onSelect()
                setOpen(false)
              }}
              className="flex items-center gap-2.5 rounded-full bg-slate-900 backdrop-blur-xl border border-white/10 py-2 pl-3.5 pr-4 text-sm font-medium text-white shadow-lg shadow-black/30"
            >
              <span className="flex h-6 w-6 items-center justify-center text-emerald-400">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close quick actions' : 'Quick add'}
        aria-expanded={open}
        className={`pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg shadow-black/40 transition ${
          open ? 'rotate-45 bg-slate-700' : 'bg-emerald-600'
        }`}
      >
        <PlusIcon />
      </button>
    </div>
  )
}

export function Layout({
  active,
  onChange,
  onOpenSettings,
  quickAddActions,
  children,
}: {
  active: Tab
  onChange: (tab: Tab) => void
  onOpenSettings: () => void
  quickAddActions?: QuickAddAction[]
  children: ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { data: settings } = useUserSettings()

  const validExtraKeys = new Set(BOTTOM_NAV_CHOICES.map((t) => t.key))
  const extras = (settings?.bottom_nav_tabs ?? [])
    .filter((t) => !PINNED_TABS.includes(t) && validExtraKeys.has(t))
    .slice(0, MAX_BOTTOM_NAV_EXTRAS)
  const bottomBarTabs = [...PINNED_TABS, ...extras]
    .map((key) => TABS.find((t) => t.key === key))
    .filter((t): t is (typeof TABS)[number] => !!t)

  return (
    <div className="relative flex h-[var(--app-height)] flex-col overflow-hidden overscroll-none bg-slate-950">
      {/* Ambient glow blobs - fixed behind the whole app so scrolling glass cards (backdrop-blur)
          pick up a soft frosted color from whatever's behind them, instead of a flat void. */}
      <div className="pointer-events-none fixed -left-16 -top-16 z-0 h-64 w-64 rounded-full bg-emerald-400/40 blur-[90px]" />
      <div className="pointer-events-none fixed -bottom-24 -right-16 z-0 h-64 w-64 rounded-full bg-amber-400/25 blur-[90px]" />

      <header className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-white/10 bg-slate-950/40 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
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

        <div className="col-start-3 flex items-center gap-1 justify-self-end">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
          >
            <SearchIcon />
          </button>
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      <div className="relative z-10">
        <OfflineBanner />
      </div>

      <main className="relative z-10 flex-1 overflow-y-auto overscroll-none">{children}</main>

      {quickAddActions && quickAddActions.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20">
          <QuickAddFab actions={quickAddActions} />
        </div>
      )}

      <nav className="relative z-10 flex shrink-0 gap-1 border-t border-white/10 bg-slate-950/60 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-xl">
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
            className="relative flex h-full w-72 max-w-[80vw] flex-col border-r border-white/10 bg-slate-950/85 pt-[env(safe-area-inset-top)] shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-4">
              <LogoMark />
              <h2 className="text-lg font-semibold text-white">FitLog</h2>
            </div>
            <nav className="flex-1 space-y-4 overflow-y-auto p-3">
              {GROUP_ORDER.map((group) => (
                <div key={group}>
                  <p className="mb-1.5 px-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {GROUP_LABELS[group]}
                  </p>
                  <div className="space-y-1.5">
                    {MENU_TABS.filter((t) => t.group === group).map((tab) => {
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
                  </div>
                </div>
              ))}
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

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </div>
  )
}
