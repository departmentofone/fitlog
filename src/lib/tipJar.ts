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

export type FixedTipId = (typeof TIP_PRODUCTS)[number]['id']

/**
 * Grandma's portion: a tip of the person's own size. Play only sells fixed prices, so it's a
 * ladder of products, one per US dollar amount, picked with a stepper. These IDs name their US
 * price; a different ladder later means new products. Counted at 100 kcal a dollar.
 */
export const GRANDMA_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 25, 50, 100] as const
export const GRANDMA_DEFAULT = 3
export const GRANDMA_KCAL_PER_DOLLAR = 100
type GrandmaId = `tip_custom_${(typeof GRANDMA_STEPS)[number]}`

export function grandmaId(usd: (typeof GRANDMA_STEPS)[number]): GrandmaId {
  return `tip_custom_${usd}`
}

export type TipProductId = FixedTipId | GrandmaId

/** Every product the store adapter should look up. */
export const ALL_TIP_IDS: TipProductId[] = [...TIP_PRODUCTS.map((p) => p.id), ...GRANDMA_STEPS.map(grandmaId)]

export function isGrandma(id: TipProductId): id is GrandmaId {
  return id.startsWith('tip_custom_')
}

/** What a tip is worth in calories fed to the developer. */
export function kcalOf(id: TipProductId): number {
  if (isGrandma(id)) return Number(id.slice('tip_custom_'.length)) * GRANDMA_KCAL_PER_DOLLAR
  return TIP_PRODUCTS.find((p) => p.id === id)!.kcal
}

export interface TipPrice {
  id: TipProductId
  /** The store's localized price, e.g. "$5.00" or "RSD 500". Never hard-coded. */
  price: string
}

/**
 * How a purchase ended. "thanked": paid and consumed. "pending": the store accepted it but the
 * payment hasn't cleared (cash at a shop, slow card); the adapter consumes it once it clears, at a
 * later start. "cancelled": the person backed out.
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
    for (const id of ALL_TIP_IDS) {
      const n = Number(parsed[id])
      if (Number.isFinite(n) && n > 0) counts[id] = Math.floor(n)
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
  return ALL_TIP_IDS.reduce((sum, id) => sum + kcalOf(id) * (counts[id] ?? 0), 0)
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
  const usd: Record<FixedTipId, number> = { tip_tier_1: 2, tip_tier_2: 5, tip_tier_3: 10, tip_tier_4: 20 }
  const priceOf = (id: TipProductId) => `$${isGrandma(id) ? id.slice('tip_custom_'.length) : usd[id]}.00`
  return {
    storeName: 'Google Play',
    prices: async () => ALL_TIP_IDS.map((id) => ({ id, price: priceOf(id) })),
    buy: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      if (mode === 'error') throw new Error('Preview error')
      return mode === 'pending' ? 'pending' : 'thanked'
    },
  }
}
