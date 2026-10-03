import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { siteOrigin } from '../lib/platform'
import { hasSignedInBefore } from '../lib/deviceHistory'
import { peekPendingShared, SHARE_KIND_PHRASE } from '../lib/shareLink'
import { supabase } from '../lib/supabase'
import { TabIcon } from './TabIcon'
import { TICK_THE_BOX, useTurnstile } from './Turnstile'

type Mode = 'sign-in' | 'sign-up' | 'reset'

// Each mode gets its own heading and intro, so it's clear at a glance which form this is.
const HEADINGS: Record<Mode, { title: string; intro: string }> = {
  'sign-up': { title: 'Create your account', intro: 'All you need is an email and a password.' },
  'sign-in': { title: 'Welcome back', intro: 'Sign in to pick up where you left off.' },
  reset: { title: 'Reset your password', intro: "Enter your email and we'll send you a link to set a new password." },
}

const SUBMIT_LABELS: Record<Mode, string> = {
  'sign-in': 'Sign in',
  'sign-up': 'Create account',
  reset: 'Send reset link',
}

/** Supabase's CAPTCHA rejection reads like an internal error; say what to do instead. */
function friendlyAuthError(message: string): string {
  return /captcha/i.test(message) ? TICK_THE_BOX : message
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

/**
 * The signed-out screens' frame: the same aurora glow and accent mark the app's header uses, the
 * name and one line on what FitLog is (this is the first screen a new install shows), then the
 * form card, then the privacy policy.
 */
function AuthShell({ children }: { children: ReactNode }) {
  return (
    // Top-anchored rather than centered: the modes differ in height, and a centered card would jump
    // when switching between them.
    <div className="relative flex h-[var(--app-height)] justify-center overflow-y-auto overscroll-none bg-slate-950 px-4 pb-[max(1.5rem,var(--safe-area-inset-bottom,env(safe-area-inset-bottom)))] pt-[max(calc(var(--safe-area-inset-top,env(safe-area-inset-top))+1.5rem),8vh)]">
      <div className="aurora-a pointer-events-none fixed z-0 rounded-full" />
      <div className="aurora-b pointer-events-none fixed z-0 rounded-full" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3.5 px-1">
          <span className="area-mark flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-emerald-400">
            <TabIcon tab="workouts" className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xl font-bold leading-tight tracking-tight text-white">FitLog</p>
            <p className="text-balance text-sm text-slate-400">Workouts, meals and fasts in one log.</p>
          </div>
        </div>
        {children}
        <p className="mt-5 text-center">
          <a href="/privacy" target="_blank" rel="noopener" className="inline-flex min-h-11 items-center px-2 text-xs font-medium text-slate-500 underline underline-offset-2">
            Privacy policy
          </a>
        </p>
      </div>
    </div>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <path d="M4 4l16 16" />}
    </svg>
  )
}

/** A password field with a show/hide button, since typos are easy on a phone keyboard. */
function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={`${inputClass} w-full pr-12`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 active:text-emerald-400"
      >
        <EyeIcon open={visible} />
      </button>
    </div>
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
  // Cloudflare Turnstile: wait for its token on submit, a fresh check after each (see Turnstile.tsx).
  const turnstile = useTurnstile('auth')

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
    // A password manager can submit before the bot check has finished: wait for it.
    const captchaToken = await turnstile.getToken()
    if (!captchaToken && turnstile.needsTick()) {
      setError(TICK_THE_BOX)
      setLoading(false)
      return
    }
    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken: captchaToken ?? undefined } })
        if (error) throw error
      } else if (mode === 'sign-up') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { captchaToken: captchaToken ?? undefined } })
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
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: siteOrigin(), captchaToken: captchaToken ?? undefined })
        if (error) throw error
        setInfo(`If an account exists for ${email}, a reset link is on its way.`)
      }
    } catch (err) {
      setError(err instanceof Error ? friendlyAuthError(err.message) : 'Something went wrong')
    } finally {
      setLoading(false)
      if (captchaToken) turnstile.used()
    }
  }

  const heading = HEADINGS[mode]
  // Arrived from a share link: say what's waiting on the other side of signing in.
  const [sharedRef] = useState(() => peekPendingShared())

  return (
    <AuthShell>
      <div className="card p-6">
        {sharedRef && mode !== 'reset' && (
          <p className="mb-4 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300 ring-1 ring-emerald-500/20">
            Someone shared {SHARE_KIND_PHRASE[sharedRef.kind]} with you. {mode === 'sign-up' ? 'Create an account' : 'Sign in'} to open it and save a copy.
          </p>
        )}
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
              <PasswordInput
                id="auth-password"
                name="password"
                required
                minLength={6}
                autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                aria-describedby={mode === 'sign-up' ? 'password-hint' : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          {turnstile.widget}
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
    </AuthShell>
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
    <AuthShell>
      <form onSubmit={handleSubmit} className="card flex flex-col gap-3 p-6">
        <h1 className="text-2xl font-semibold text-white">Set a new password</h1>
        <p className="mb-3 text-sm text-slate-400">Choose a new password for your FitLog account.</p>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
          New password
          <PasswordInput
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
          Confirm new password
          <PasswordInput
            required
            minLength={6}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
    </AuthShell>
  )
}
