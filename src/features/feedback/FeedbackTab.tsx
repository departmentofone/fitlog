import { TabIcon } from '../../components/TabIcon'
import { tipStore } from '../../lib/tipJar'
import { canAskForCoffee, CoffeeIcon, DONATE_URL } from './donate'
import { FeedbackForm } from './FeedbackForm'

const FEEDBACK_EMAIL = 'departmentofone.app@gmail.com'

const cardClass = 'card p-4'

/**
 * Everything that goes back to the developer: feedback first, then an optional tip. The app
 * versions with a store take tips through it (the tip jar); the web links to Buy Me a Coffee.
 * Google Play's Payments policy doesn't allow leading people to an outside payment page from the
 * app, so the Play build never shows the coffee link or asks for one.
 */
export function FeedbackTab({ onOpenTips }: { onOpenTips: () => void }) {
  const canTip = !!tipStore()
  const showDonate = !canTip && canAskForCoffee()

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
        <h2 className="mb-2 card-title">About the developer</h2>
        <div className="space-y-3 text-sm leading-relaxed text-slate-400">
          <p>
            FitLog started as a small project I built for my own use. I liked working on it, so I polished it and
            published it for other people to use too.
          </p>
          <p>I'm one person making apps because I enjoy it.</p>
          {canTip && <p>If it's been useful to you, you can leave a tip. It's optional, and I appreciate it.</p>}
          {showDonate && (
            <p>
              If it's been useful to you, a coffee helps cover the costs of keeping it running. It's
              optional, and I appreciate it.
            </p>
          )}
        </div>
        {canTip && (
          <button
            type="button"
            onClick={onOpenTips}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-semibold text-on-accent active:brightness-90"
          >
            <TabIcon tab="tips" className="h-5 w-5" />
            Leave a tip
          </button>
        )}
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
