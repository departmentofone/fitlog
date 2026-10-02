// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

const purchases = vi.hoisted(() => ({
  isBillingSupported: vi.fn(),
  getProducts: vi.fn(),
  purchaseProduct: vi.fn(),
  getPurchases: vi.fn(),
  consumePurchase: vi.fn(),
}))
vi.mock('@capgo/native-purchases', () => ({ NativePurchases: purchases, PURCHASE_TYPE: { INAPP: 'inapp' } }))
vi.mock('../lib/platform', () => ({ nativePlatform: () => 'android' }))

const { startTipStore } = await import('./tipStore')
const { registerTipStore, tipStore, kcalFed } = await import('../lib/tipJar')

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  registerTipStore(null)
  purchases.isBillingSupported.mockResolvedValue({ isBillingSupported: true })
  purchases.getPurchases.mockResolvedValue({ purchases: [] })
})

describe('tip store (Google Play)', () => {
  it('registers only where billing works', async () => {
    purchases.isBillingSupported.mockResolvedValue({ isBillingSupported: false })
    await startTipStore()
    expect(tipStore()).toBeNull()
    purchases.isBillingSupported.mockResolvedValue({ isBillingSupported: true })
    await startTipStore()
    expect(tipStore()?.storeName).toBe('Google Play')
  })

  it('returns prices for tip products only', async () => {
    await startTipStore()
    purchases.getProducts.mockResolvedValue({
      products: [
        { identifier: 'tip_tier_2', priceString: 'RSD 500' },
        { identifier: 'something_else', priceString: '$1' },
        { identifier: 'tip_custom_7', priceString: 'RSD 700' },
      ],
    })
    expect(await tipStore()!.prices()).toEqual([
      { id: 'tip_tier_2', price: 'RSD 500' },
      { id: 'tip_custom_7', price: 'RSD 700' },
    ])
  })

  it('buys consumables and reports thanks, pending and cancel', async () => {
    await startTipStore()
    purchases.purchaseProduct.mockResolvedValueOnce({ purchaseState: '1' })
    expect(await tipStore()!.buy('tip_tier_1')).toBe('thanked')
    expect(purchases.purchaseProduct).toHaveBeenCalledWith({ productIdentifier: 'tip_tier_1', productType: 'inapp', isConsumable: true })
    purchases.purchaseProduct.mockResolvedValueOnce({ purchaseState: '0' })
    expect(await tipStore()!.buy('tip_tier_1')).toBe('pending')
    purchases.purchaseProduct.mockRejectedValueOnce(new Error('User cancelled the purchase'))
    expect(await tipStore()!.buy('tip_tier_1')).toBe('cancelled')
    purchases.purchaseProduct.mockRejectedValueOnce(new Error('Billing unavailable'))
    await expect(tipStore()!.buy('tip_tier_1')).rejects.toThrow()
  })

  it('consumes and counts tips left unfinished, and only tips', async () => {
    purchases.getPurchases.mockResolvedValue({
      purchases: [
        { productIdentifier: 'tip_tier_3', purchaseState: '1', purchaseToken: 't1' },
        { productIdentifier: 'tip_tier_3', purchaseState: '0', purchaseToken: 't2' },
        { productIdentifier: 'not_a_tip', purchaseState: '1', purchaseToken: 't3' },
      ],
    })
    await startTipStore()
    await vi.waitFor(() => expect(purchases.consumePurchase).toHaveBeenCalledTimes(1))
    expect(purchases.consumePurchase).toHaveBeenCalledWith({ purchaseToken: 't1' })
    await vi.waitFor(() => expect(kcalFed()).toBe(650))
  })
})
