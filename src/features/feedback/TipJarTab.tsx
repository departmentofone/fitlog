import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useUserSettings } from '../../hooks/useUserSettings'
import { haptics } from '../../lib/haptics'
import { loadedOnBar, plateName, plateWeight, recordTip, TIP_PRODUCTS, tipStore, type TipProductId } from '../../lib/tipJar'
import { weightUnitLabel } from '../../lib/units'
import { CoffeeIcon, DONATE_URL, canAskForCoffee } from './donate'

type Status =
  | { kind: 'idle' }
  | { kind: 'buying'; id: TipProductId }
  | { kind: 'thanked'; id: TipProductId }
  | { kind: 'pending' }
  | { kind: 'error' }

/**
 * Each plate on screen, smallest to a full plate, in the competition colours lifters know: chrome
 * 1.25, white 5, green 10, blue 20.
 */
const PLATES = [
  { size: 22, disc: 'fill-slate-300', rim: 'stroke-slate-400' },
  { size: 28, disc: 'fill-slate-100', rim: 'stroke-slate-300' },
  { size: 34, disc: 'fill-emerald-600', rim: 'stroke-emerald-800' },
  { size: 42, disc: 'fill-blue-700', rim: 'stroke-blue-900' },
]

/** A bumper plate seen from the side of the bar: a coloured disc with a rim and a hole. */
function Plate({ size, disc, rim }: (typeof PLATES)[number]) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className="shrink-0">
      <circle cx="20" cy="20" r="18.5" className={`${disc} ${rim}`} strokeWidth="2" />
      <circle cx="20" cy="20" r="12" fill="none" className={rim} strokeWidth="1.5" opacity="0.6" />
      <circle cx="20" cy="20" r="4" className={`fill-slate-900 ${rim}`} strokeWidth="1.5" />
    </svg>
  )
}

function formatLoad(weight: number): string {
  return Number.isInteger(weight) ? String(weight) : String(Math.round(weight * 100) / 100)
}

/**
 * The tip jar screen (Settings > Tip jar, and the button on Feedback & support). Optional
 * one-time tips through the app store, as plates loaded onto the developer's bar, in the person's
 * own unit. They unlock nothing, and the screen says so. Prices come from the store in the
 * person's currency. No nagging, countdowns or "supporter" tiers.
 */
export function TipJarTab() {
  const store = tipStore()
  const { data: settings } = useUserSettings()
  const unit = weightUnitLabel(settings?.unit_system)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [loaded, setLoaded] = useState(() => ({ kg: loadedOnBar('kg'), lb: loadedOnBar('lb') }))
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
        setLoaded({ kg: loadedOnBar('kg'), lb: loadedOnBar('lb') })
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

  const available = TIP_PRODUCTS.flatMap((p, i) => {
    const price = prices.data?.find((x) => x.id === p.id)?.price
    return price ? [{ ...p, price, look: PLATES[i] }] : []
  })
  const buying = status.kind === 'buying'

  return (
    <div className="space-y-4 p-4">
      <div className="card p-4">
        <h2 className="text-xl font-semibold text-white">Tip jar</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          FitLog is made by one person. If it's useful to you, put a plate on my bar. It's a one-time tip,
          and it doesn't unlock anything or change your account.
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
                    aria-label={`${plateName(p.id, unit)}, ${p.price}`}
                    className="flex min-h-16 w-full items-center gap-3 rounded-xl bg-slate-800 px-3 py-2.5 text-left active:bg-slate-700 disabled:opacity-60"
                  >
                    <span className="flex w-11 shrink-0 justify-center">
                      <Plate {...p.look} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-100">{plateName(p.id, unit)}</span>
                      <span className="block text-xs text-slate-400">{p.line}</span>
                    </span>
                    <span className="shrink-0 rounded-lg bg-slate-900/60 px-2.5 py-1.5 text-sm font-semibold text-emerald-400">{p.price}</span>
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
              Thank you. That's {plateWeight(status.id, unit)} {unit} on the bar.
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
        {loaded[unit] > 0 && (
          <>
            <br />
            So far you've loaded {formatLoad(loaded[unit])} {unit} onto the bar from this phone.
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
