import { useState } from 'react'
import { TabIcon } from '../../components/TabIcon'
import type { Route } from '../../hooks/useHashRoute'
import { Toggle } from '../../components/Toggle'
import { useAuth } from '../../hooks/useAuth'
import { useUpdateSettings, useUserSettings } from '../../hooks/useUserSettings'
import { formatBuildTime } from '../../lib/buildInfo'
import { exportUserData } from '../../lib/exportData'
import { replayOnboarding } from '../../lib/onboarding'
import { supabase } from '../../lib/supabase'
import { DeleteAccountCard } from './DeleteAccountCard'
import { PushNotificationsCard } from './PushNotificationsCard'

// About, What's new and Feedback (with Buy me a coffee) live here rather than on a main screen.
const FITLOG_LINKS = [
  { route: 'whatsnew', label: "What's new" },
  { route: 'feedback', label: 'Feedback & support' },
  { route: 'about', label: 'About FitLog' },
] as const

export function SettingsTab({ onOpen }: { onOpen: (route: Route) => void }) {
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
      {/* Settings are grouped into a few cards of short rows - it used to be one card per switch, each
          with a paragraph of explanation. */}
      <div className="divide-y divide-white/5 card px-4">
        <div className="flex items-center justify-between gap-4 py-3">
          <div>
            <h3 className="card-title">Ask about preworkout</h3>
            <p className="text-xs text-slate-500">Once a day, when you start a workout</p>
          </div>
          <Toggle
            label="Ask about preworkout"
            checked={settings?.ask_preworkout ?? false}
            onChange={(next) => updateSettings.mutate({ ask_preworkout: next })}
          />
        </div>
        <div className="flex items-center justify-between gap-4 py-3">
          <div>
            <h3 className="card-title">Haptics</h3>
            <p className="text-xs text-slate-500">Small vibrations for sets, PRs and streaks</p>
          </div>
          <Toggle
            label="Haptics"
            checked={settings?.haptics_enabled ?? true}
            onChange={(next) => updateSettings.mutate({ haptics_enabled: next })}
          />
        </div>
      </div>

      <div className="card p-4">
        <h3 className="mb-2 card-title">Display</h3>
        <p className="mb-1.5 text-xs text-slate-500">Theme</p>
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {(['system', 'light', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => updateSettings.mutate({ theme: t })}
              className={`rounded-xl px-3 py-2 text-sm font-medium capitalize transition ${
                (settings?.theme ?? 'system') === t ? 'bg-emerald-600 text-on-accent' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="mb-1.5 text-xs text-slate-500">Accent colour</p>
        <div className="mb-3 flex gap-2" role="radiogroup" aria-label="Accent colour">
          {[
            { value: 'emerald', label: 'Emerald', dot: '#34d399' },
            { value: 'violet', label: 'Violet', dot: '#a78bfa' },
            { value: 'cyan', label: 'Cyan', dot: '#22d3ee' },
            { value: 'rose', label: 'Rose', dot: '#fb7185' },
            { value: 'amber', label: 'Amber', dot: '#fbbf24' },
          ].map((p) => (
            <button
              key={p.value}
              role="radio"
              aria-checked={(settings?.color_palette ?? 'emerald') === p.value}
              aria-label={p.label}
              onClick={() => updateSettings.mutate({ color_palette: p.value })}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
                (settings?.color_palette ?? 'emerald') === p.value ? 'ring-2 ring-white/70' : ''
              }`}
            >
              <span className="h-7 w-7 rounded-full" style={{ background: p.dot }} />
            </button>
          ))}
        </div>
        <p className="mb-1.5 text-xs text-slate-500">Units</p>
        <div className="grid grid-cols-2 gap-1.5">
          {(['metric', 'imperial'] as const).map((u) => (
            <button
              key={u}
              onClick={() => updateSettings.mutate({ unit_system: u })}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                (settings?.unit_system ?? 'metric') === u
                  ? 'bg-emerald-600 text-on-accent'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {u === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lb, in)'}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          {(settings?.unit_system ?? 'metric') === 'metric'
            ? 'Weights in kg, measurements in cm, food in g, drinks in ml.'
            : 'Weights in lb, measurements in inches, food in oz, drinks in fl oz.'}{' '}
          Nutrients stay in grams.
        </p>
      </div>

      <PushNotificationsCard />

      <div className="card p-4">
        <p className="mb-1 text-xs text-slate-500">Signed in as</p>
        <p className="mb-2 truncate text-sm text-white">{user?.email}</p>

        {changingPassword ? (
          <div className="mb-3 space-y-2">
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full field px-3 py-2"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full field px-3 py-2"
            />
            {passwordMessage && (
              <p role="status" className={`text-xs ${passwordMessage === 'Password updated.' ? 'text-success' : 'text-red-400'}`}>
                {passwordMessage}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setChangingPassword(false)}
                className="btn btn-secondary flex-1 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="btn btn-primary flex-1 py-2 text-sm"
              >
                Update
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setChangingPassword(true)}
            className="flex min-h-11 w-full items-center justify-between border-t border-white/5 text-left text-sm font-medium text-slate-200 disabled:opacity-50"
          >
            Change password <span aria-hidden="true" className="text-slate-500">›</span>
          </button>
        )}

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex min-h-11 w-full items-center justify-between border-t border-white/5 text-left text-sm font-medium text-slate-200 disabled:opacity-50"
        >
          {exporting ? 'Preparing export…' : 'Export my data'} <span aria-hidden="true" className="text-slate-500">›</span>
        </button>

        <button
          onClick={replayOnboarding}
          className="flex min-h-11 w-full items-center justify-between border-t border-white/5 text-left text-sm font-medium text-slate-200"
        >
          Show welcome again <span aria-hidden="true" className="text-slate-500">›</span>
        </button>

        <button
          onClick={() => supabase.auth.signOut()}
          className="flex min-h-11 w-full items-center justify-between border-t border-white/5 text-left text-sm font-medium text-slate-200 disabled:opacity-50"
        >
          Sign out
        </button>
      </div>

      <div className="card px-4 py-1">
        {FITLOG_LINKS.map((link, i) => (
          <button
            key={link.route}
            onClick={() => onOpen(link.route)}
            className={`flex min-h-12 w-full items-center gap-3 text-left text-sm font-medium text-slate-200 ${i > 0 ? 'border-t border-white/5' : ''}`}
          >
            <TabIcon tab={link.route} className="h-5 w-5 text-slate-400" />
            <span className="flex-1">{link.label}</span>
            <span aria-hidden="true" className="text-slate-500">›</span>
          </button>
        ))}
      </div>

      <DeleteAccountCard onExport={handleExport} exporting={exporting} />

      <p className="px-1 pb-2 text-center text-xs text-slate-500">
        <a href="/privacy" target="_blank" rel="noopener" className="inline-flex min-h-11 items-center px-2 font-medium text-slate-400 underline">
          Privacy policy
        </a>
        <br />
        FitLog · Build {formatBuildTime()}
      </p>
    </div>
  )
}
