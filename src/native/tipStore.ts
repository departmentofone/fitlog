import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases'
import { ALL_TIP_IDS, recordTip, registerTipStore, type TipOutcome, type TipPrice, type TipProductId, type TipStore } from '../lib/tipJar'
import { nativePlatform } from '../lib/platform'

/**
 * The tip jar's store in the app: Google Play Billing through @capgo/native-purchases (Play
 * Billing Library 9). Tips are consumable, consumed on the phone right after purchase; they unlock
 * nothing, so there's no server check (TIP_JAR_PLAN.md).
 */
const isTip = (id: string): id is TipProductId => (ALL_TIP_IDS as string[]).includes(id)

function cancelled(err: unknown): boolean {
  const text = String((err as { message?: string })?.message ?? err).toLowerCase()
  return text.includes('cancel')
}

const store: TipStore = {
  storeName: nativePlatform() === 'ios' ? 'the App Store' : 'Google Play',

  async prices(): Promise<TipPrice[]> {
    const { products } = await NativePurchases.getProducts({ productIdentifiers: ALL_TIP_IDS, productType: PURCHASE_TYPE.INAPP })
    return products.flatMap((p) => (isTip(p.identifier) && p.priceString ? [{ id: p.identifier, price: p.priceString }] : []))
  },

  async buy(id: TipProductId): Promise<TipOutcome> {
    try {
      const t = await NativePurchases.purchaseProduct({ productIdentifier: id, productType: PURCHASE_TYPE.INAPP, isConsumable: true })
      // "0" is a payment still clearing (cash at a shop); it's consumed when it clears, at a later start.
      return t.purchaseState === '0' ? 'pending' : 'thanked'
    } catch (err) {
      if (cancelled(err)) return 'cancelled'
      throw err
    }
  },
}

/**
 * Consumes tips that were paid but never consumed: the app closed mid-purchase, or a pending
 * payment cleared since. Google refunds a purchase that isn't consumed within 3 days.
 */
async function finishLeftovers() {
  try {
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP })
    for (const p of purchases) {
      if (p.purchaseState !== '1' || !p.purchaseToken || !isTip(p.productIdentifier)) continue
      await NativePurchases.consumePurchase({ purchaseToken: p.purchaseToken })
      recordTip(p.productIdentifier)
    }
  } catch {
    // Billing unavailable right now; next start tries again.
  }
}

/** Registers the store, if this phone can pay through it. Safe to call before the app renders. */
export async function startTipStore() {
  try {
    const { isBillingSupported } = await NativePurchases.isBillingSupported()
    if (!isBillingSupported) return
  } catch {
    return
  }
  registerTipStore(store)
  void finishLeftovers()
}
