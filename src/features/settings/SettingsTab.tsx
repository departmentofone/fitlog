import { useAuth } from '../../hooks/useAuth'
import { useUpdateSettings, useUserSettings } from '../../hooks/useUserSettings'
import { supabase } from '../../lib/supabase'

export function SettingsTab({ onBack }: { onBack: () => void }) {
  const { user } = useAuth()
  const { data: settings } = useUserSettings()
  const updateSettings = useUpdateSettings()

  return (
    <div className="space-y-4 p-4">
      <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-200">
        ← Back
      </button>

      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-medium text-white">Ask about preworkout</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              When on, you'll be asked once a day when starting a workout. Turn off if you don't use preworkout.
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings?.ask_preworkout ?? true}
            onChange={(e) => updateSettings.mutate({ ask_preworkout: e.target.checked })}
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
