import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { maybeSingleMock } = vi.hoisted(() => ({ maybeSingleMock: vi.fn() }))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: maybeSingleMock,
        }),
      }),
    }),
  },
}))

import { lookupBarcode, lookupBarcodeCached } from './useOpenFoodFacts'

function mockFetchOnce(response: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(response) } as Response),
  )
}

beforeEach(() => {
  maybeSingleMock.mockReset()
})

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

describe('lookupBarcodeCached', () => {
  it('returns null for an empty barcode without touching Supabase or the network', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    expect(await lookupBarcodeCached('   ')).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(maybeSingleMock).not.toHaveBeenCalled()
  })

  it('returns a locally-cached food from Supabase without calling the network', async () => {
    maybeSingleMock.mockResolvedValue({
      data: {
        name: 'Cached Snack',
        calories_per_100g: 200,
        protein_per_100g: 10,
        carbs_per_100g: 20,
        fat_per_100g: 5,
      },
      error: null,
    })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    expect(await lookupBarcodeCached('111')).toEqual({
      name: 'Cached Snack',
      caloriesPer100g: 200,
      proteinPer100g: 10,
      carbsPer100g: 20,
      fatPer100g: 5,
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('falls back to the network when there is no cached match', async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null })
    mockFetchOnce({
      status: 1,
      product: { product_name: 'Fresh Lookup', nutriments: { 'energy-kcal_100g': 100 } },
    })

    const result = await lookupBarcodeCached('222')
    expect(result?.name).toBe('Fresh Lookup')
  })

  it('falls back to the network when the Supabase lookup errors (e.g. barcode column missing)', async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: 'column foods.barcode does not exist' } })
    mockFetchOnce({
      status: 1,
      product: { product_name: 'Fresh Lookup Two', nutriments: {} },
    })

    const result = await lookupBarcodeCached('333')
    expect(result?.name).toBe('Fresh Lookup Two')
  })

  it('falls back to the network when the Supabase call itself throws', async () => {
    maybeSingleMock.mockRejectedValue(new Error('offline'))
    mockFetchOnce({ status: 0 })

    expect(await lookupBarcodeCached('444')).toBeNull()
  })
})
