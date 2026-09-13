import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'

export type Tab = 'workouts' | 'meals' | 'history'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'workouts', label: 'Workouts', icon: '🏋️' },
  { key: 'meals', label: 'Meals', icon: '🍽️' },
  { key: 'history', label: 'History', icon: '📈' },
]

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
    <div className="flex min-h-svh flex-col bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h1 className="text-lg font-semibold text-white">FitLog</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          Sign out
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
                active === tab.key ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
