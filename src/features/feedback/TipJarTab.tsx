import { useQuery } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { haptics } from '../../lib/haptics'
import { formatWhole } from '../../lib/number'
import { kcalFed, recordTip, TIP_PRODUCTS, tipProduct, tipStore, type TipProductId } from '../../lib/tipJar'
import { CoffeeIcon, DONATE_URL, canAskForCoffee } from './donate'

type Status =
  | { kind: 'idle' }
  | { kind: 'buying'; id: TipProductId }
  | { kind: 'thanked'; id: TipProductId }
  | { kind: 'pending' }
  | { kind: 'error' }

/** Line drawings of each tip, in the app's icon style (24px grid, 2px round strokes). */
const FOOD: Record<TipProductId, { color: string; icon: ReactNode }> = {
  tip_tier_1: {
    color: 'text-amber-300',
    icon: <path d="M13.5 5.5c4.5 3.5 4 13.5-8 14.5l-1.5-1c8.5-1.5 11-8 8.5-13zM13.5 5.5l1-2.5" />,
  },
  tip_tier_2: {
    color: 'text-sky-300',
    icon: <path d="M8.5 3h7v3h-7zM7.5 6h9l-1 13.5a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5zM8 11h8" />,
  },
  tip_tier_3: {
    color: 'text-emerald-300',
    icon: <path d="M3 12h18a9 9 0 0 1-18 0zM7 12a5 5 0 0 1 10 0M11 5.5c0-1.5 1-1.5 1-3M14 6c0-1.5 1-1.5 1-3" />,
  },
  tip_tier_4: {
    color: 'text-orange-300',
    icon: <path d="M12 21 3.5 6.5a17 17 0 0 1 17 0zM5 9a14 14 0 0 1 14 0M10 11.5h.01M14 12h.01M12 16h.01" />,
  },
}

function FoodIcon({ id }: { id: TipProductId }) {
  const { color, icon } = FOOD[id]
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900/60 ${color}`}>
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icon}
      </svg>
    </span>
  )
}

/**
 * The tip jar screen (Settings > Tip jar, and the button on Feedback & support). Optional
 * one-time tips through the app store, as food for the developer, with a running calorie count.
 * They unlock nothing, and the screen says so. Prices come from the store in the person's
 * currency. No nagging, countdowns or "supporter" tiers.
 */
export function TipJarTab() {
  const store = tipStore()
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [fed, setFed] = useState(() => kcalFed())
  const prices = useQuery({
    queryKey: ['tip-prices'],
    enabled: !!store,
    staleTime: 60 * 60 * 1000,
    queryFn: () => store!.prices(),
  })

  if (!store) return <NoStore />

  async function tip(id: TipProductId) {
    if (!store || status.kind === 'buying') return
    setStatus({ kind: 'buying', id })
    try {
      const outcome = await store.buy(id)
      if (outcome === 'thanked') {
        recordTip(id)
        setFed(kcalFed())
        haptics.success()
        setStatus({ kind: 'thanked', id })
      } else if (outcome === 'pending') {
        setStatus({ kind: 'pending' })
      } else {
        setStatus({ kind: 'idle' })
      }
    } catch {
      setStatus({ kind: 'error' })
    }
  }

  const available = TIP_PRODUCTS.flatMap((p) => {
    const price = prices.data?.find((x) => x.id === p.id)?.price
    return price ? [{ ...p, price }] : []
  })
  const buying = status.kind === 'buying'

  return (
    <div className="space-y-4 p-4">
      <div className="card p-4">
        <h2 className="text-xl font-semibold text-white">Tip jar</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          FitLog is made by one person. If it's useful to you, you can feed the developer. It's a one-time
          tip, and it doesn't unlock anything or change your account.
        </p>

        {prices.isLoading ? (
          <div className="mt-4 space-y-2" aria-hidden="true">
            {TIP_PRODUCTS.map((p) => (
              <div key={p.id} className="h-16 animate-pulse rounded-xl bg-slate-800/70" />
            ))}
          </div>
        ) : available.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-800/60 px-3 py-3 text-sm text-slate-400">
            {store.storeName} isn't answering right now. Check your connection and try again later.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {available.map((p) => {
              const thisOne = status.kind === 'buying' && status.id === p.id
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={buying}
                    onClick={() => void tip(p.id)}
                    aria-busy={thisOne}
                    aria-label={`${p.name}, ${formatWhole(p.kcal)} kcal, ${p.price}`}
                    className="flex min-h-16 w-full items-center gap-3 rounded-xl bg-slate-800 px-3 py-2.5 text-left active:bg-slate-700 disabled:opacity-60"
                  >
                    <FoodIcon id={p.id} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-100">{p.name}</span>
                      <span className="block text-xs text-slate-400">{p.line}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="rounded-lg bg-slate-900/60 px-2.5 py-1 text-sm font-semibold text-emerald-400">{p.price}</span>
                      <span className="text-[11px] text-slate-500">{formatWhole(p.kcal)} kcal</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div aria-live="polite" className="mt-3 min-h-5 text-center text-sm">
          {buying && <p className="text-slate-400">Waiting for {store.storeName}…</p>}
          {status.kind === 'thanked' && (
            <p className="fade-in font-medium text-emerald-400">
              Logged. That's {formatWhole(tipProduct(status.id).kcal)} kcal for the developer.
            </p>
          )}
          {status.kind === 'pending' && (
            <p className="fade-in text-slate-400">{store.storeName} is still processing this payment. It goes through once it clears.</p>
          )}
          {status.kind === 'error' && <p className="fade-in text-red-400">That didn't go through. Please try again.</p>}
        </div>
      </div>

      <p className="px-1 text-center text-xs leading-relaxed text-slate-500">
        Tips are one-time payments through {store.storeName}, which keeps a share. Nothing renews.
        {fed > 0 && (
          <>
            <br />
            You've fed the developer {formatWhole(fed)} kcal from this phone. Thank you.
          </>
        )}
      </p>
    </div>
  )
}

/** Opened somewhere without a store: the web gets the coffee link, the Play web build just a note. */
function NoStore() {
  const coffee = canAskForCoffee() && DONATE_URL
  return (
    <div className="space-y-4 p-4">
      <div className="card p-4">
        <h2 className="text-xl font-semibold text-white">Tip jar</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          {coffee
            ? "The tip jar is in the FitLog app. Here on the web, you can buy me a coffee instead. It's optional, and I appreciate it."
            : "The tip jar isn't available in this version of FitLog yet."}
        </p>
        {coffee && (
          <a
            href={coffee}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 font-semibold text-slate-950 active:brightness-90"
          >
            <CoffeeIcon />
            Buy me a coffee
          </a>
        )}
      </div>
    </div>
  )
}
