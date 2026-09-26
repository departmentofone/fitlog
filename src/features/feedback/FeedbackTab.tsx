import { isAndroidApp } from '../../lib/platform'
import { FeedbackForm } from './FeedbackForm'

const FEEDBACK_EMAIL = 'departmentofone.app@gmail.com'
/** Set to the real Buy Me a Coffee page once it exists - until then the button is a disabled placeholder. */
const DONATE_URL: string | null = null

const cardClass = 'rounded-3xl bg-slate-900 border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5'

function CoffeeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V8z" />
      <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17M8 2.5v2.5M12 2.5v2.5" />
    </svg>
  )
}

/** Everything that goes back to the developer: feedback first, then the optional coffee. */
export function FeedbackTab() {
  // Google Play's Payments policy doesn't allow linking out to an external payment page from
  // inside the app, so the Play (TWA) build shows the note without the button.
  const showDonate = !isAndroidApp()

  return (
    <div className="space-y-4 p-4">
      <div className={cardClass}>
        <h2 className="text-xl font-semibold text-white">Send feedback</h2>
        <p className="mb-3 mt-1 text-sm text-slate-400">
          Found a bug, or have an idea for something to add? It goes straight to the developer.
        </p>
        <FeedbackForm />
        <p className="mt-3 text-center text-xs text-slate-500">
          Or email{' '}
          <a href={`mailto:${FEEDBACK_EMAIL}`} className="font-medium text-slate-300 underline">
            {FEEDBACK_EMAIL}
          </a>
        </p>
      </div>

      <div className={cardClass}>
        <h3 className="mb-2 text-sm font-medium text-white">Why it's free</h3>
        <div className="space-y-3 text-sm leading-relaxed text-slate-400">
          <p>
            FitLog started as a small project I built for my own use. Along the way I realized there was no reason not
            to polish it a little further and publish it properly, so other people could benefit from it too.
          </p>
          <p>
            With that in mind, I didn't want to monetize anything. There are no premium plans and there never will be -
            I don't want to lock anyone out of any feature, and not everyone can pay for this kind of thing.
          </p>
          <p>
            If it's been useful to you, a coffee helps cover the costs of keeping it running. Completely optional,
            always appreciated.
          </p>
        </div>
        {showDonate &&
          (DONATE_URL ? (
            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 font-semibold text-slate-950 active:brightness-90"
            >
              <CoffeeIcon />
              Buy me a coffee
            </a>
          ) : (
            <button
              type="button"
              disabled
              aria-describedby="donate-soon"
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 font-semibold text-slate-400"
            >
              <CoffeeIcon />
              Buy me a coffee
              <span id="donate-soon" className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                Coming soon
              </span>
            </button>
          ))}
      </div>
    </div>
  )
}
