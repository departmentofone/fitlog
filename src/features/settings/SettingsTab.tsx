import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useSetPreworkout, useTodaySession } from '../../hooks/useWorkouts'

export function SettingsTab() {
  const { user } = useAuth()
  const { data: session } = useTodaySession()
  const setPreworkout = useSetPreworkout()

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-medium text-white">Preworkout taken today</h3>
            <p className="mt-0.5 text-xs text-slate-500">Flip this whenever you take it — applies to today's log.</p>
          </div>
          <input
            type="checkbox"
            checked={session?.preworkout ?? false}
            onChange={(e) =>
              setPreworkout.mutate({ sessionId: session?.id ?? null, preworkout: e.target.checked })
            }
            className="h-6 w-6 shrink-0 accent-emerald-500"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <p className="mb-1 text-xs text-slate-500">Signed in as</p>
        <p className="mb-4 truncate text-sm text-white">{user?.email}</p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full rounded-lg bg-slate-800 py-2.5 font-medium text-slate-200 transition hover:bg-red-600/80 hover:text-white"
        >
          Sign out
        </button>
      </div>

      <p className="px-1 text-center text-xs text-slate-600">FitLog</p>
    </div>
  )
}
