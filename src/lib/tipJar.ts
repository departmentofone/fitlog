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
 * The tips, as food for the developer: a calorie tracker's way of saying thanks. Product IDs are
 * as created in Play Console (Monetize > Products > One-time products, consumable). IDs can never
 * be changed or reused, so they don't name a price or a food. Prices are round (US$2, 5, 10, 20)
 * and always come from the store, never from here.
 */
export const TIP_PRODUCTS = [
  { id: 'tip_tier_1', name: 'Banana', kcal: 105, line: 'Pre-workout classic.' },
  { id: 'tip_tier_2', name: 'Protein shake', kcal: 220, line: 'Hits the macros.' },
  { id: 'tip_tier_3', name: 'Chicken and rice', kcal: 650, line: 'Meal prep, sorted.' },
  { id: 'tip_tier_4', name: 'Pizza night', kcal: 1800, line: 'Cheat meal. No judgment.' },
] as const

export type TipProductId = (typeof TIP_PRODUCTS)[number]['id']

export function tipProduct(id: TipProductId) {
  return TIP_PRODUCTS.find((p) => p.id === id)!
}

export interface TipPrice {
  id: TipProductId
  /** The store's localized price, e.g. "$5.00" or "RSD 500". Never hard-coded. */
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

const TIPS_KEY = 'fitlog-tips'

/** How many of each tip this device has given, for the running total. Kept on the device only. */
function tipCounts(): Partial<Record<TipProductId, number>> {
  try {
    const parsed = JSON.parse(localStorage.getItem(TIPS_KEY) ?? '{}') as Record<string, unknown>
    const counts: Partial<Record<TipProductId, number>> = {}
    for (const p of TIP_PRODUCTS) {
      const n = Number(parsed[p.id])
      if (Number.isFinite(n) && n > 0) counts[p.id] = Math.floor(n)
    }
    return counts
  } catch {
    return {}
  }
}

export function recordTip(id: TipProductId) {
  try {
    const counts = tipCounts()
    counts[id] = (counts[id] ?? 0) + 1
    localStorage.setItem(TIPS_KEY, JSON.stringify(counts))
  } catch {
    // The running total just won't include it.
  }
}

/** Everything this device has tipped, in calories fed to the developer. */
export function kcalFed(): number {
  const counts = tipCounts()
  return TIP_PRODUCTS.reduce((sum, p) => sum + p.kcal * (counts[p.id] ?? 0), 0)
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
  const prices: Record<TipProductId, string> = { tip_tier_1: '$2.00', tip_tier_2: '$5.00', tip_tier_3: '$10.00', tip_tier_4: '$20.00' }
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
