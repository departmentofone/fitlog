import { afterEach, describe, expect, it, vi } from 'vitest'
import { lookupBarcode } from './useOpenFoodFacts'

function mockFetchOnce(response: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(response) } as Response),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('lookupBarcode', () => {
  it('returns null for an empty barcode without making a request', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    expect(await lookupBarcode('  ')).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('parses a found product into per-100g macros', async () => {
    mockFetchOnce({
      status: 1,
      product: {
        product_name: 'Nutella',
        nutriments: {
          'energy-kcal_100g': 539,
          proteins_100g: 6.3,
          carbohydrates_100g: 57.5,
          fat_100g: 30.9,
        },
      },
    })
    expect(await lookupBarcode('3017620422003')).toEqual({
      name: 'Nutella',
      caloriesPer100g: 539,
      proteinPer100g: 6.3,
      carbsPer100g: 57.5,
      fatPer100g: 30.9,
    })
  })

  it('returns null when Open Food Facts has no match (status 0)', async () => {
    mockFetchOnce({ status: 0 })
    expect(await lookupBarcode('0000000000000')).toBeNull()
  })

  it('returns null on an HTTP error instead of throwing', async () => {
    mockFetchOnce({}, false)
    expect(await lookupBarcode('123')).toBeNull()
  })

  it('returns null on a network failure instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(lookupBarcode('123')).resolves.toBeNull()
  })

  it('fills missing nutriment fields with null rather than NaN/undefined', async () => {
    mockFetchOnce({ status: 1, product: { product_name: 'Mystery Snack', nutriments: {} } })
    expect(await lookupBarcode('999')).toEqual({
      name: 'Mystery Snack',
      caloriesPer100g: null,
      proteinPer100g: null,
      carbsPer100g: null,
      fatPer100g: null,
    })
  })
})
