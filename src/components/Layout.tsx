import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Route } from '../hooks/useHashRoute'
import { AREAS, areaOf, isDetailPage, titleOf, type Area } from '../lib/navigation'
import type { Tab } from '../types'
import { OfflineBanner } from './OfflineBanner'
import { SearchOverlay } from './SearchOverlay'
import { TabIcon } from './TabIcon'

export type { Tab }

export interface QuickAddAction {
  key: string
  label: string
  icon: ReactNode
  onSelect: () => void
}

const AREA_ICONS: Record<Area, Tab | 'progress'> = {
  train: 'workouts',
  eat: 'meals',
  progress: 'progress',
  community: 'community',
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

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
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

export function Layout({
  route,
  onNavigate,
  onBack,
  quickAddActions,
  children,
}: {
  route: Route
  onNavigate: (route: Route) => void
  onBack: () => void
  quickAddActions?: QuickAddAction[]
  children: ReactNode
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const area = areaOf(route)
  const detail = isDetailPage(route)
  const sections = !detail ? (AREAS.find((a) => a.key === area)?.sections ?? []) : []

  // The section last open in each area, so switching areas and back returns where you were.
  const lastSection = useRef<Partial<Record<Area, Tab>>>({})
  useEffect(() => {
    if (area && !detail) lastSection.current[area] = route as Tab
  }, [area, detail, route])

  function openArea(key: Area) {
    const first = AREAS.find((a) => a.key === key)!.sections[0].route
    // Tapping the area you're already in goes back to its first section.
    onNavigate(key === area && !detail ? first : (lastSection.current[key] ?? first))
  }

  return (
    <div className="relative flex h-[var(--app-height)] flex-col overflow-hidden overscroll-none bg-slate-950">
      {/* Ambient glow blobs - fixed behind the whole app. They're already heavily blurred, so the
          translucent cards over them read as frosted glass without paying for a backdrop-filter on
          every card (reserved for the header, nav, and floating layers). */}
      <div className="aurora-a pointer-events-none fixed -left-16 -top-16 z-0 h-64 w-64 rounded-full bg-emerald-400/40 blur-[90px]" />
      <div className="aurora-b pointer-events-none fixed -bottom-24 -right-16 z-0 h-64 w-64 rounded-full bg-amber-400/25 blur-[90px]" />
      {/* Third glow for light mode's aurora only (hidden in dark - see index.css). */}
      <div className="aurora-c pointer-events-none fixed z-0 hidden rounded-full" />

      <header className="relative z-10 border-b border-white/10 bg-slate-950/40 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className={`flex min-h-14 items-center justify-between gap-2 pr-2 ${detail ? 'pl-1' : 'pl-4'}`}>
          <div className="flex min-w-0 items-center">
            {detail && (
              <button
                onClick={onBack}
                aria-label="Back"
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-300 transition active:bg-white/10"
              >
                <BackIcon />
              </button>
            )}
            <h1 className={`truncate font-bold tracking-tight text-white ${detail ? 'text-lg' : 'text-2xl'}`}>{titleOf(route)}</h1>
          </div>

          <div className="flex shrink-0 items-center">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition active:bg-white/10"
            >
              <SearchIcon />
            </button>
            {route !== 'settings' && (
              <button
                onClick={() => onNavigate('settings')}
                aria-label="Settings"
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition active:bg-white/10"
              >
                <SettingsIcon />
              </button>
            )}
          </div>
        </div>

        {sections.length > 1 && (
          <nav
            aria-label="Sections"
            className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {sections.map((s) => {
              const isActive = s.route === route
              return (
                <button
                  key={s.route}
                  onClick={() => onNavigate(s.route)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`min-h-9 shrink-0 rounded-full px-3.5 text-sm font-semibold transition ${
                    isActive ? 'bg-white/10 text-white' : 'text-slate-400 active:bg-white/5'
                  }`}
                >
                  {s.label}
                </button>
              )
            })}
          </nav>
        )}
      </header>

      <div className="relative z-10">
        <OfflineBanner />
      </div>

      {/* Bottom padding lets the last card scroll clear of the floating quick-add button.
          No z-index here on purpose: a z-index would make <main> its own stacking context, trapping
          every full-screen sheet/modal a screen renders (z-50) underneath the bottom nav. Being
          later in the DOM than the glow blobs already paints it above them. */}
      <main className="relative flex-1 overflow-y-auto overscroll-none pb-24">{children}</main>

      {quickAddActions && quickAddActions.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20">
          <QuickAddFab actions={quickAddActions} />
        </div>
      )}

      <nav
        aria-label="Main"
        className="relative z-10 flex shrink-0 border-t border-white/10 bg-slate-950/60 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      >
        {AREAS.map((a) => {
          const isActive = area === a.key
          return (
            <button
              key={a.key}
              onClick={() => openArea(a.key)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                isActive ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <span
                className={`flex h-8 w-14 items-center justify-center rounded-full transition ${isActive ? 'bg-emerald-500/15' : ''}`}
              >
                <TabIcon tab={AREA_ICONS[a.key]} />
              </span>
              <span className="max-w-full truncate">{a.label}</span>
            </button>
          )
        })}
      </nav>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </div>
  )
}
