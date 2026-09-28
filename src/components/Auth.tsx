import { useState } from 'react'
import { hasSignedInBefore } from '../lib/deviceHistory'
import { supabase } from '../lib/supabase'

type Mode = 'sign-in' | 'sign-up' | 'reset'

// Each mode gets its own heading and intro, so it's clear at a glance which form this is.
const HEADINGS: Record<Mode, { title: string; intro: string }> = {
  'sign-up': { title: 'Create your account', intro: 'Free, with no ads. All you need is an email and a password.' },
  'sign-in': { title: 'Welcome back', intro: 'Sign in to pick up where you left off.' },
  reset: { title: 'Reset your password', intro: "Enter your email and we'll send you a link to set a new password." },
}

const SUBMIT_LABELS: Record<Mode, string> = {
  'sign-in': 'Sign in',
  'sign-up': 'Create account',
  reset: 'Send reset link',
}

const inputClass =
  'h-12 field px-3 '

function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`min-h-10 flex-1 rounded-full text-sm font-semibold transition ${
        active ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400'
      }`}
    >
      {children}
    </button>
  )
}

export function AuthScreen() {
  // A device that has never had a FitLog session starts on Create account; everyone else on Sign in.
  const [mode, setMode] = useState<Mode>(() => (hasSignedInBefore() ? 'sign-in' : 'sign-up'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setInfo(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'sign-up') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // If email confirmation is on, signUp won't return a session: switch to Sign in, ready for
        // after they've confirmed.
        if (!data.session) {
          setMode('sign-in')
          setPassword('')
          setInfo('Account created. Check your email to confirm it, then sign in here.')
        }
        // Otherwise the auth state listener picks up the new session and logs them in automatically.
      } else {
        // The link lands back on the app, where useAuth sees the PASSWORD_RECOVERY event and shows
        // the set-new-password screen.
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
        if (error) throw error
        setInfo(`If an account exists for ${email}, a reset link is on its way.`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const heading = HEADINGS[mode]

  // Top-anchored rather than centered: the modes differ in height, and a centered card would jump
  // when switching between them.
  return (
    <div className="flex h-[var(--app-height)] items-start justify-center overflow-y-auto overscroll-none bg-slate-950 px-4 pb-8 pt-[max(env(safe-area-inset-top),10vh)]">
      <div className="w-full max-w-sm rounded-3xl border-t border-white/10 bg-slate-900 p-6 shadow-xl shadow-[var(--glow-shadow)]">
        <p className="mb-4 text-sm font-semibold tracking-tight text-emerald-400">FitLog</p>
        {mode !== 'reset' && (
          <div className="mb-6 flex rounded-full bg-slate-950 p-1 ring-1 ring-white/5" role="tablist" aria-label="Account">
            <ModeTab active={mode === 'sign-up'} onClick={() => switchMode('sign-up')}>
              Create account
            </ModeTab>
            <ModeTab active={mode === 'sign-in'} onClick={() => switchMode('sign-in')}>
              Sign in
            </ModeTab>
          </div>
        )}
        <h1 className="mb-1 text-2xl font-semibold text-white">{heading.title}</h1>
        <p className="mb-6 text-sm text-slate-400">{heading.intro}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete={mode === 'sign-up' ? 'email' : 'username'}
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>
          {mode !== 'reset' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="auth-password" className="text-sm font-medium text-slate-300">
                  {mode === 'sign-up' ? 'Choose a password' : 'Password'}
                </label>
                {mode === 'sign-in' && (
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="-my-3 -mr-2 min-h-11 px-2 text-sm font-medium text-emerald-400"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                id="auth-password"
                type="password"
                name="password"
                required
                minLength={6}
                autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                aria-describedby={mode === 'sign-up' ? 'password-hint' : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              {mode === 'sign-up' && (
                <span id="password-hint" className="text-xs text-slate-500">
                  At least 6 characters
                </span>
              )}
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
          {info && (
            <p role="status" className="text-sm text-success">
              {info}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-2 min-h-12"
          >
            {loading ? 'Please wait…' : SUBMIT_LABELS[mode]}
          </button>
        </form>
        {mode === 'reset' && (
          <button
            onClick={() => switchMode('sign-in')}
            className="mt-3 min-h-11 w-full text-center text-sm text-slate-400"
          >
            Remembered it? <span className="font-semibold text-emerald-400">Sign in</span>
          </button>
        )}
      </div>
    </div>
  )
}

/** Shown after following a password-reset email link: the user is signed in and picks a new password. */
export function SetNewPasswordScreen({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) setError(error.message)
    else onDone()
  }

  return (
    <div className="flex h-[var(--app-height)] items-center justify-center overflow-y-auto overscroll-none bg-slate-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3 rounded-3xl border-t border-white/10 bg-slate-900 p-6 shadow-xl shadow-[var(--glow-shadow)]"
      >
        <h1 className="text-2xl font-semibold text-white">Set a new password</h1>
        <p className="mb-3 text-sm text-slate-400">Choose a new password for your FitLog account.</p>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
          New password
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
          Confirm new password
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary mt-2 min-h-12"
        >
          {loading ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </div>
  )
}
