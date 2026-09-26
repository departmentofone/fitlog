import { formatBuildTime } from './buildInfo'
import { isAndroidApp } from './platform'

// The Department of One site's contact endpoint (api/contact.js in that repo) - the same inbox,
// Gmail forwarding and keys as the site's own contact form. It allows FitLog's origin via CORS and
// labels messages sent with `source: 'fitlog'` as [FitLog].
export const FEEDBACK_ENDPOINT = 'https://department-of-one.vercel.app/api/contact'

// Same limits as the endpoint and the contact_messages table (the stored copy also carries the
// context line, so the message itself stays well under the table's 5,000).
export const FEEDBACK_LIMITS = { subject: 180, message: 4500 }
export const FEEDBACK_EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** One line that helps with bug reports: which build, where it runs, which account sent it. */
export function feedbackContext(accountEmail: string | null | undefined): string {
  const where = isAndroidApp() ? 'Android app' : 'web'
  return [`Build ${formatBuildTime()}`, where, accountEmail ? `account ${accountEmail}` : null].filter(Boolean).join(' · ')
}

export async function sendFeedback(input: { subject: string; email: string; message: string; accountEmail?: string | null }) {
  const res = await fetch(FEEDBACK_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'fitlog',
      subject: input.subject.trim(),
      email: input.email.trim(),
      message: input.message,
      context: feedbackContext(input.accountEmail),
    }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? "Couldn't send right now - please try again in a minute.")
  }
}
