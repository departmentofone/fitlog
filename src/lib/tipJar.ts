/**
 * The tip jar: optional one-time tips paid through the app store (Google Play now, the App Store
 * later). Tips unlock nothing. See TIP_JAR_PLAN.md.
 *
 * The store itself plugs in from the native app (Capacitor, CAPACITOR_PLAN.md chunk "Tip jar
 * billing"): it calls registerTipStore() at startup with an adapter over the billing plugin. On
 * the web and in the old Play (TWA) build nothing registers, so tipStore() is null and every entry
 * point to the tip jar stays hidden. The web keeps Buy Me a Coffee instead (donate.tsx).
 */

/**
 * Product IDs as created in Play Console (Monetize > Products > In-app products), consumable.
 * IDs can never be changed or reused, so they name a size, not a price.
 */
export const TIP_PRODUCTS = [
  { id: 'tip_small', label: 'Small tip' },
  { id: 'tip_medium', label: 'Medium tip' },
  { id: 'tip_large', label: 'Large tip' },
  { id: 'tip_xlarge', label: 'Extra large tip' },
] as const

export type TipProductId = (typeof TIP_PRODUCTS)[number]['id']

export interface TipPrice {
  id: TipProductId
  /** The store's localized price, e.g. "$2.99" or "RSD 320". Never hard-coded. */
  price: string
}

/**
 * How a purchase ended. "thanked": paid and consumed. "pending": the store accepted it but the
 * payment hasn't cleared (cash at a shop, slow card), and it's finished later by finishPending().
 * "cancelled": the person backed out.
 */
export type TipOutcome = 'thanked' | 'pending' | 'cancelled'

export interface TipStore {
  /** Shown while the store's own purchase sheet is up, e.g. "Google Play". */
  storeName: string
  /** Prices for the tip products the store has; products it doesn't know are left out. */
  prices(): Promise<TipPrice[]>
  /** Runs the store's purchase flow and consumes the purchase. Throws if it failed. */
  buy(id: TipProductId): Promise<TipOutcome>
}

let registered: TipStore | null = null

export function registerTipStore(store: TipStore | null) {
  registered = store
}

/** The store to tip through, or null where there isn't one (the web, the TWA build). */
export function tipStore(): TipStore | null {
  return registered ?? previewStore()
}

const TIPS_GIVEN_KEY = 'fitlog-tips-given'

/** How many tips this device has left, for the thank-you line. Kept on the device only. */
export function tipsGiven(): number {
  try {
    const n = Number(localStorage.getItem(TIPS_GIVEN_KEY))
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  } catch {
    return 0
  }
}

export function recordTip() {
  try {
    localStorage.setItem(TIPS_GIVEN_KEY, String(tipsGiven() + 1))
  } catch {
    // The thank-you line just won't count it.
  }
}

/**
 * A pretend store for working on the tip jar screen in development: run `npm run dev`, then set
 * localStorage "fitlog-tipjar-preview" to "1" (or "pending", "error"). Never part of a production
 * build, since import.meta.env.DEV is false there and the bundler drops this branch.
 */
function previewStore(): TipStore | null {
  if (!import.meta.env.DEV) return null
  let mode: string | null = null
  try {
    mode = localStorage.getItem('fitlog-tipjar-preview')
  } catch {
    return null
  }
  if (!mode) return null
  const prices: Record<TipProductId, string> = { tip_small: '$0.99', tip_medium: '$2.99', tip_large: '$4.99', tip_xlarge: '$9.99' }
  return {
    storeName: 'Google Play',
    prices: async () => TIP_PRODUCTS.map((p) => ({ id: p.id, price: prices[p.id] })),
    buy: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      if (mode === 'error') throw new Error('Preview error')
      return mode === 'pending' ? 'pending' : 'thanked'
    },
  }
}
