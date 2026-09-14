import { useState } from 'react'
import { BOTTOM_NAV_CHOICES, MAX_BOTTOM_NAV_EXTRAS } from '../../components/Layout'
import { useAuth } from '../../hooks/useAuth'
import { useUpdateSettings, useUserSettings } from '../../hooks/useUserSettings'
import { exportUserData } from '../../lib/exportData'
import { supabase } from '../../lib/supabase'
import type { Tab } from '../../types'

export function SettingsTab({ onBack }: { onBack: () => void }) {
  const { user } = useAuth()
  const { data: settings } = useUserSettings()
  const updateSettings = useUpdateSettings()

  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  async function handleChangePassword() {
    setPasswordMessage(null)
    if (newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords don't match.")
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordMessage(error.message)
    } else {
      setPasswordMessage('Password updated.')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setChangingPassword(false), 1200)
    }
  }

  async function handleExport() {
    if (!user) return
    setExporting(true)
    try {
      await exportUserData(user.id)
    } finally {
      setExporting(false)
    }
  }

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
        <h3 className="mb-2 font-medium text-white">Appearance</h3>
        <p className="mb-1.5 text-xs text-slate-500">Theme</p>
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {(['system', 'light', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => updateSettings.mutate({ theme: t })}
              className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition ${
                (settings?.theme ?? 'system') === t ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="mb-1.5 text-xs text-slate-500">Color palette</p>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { value: 'emerald', label: 'Emerald', dot: '#34d399' },
            { value: 'violet', label: 'Violet', dot: '#a78bfa' },
            { value: 'cyan', label: 'Cyan', dot: '#22d3ee' },
            { value: 'rose', label: 'Rose', dot: '#fb7185' },
            { value: 'amber', label: 'Amber', dot: '#fbbf24' },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => updateSettings.mutate({ color_palette: p.value })}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                (settings?.color_palette ?? 'emerald') === p.value
                  ? 'bg-slate-700 text-white ring-1 ring-white/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.dot }} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-1 font-medium text-white">Bottom bar</h3>
        <p className="mb-3 text-xs text-slate-500">
          Workouts and Meals are always there. Pick up to {MAX_BOTTOM_NAV_EXTRAS} more for one-tap access — everything else
          stays in the menu.
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {BOTTOM_NAV_CHOICES.map((choice) => {
            const extras = settings?.bottom_nav_tabs ?? []
            const isSelected = extras.includes(choice.key)
            const atMax = extras.length >= MAX_BOTTOM_NAV_EXTRAS
            return (
              <button
                key={choice.key}
                disabled={!isSelected && atMax}
                onClick={() => {
                  const next: Tab[] = isSelected ? extras.filter((t) => t !== choice.key) : [...extras, choice.key]
                  updateSettings.mutate({ bottom_nav_tabs: next })
                }}
                className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-xs font-medium transition disabled:opacity-30 ${
                  isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span className="text-base">{choice.icon}</span>
                {choice.key === 'misc' ? 'Misc' : choice.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <h3 className="mb-2 font-medium text-white">Units</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {(['metric', 'imperial'] as const).map((u) => (
            <button
              key={u}
              onClick={() => updateSettings.mutate({ unit_system: u })}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition capitalize ${
                (settings?.unit_system ?? 'metric') === u
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {u === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lb, in)'}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
        <p className="mb-1 text-xs text-slate-500">Signed in as</p>
        <p className="mb-4 truncate text-sm text-white">{user?.email}</p>

        {changingPassword ? (
          <div className="mb-3 space-y-2">
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            {passwordMessage && <p className="text-xs text-slate-400">{passwordMessage}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setChangingPassword(false)}
                className="flex-1 rounded-lg bg-slate-800 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Update
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setChangingPassword(true)}
            className="mb-2 w-full rounded-lg bg-slate-800 py-2.5 font-medium text-slate-200 transition hover:bg-slate-700"
          >
            Change password
          </button>
        )}

        <button
          onClick={handleExport}
          disabled={exporting}
          className="mb-2 w-full rounded-lg bg-slate-800 py-2.5 font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
        >
          {exporting ? 'Preparing export…' : 'Export my data'}
        </button>

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
