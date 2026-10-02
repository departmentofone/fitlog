import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { haptics } from '../../lib/haptics'
import { recordTip, TIP_PRODUCTS, tipsGiven, tipStore, type TipProductId } from '../../lib/tipJar'
import { CoffeeIcon, DONATE_URL, canAskForCoffee } from './donate'

type Status = { kind: 'idle' } | { kind: 'buying'; id: TipProductId } | { kind: 'thanked' } | { kind: 'pending' } | { kind: 'error' }

/**
 * The tip jar screen (Settings > Tip jar, and the button on Feedback & support). Optional
 * one-time tips through the app store; they unlock nothing, and the screen says so. Prices come
 * from the store in the person's own currency. No nagging, countdowns or "supporter" tiers.
 */
export function TipJarTab() {
  const store = tipStore()
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [given, setGiven] = useState(() => tipsGiven())
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
        recordTip()
        setGiven(tipsGiven())
        haptics.success()
        setStatus({ kind: 'thanked' })
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
          FitLog is made by one person. If it's useful to you, you can leave a tip. It's optional, and it
          doesn't unlock anything or change your account.
        </p>

        {prices.isLoading ? (
          <div className="mt-4 grid grid-cols-2 gap-2" aria-hidden="true">
            {TIP_PRODUCTS.map((p) => (
              <div key={p.id} className="h-16 animate-pulse rounded-xl bg-slate-800/70" />
            ))}
          </div>
        ) : available.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-800/60 px-3 py-3 text-sm text-slate-400">
            {store.storeName} isn't answering right now. Check your connection and try again later.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {available.map((p) => {
              const thisOne = status.kind === 'buying' && status.id === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={buying}
                  onClick={() => void tip(p.id)}
                  aria-busy={thisOne}
                  className="flex min-h-16 flex-col items-center justify-center rounded-xl bg-slate-800 px-2 py-2.5 text-center active:bg-slate-700 disabled:opacity-60"
                >
                  <span className="text-sm font-medium text-slate-200">{p.label}</span>
                  <span className="mt-0.5 text-base font-semibold text-emerald-400">{p.price}</span>
                </button>
              )
            })}
          </div>
        )}

        <div aria-live="polite" className="mt-3 min-h-5 text-center text-sm">
          {buying && <p className="text-slate-400">Waiting for {store.storeName}…</p>}
          {status.kind === 'thanked' && <p className="fade-in font-medium text-emerald-400">Thank you for the tip.</p>}
          {status.kind === 'pending' && (
            <p className="fade-in text-slate-400">{store.storeName} is still processing this payment. It goes through once it clears.</p>
          )}
          {status.kind === 'error' && <p className="fade-in text-red-400">That didn't go through. Please try again.</p>}
        </div>
      </div>

      <p className="px-1 text-center text-xs leading-relaxed text-slate-500">
        Tips are one-time payments through {store.storeName}, which keeps a share. Nothing renews.
        {given > 0 && (
          <>
            <br />
            {given === 1 ? "You've left a tip from this phone. Thank you." : `You've left ${given} tips from this phone. Thank you.`}
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
