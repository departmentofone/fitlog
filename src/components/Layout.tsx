import { useEffect, useState, type ReactNode } from 'react'
import { useBackToClose } from '../hooks/useHashRoute'
import { useUserSettings } from '../hooks/useUserSettings'
import { formatBuildTime } from '../lib/buildInfo'
import type { Tab, UserSettings } from '../types'
import { OfflineBanner } from './OfflineBanner'
import { SearchOverlay } from './SearchOverlay'
import { TabIcon } from './TabIcon'

export type { Tab }

type TabGroup = 'track' | 'progress' | 'tools'

const GROUP_LABELS: Record<TabGroup, string> = {
  track: 'Track',
  progress: 'Progress',
  tools: 'Tools',
}
const GROUP_ORDER: TabGroup[] = ['track', 'progress', 'tools']

const TABS: { key: Tab; label: string; group: TabGroup | null }[] = [
  { key: 'workouts', label: 'Workouts', group: 'track' },
  { key: 'meals', label: 'Meals', group: 'track' },
  { key: 'scanner', label: 'Scanner', group: 'track' },
  { key: 'diet', label: 'Diet', group: 'track' },
  { key: 'fasting', label: 'Fasting', group: 'track' },
  { key: 'goals', label: 'Goals', group: 'progress' },
  { key: 'history', label: 'History', group: 'progress' },
  { key: 'achievements', label: 'Achievements', group: 'progress' },
  { key: 'programs', label: 'Programs', group: 'tools' },
  { key: 'calculator', label: 'Calculator', group: 'tools' },
  { key: 'whatsnew', label: "What's new", group: null },
  { key: 'about', label: 'About', group: null },
]

const SHORT_LABELS: Partial<Record<Tab, string>> = { achievements: 'Awards' }
const PINNED_TABS: Tab[] = ['workouts', 'meals']
// About and What's new live permanently at the bottom of the More sheet - neither is a candidate
// for the bottom nav bar, or part of the regular grouped destination grid.
const FOOTER_TABS: Tab[] = ['whatsnew', 'about']
const MENU_TABS = TABS.filter((t) => !FOOTER_TABS.includes(t.key))
// Achievements and History are look-back/celebration screens, not something worth a one-tap
// slot - excluded from bottom-bar customization (still reachable from More as usual).
const EXCLUDED_FROM_BOTTOM_NAV: Tab[] = ['achievements', 'history']
export const BOTTOM_NAV_CHOICES = MENU_TABS.filter(
  (t) => !PINNED_TABS.includes(t.key) && !EXCLUDED_FROM_BOTTOM_NAV.includes(t.key),
)
export const MAX_BOTTOM_NAV_EXTRAS = 2

/**
 * The user's extra bottom-bar tabs, cleaned up: known choices only, no duplicates, capped. Used by
 * both the bar and the Settings picker so a stale/invalid stored entry can never fill a slot.
 */
export function resolveBottomNavExtras(settings: Pick<UserSettings, 'bottom_nav_tabs'> | undefined): Tab[] {
  const validExtraKeys = new Set(BOTTOM_NAV_CHOICES.map((t) => t.key))
  return Array.from(new Set(settings?.bottom_nav_tabs ?? []))
    .filter((t) => validExtraKeys.has(t))
    .slice(0, MAX_BOTTOM_NAV_EXTRAS)
}

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
              className="flex min-h-11 items-center gap-2.5 rounded-full border border-white/10 bg-slate-950/90 py-2 pl-3.5 pr-4 text-sm font-medium text-white shadow-lg shadow-black/30 backdrop-blur-xl"
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
        className={`pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-black/40 transition ${
          open ? 'rotate-45 bg-slate-700 text-white' : 'bg-emerald-600 text-on-accent'
        }`}
      >
        <PlusIcon />
      </button>
    </div>
  )
}

function MoreSheet({ active, onPick, onClose }: { active: Tab | null; onPick: (tab: Tab) => void; onClose: () => void }) {
  useBackToClose(true, onClose)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="fade-in absolute inset-0 bg-black/60" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="All sections"
        onClick={(e) => e.stopPropagation()}
        className="sheet-up relative max-h-[85%] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-slate-950 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-700" />
        <div className="space-y-4">
          {GROUP_ORDER.map((group) => (
            <div key={group}>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {GROUP_LABELS[group]}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {MENU_TABS.filter((t) => t.group === group).map((tab) => {
                  const isActive = active === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => onPick(tab.key)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3 text-xs font-semibold transition ${
                        isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-900 text-slate-300'
                      }`}
                    >
                      <TabIcon tab={tab.key} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2 border-t border-white/10 pt-3">
          {FOOTER_TABS.map((key) => {
            const tab = TABS.find((t) => t.key === key)!
            const isActive = active === key
            return (
              <button
                key={key}
                onClick={() => onPick(key)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition ${
                  isActive ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-300'
                }`}
              >
                <TabIcon tab={key} className="h-5 w-5" />
                {tab.label}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">Build {formatBuildTime()}</p>
      </div>
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
  active: Tab | null
  onChange: (tab: Tab) => void
  onOpenSettings: () => void
  quickAddActions?: QuickAddAction[]
  children: ReactNode
}) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { data: settings } = useUserSettings()

  const bottomBarTabs = [...PINNED_TABS, ...resolveBottomNavExtras(settings)]
    .map((key) => TABS.find((t) => t.key === key))
    .filter((t): t is (typeof TABS)[number] => !!t)
  // "More" reads as selected whenever the current screen is one that only lives in the More sheet.
  const moreIsActive = active != null && !bottomBarTabs.some((t) => t.key === active)

  return (
    <div className="relative flex h-[var(--app-height)] flex-col overflow-hidden overscroll-none bg-slate-950">
      {/* Ambient glow blobs - fixed behind the whole app. They're already heavily blurred, so the
          translucent cards over them read as frosted glass without paying for a backdrop-filter on
          every card (reserved for the header, nav, and floating layers). */}
      <div className="aurora-a pointer-events-none fixed -left-16 -top-16 z-0 h-64 w-64 rounded-full bg-emerald-400/40 blur-[90px]" />
      <div className="aurora-b pointer-events-none fixed -bottom-24 -right-16 z-0 h-64 w-64 rounded-full bg-amber-400/25 blur-[90px]" />
      {/* Third glow for light mode's aurora only (hidden in dark - see index.css). */}
      <div className="aurora-c pointer-events-none fixed z-0 hidden rounded-full" />

      <header className="relative z-10 flex items-center justify-between gap-2 border-b border-white/10 bg-slate-950/40 py-1.5 pl-4 pr-2 pt-[max(0.375rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <LogoMark />
          <h1 className="text-lg font-semibold tracking-tight text-white">FitLog</h1>
        </div>

        <div className="flex items-center">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition active:bg-white/10"
          >
            <SearchIcon />
          </button>
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition active:bg-white/10"
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      <div className="relative z-10">
        <OfflineBanner />
      </div>

      {/* Bottom padding lets the last card scroll clear of the floating quick-add button.
          No z-index here on purpose: a z-index would make <main> its own stacking context, trapping
          every full-screen sheet/modal a screen renders (z-50) underneath the bottom nav. Being
          later in the DOM than the glow blobs already paints it above them. */}
      <main className="relative flex-1 overflow-y-auto overscroll-none pb-20">{children}</main>

      {quickAddActions && quickAddActions.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20">
          <QuickAddFab actions={quickAddActions} />
        </div>
      )}

      <nav
        aria-label="Main"
        className="relative z-10 flex shrink-0 gap-1 border-t border-white/10 bg-slate-950/60 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-xl"
      >
        {bottomBarTabs.map((tab) => {
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              aria-current={isActive ? 'page' : undefined}
              className={`my-1 flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-semibold transition ${
                isActive ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-500'
              }`}
            >
              <TabIcon tab={tab.key} />
              <span className="max-w-full truncate">{SHORT_LABELS[tab.key] ?? tab.label}</span>
            </button>
          )
        })}
        <button
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          className={`my-1 flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-semibold transition ${
            moreIsActive ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-500'
          }`}
        >
          <TabIcon tab="more" />
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <MoreSheet
          active={active}
          onClose={() => setMoreOpen(false)}
          onPick={(tab) => {
            onChange(tab)
            setMoreOpen(false)
          }}
        />
      )}

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </div>
  )
}
