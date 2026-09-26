import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { FEEDBACK_EMAIL_RE, FEEDBACK_LIMITS, sendFeedback } from '../../lib/feedback'

const fieldClass =
  'w-full field px-3 py-2.5 text-sm  aria-[invalid=true]:border-red-400'

// Quick starts for the subject - tapping one fills it in, and it can still be edited.
const TOPICS = ['Bug report', 'Feature idea', 'Question']

/**
 * Feedback / contact form. Same principle as the Department of One site's contact form (and the same
 * endpoint): subject, a reply-to email (prefilled with the account's), and a plain message box
 * where Enter is just a new line. The app build and platform ride along for bug reports.
 */
export function FeedbackForm() {
  const { user } = useAuth()
  const [subject, setSubject] = useState('')
  const [email, setEmail] = useState(user?.email ?? '')
  const [message, setMessage] = useState('')
  const [invalid, setInvalid] = useState<'subject' | 'email' | 'message' | null>(null)
  const [status, setStatus] = useState<{ tone: 'error'; text: string } | null>(null)
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  function fail(field: 'subject' | 'email' | 'message', text: string) {
    setInvalid(field)
    setStatus({ tone: 'error', text })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim()) return fail('subject', 'Add a subject.')
    if (!FEEDBACK_EMAIL_RE.test(email.trim())) return fail('email', "That email address doesn't look right.")
    if (!message.trim()) return fail('message', 'Write a message.')
    setInvalid(null)
    setStatus(null)
    setSending(true)
    try {
      await sendFeedback({ subject, email, message, accountEmail: user?.email })
      setSentTo(email.trim())
    } catch (err) {
      setStatus({
        tone: 'error',
        text: navigator.onLine ? (err instanceof Error ? err.message : 'Something went wrong.') : "You're offline - try again once you're connected.",
      })
    } finally {
      setSending(false)
    }
  }

  if (sentTo) {
    return (
      <div className="pop-in rounded-2xl bg-emerald-500/10 p-4 text-center ring-1 ring-emerald-500/25">
        <p className="text-sm font-semibold text-white">Thanks - message sent</p>
        <p className="mt-1 text-sm text-slate-300">
          I read every one. If it needs an answer, the reply goes to <span className="font-medium text-white">{sentTo}</span>.
        </p>
        <button
          type="button"
          onClick={() => {
            setSentTo(null)
            setSubject('')
            setMessage('')
          }}
          className="mt-3 min-h-10 text-sm font-medium text-emerald-400"
        >
          Send another
        </button>
      </div>
    )
  }

  const clear = (field: typeof invalid) => {
    if (invalid === field) setInvalid(null)
    if (status) setStatus(null)
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {TOPICS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setSubject(t)
              clear('subject')
            }}
            aria-pressed={subject === t}
            className={`min-h-9 rounded-full px-3 text-xs font-medium transition ${
              subject === t ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <input
        value={subject}
        onChange={(e) => {
          setSubject(e.target.value)
          clear('subject')
        }}
        maxLength={FEEDBACK_LIMITS.subject}
        placeholder="Subject"
        aria-label="Subject"
        aria-invalid={invalid === 'subject'}
        enterKeyHint="next"
        className={fieldClass}
      />
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          clear('email')
        }}
        placeholder="Your email, for a reply"
        aria-label="Your email"
        aria-invalid={invalid === 'email'}
        className={fieldClass}
      />
      {/* A plain textarea: Enter is a new line and the text is sent exactly as typed. */}
      <div>
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            clear('message')
          }}
          maxLength={FEEDBACK_LIMITS.message}
          rows={5}
          placeholder="What happened, or what would you like to see?"
          aria-label="Message"
          aria-invalid={invalid === 'message'}
          className={`${fieldClass} resize-y leading-relaxed`}
        />
        <p className="mt-1 text-right text-[11px] tabular-nums text-slate-500">
          {message.length.toLocaleString()} / {FEEDBACK_LIMITS.message.toLocaleString()}
        </p>
      </div>
      {status && (
        <p role="alert" className="text-sm text-red-400">
          {status.text}
        </p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="btn btn-primary w-full text-sm disabled:opacity-60"
      >
        {sending ? 'Sending…' : 'Send'}
      </button>
      <p className="text-center text-[11px] text-slate-500">The app version is included to help with bug reports.</p>
    </form>
  )
}
