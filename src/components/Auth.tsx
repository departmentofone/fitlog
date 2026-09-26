import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Mode = 'sign-in' | 'sign-up' | 'reset'

const SUBTITLES: Record<Mode, string> = {
  'sign-in': 'Sign in to your log',
  'sign-up': 'Create your account',
  reset: "Enter your email and we'll send you a link to set a new password.",
}

const SUBMIT_LABELS: Record<Mode, string> = {
  'sign-in': 'Sign in',
  'sign-up': 'Create account',
  reset: 'Send reset link',
}

const inputClass =
  'h-12 field px-3 '

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('sign-in')
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
        // If email confirmation is on, signUp won't return a session — fall back to asking them to check email.
        if (!data.session) {
          setInfo('Account created. Check your email to confirm it, then sign in.')
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

  return (
    <div className="flex h-[var(--app-height)] items-center justify-center overflow-y-auto overscroll-none bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-3xl border-t border-white/10 bg-slate-900 p-6 shadow-xl shadow-[var(--glow-shadow)]">
        <h1 className="mb-1 text-2xl font-semibold text-white">FitLog</h1>
        <p className="mb-6 text-sm text-slate-400">{SUBTITLES[mode]}</p>
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
                  Password
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
        <button
          onClick={() => switchMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
          className="mt-3 min-h-11 w-full text-center text-sm text-slate-400"
        >
          {mode === 'sign-in' ? (
            <>
              Don't have an account? <span className="font-semibold text-emerald-400">Sign up</span>
            </>
          ) : (
            <>
              {mode === 'reset' ? 'Remembered it?' : 'Already have an account?'}{' '}
              <span className="font-semibold text-emerald-400">Sign in</span>
            </>
          )}
        </button>
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
