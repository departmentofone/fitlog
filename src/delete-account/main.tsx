import type { Session } from '@supabase/supabase-js'
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { deleteAccount } from '../lib/deleteAccount'
import { supabase } from '../lib/supabase'

/**
 * Public, logged-out account deletion (Google Play requirement: must work without the app).
 * Identity is proven either with the account password or with an emailed sign-in link that
 * returns here. Deliberately independent of the main app shell - no AuthProvider, no query cache.
 */
const CONFIRM_WORD = 'DELETE'

function SignIn() {
  const [method, setMethod] = useState<'password' | 'link'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    if (method === 'password') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        // Never create an account from this page.
        options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/delete-account` },
      })
      if (error) setError(error.message)
      else setSent(true)
    }
    setBusy(false)
  }

  if (sent) {
    return (
      <div className="card">
        <p className="success">Check your inbox.</p>
        <p>
          If an account exists for <b>{email}</b>, we've sent it a sign-in link. Open it on this device and you'll come
          back here to confirm the deletion.
        </p>
      </div>
    )
  }

  return (
    <form className="card" onSubmit={submit}>
      <p>First, confirm it's your account.</p>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        required
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {method === 'password' && (
        <>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy}>
        {busy ? 'Please wait…' : method === 'password' ? 'Continue' : 'Email me a sign-in link'}
      </button>
      <button
        type="button"
        className="secondary"
        onClick={() => {
          setMethod(method === 'password' ? 'link' : 'password')
          setError(null)
        }}
      >
        {method === 'password' ? "Forgot your password? Use an email link instead" : 'Use my password instead'}
      </button>
    </form>
  )
}

function Deleted() {
  return (
    <div className="card" role="status">
      <p className="success">
        <b>Your FitLog account and all of its data have been deleted.</b>
      </p>
      <p>You can close this page. If you still have the app installed, you can uninstall it now.</p>
    </div>
  )
}

function Confirm({ session, onDeleted }: { session: Session; onDeleted: () => void }) {
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="card">
      <p>
        Signed in as <b>{session.user.email}</b>.
      </p>
      <p>
        Deleting permanently removes your account and <b>all</b> of your workouts, meals, goals, fasting and body logs,
        presets, recipes, programs, and photos. <b>This can't be undone.</b>
      </p>
      <p className="hint">
        If someone else saved a meal or workout using a custom food or exercise you created, that single entry stays in
        the shared library (without your name) so their log keeps working. Want a copy of your data first? Use Settings →
        Export my data in the app.
      </p>
      <label htmlFor="confirm">Type {CONFIRM_WORD} to confirm</label>
      <input
        id="confirm"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
      />
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button
        type="button"
        className="danger"
        disabled={busy || typed.trim().toUpperCase() !== CONFIRM_WORD}
        onClick={async () => {
          setBusy(true)
          setError(null)
          try {
            // Mark done before deleteAccount's sign-out swaps this view for the sign-in form.
            await deleteAccount(supabase, onDeleted)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
            setBusy(false)
          }
        }}
      >
        {busy ? 'Deleting…' : 'Permanently delete my account'}
      </button>
      <button type="button" className="secondary" disabled={busy} onClick={() => supabase.auth.signOut()}>
        This isn't my account, sign out
      </button>
    </div>
  )
}

function DeleteAccountPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [deleted, setDeleted] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  if (deleted) return <Deleted />
  if (session === undefined) return <p className="hint">Loading…</p>
  return session ? <Confirm session={session} onDeleted={() => setDeleted(true)} /> : <SignIn />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DeleteAccountPage />
  </StrictMode>,
)
