import { useMutation } from '@tanstack/react-query'

export interface OpenFoodFactsProduct {
  name: string
  caloriesPer100g: number | null
  proteinPer100g: number | null
  carbsPer100g: number | null
  fatPer100g: number | null
}

interface OpenFoodFactsNutriments {
  'energy-kcal_100g'?: number
  proteins_100g?: number
  carbohydrates_100g?: number
  fat_100g?: number
}

interface OpenFoodFactsResponse {
  status?: number
  product?: {
    product_name?: string
    nutriments?: OpenFoodFactsNutriments
  }
}

function numberOrNull(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/**
 * Looks up a packaged food by barcode against the free Open Food Facts
 * database (no API key required). Resolves to `null` — never throws — when
 * the product isn't found, the barcode is empty, or the request fails for
 * any reason, so callers can always fall back to manual entry.
 */
export async function lookupBarcode(barcode: string): Promise<OpenFoodFactsProduct | null> {
  const trimmed = barcode.trim()
  if (!trimmed) return null
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(trimmed)}.json`)
    if (!res.ok) return null
    const data = (await res.json()) as OpenFoodFactsResponse
    if (data.status !== 1 || !data.product) return null
    const n = data.product.nutriments ?? {}
    return {
      name: data.product.product_name?.trim() ?? '',
      caloriesPer100g: numberOrNull(n['energy-kcal_100g']),
      proteinPer100g: numberOrNull(n.proteins_100g),
      carbsPer100g: numberOrNull(n.carbohydrates_100g),
      fatPer100g: numberOrNull(n.fat_100g),
    }
  } catch {
    return null
  }
}

/** React Query wrapper around {@link lookupBarcode} for use from components. */
export function useBarcodeLookup() {
  return useMutation({
    mutationFn: lookupBarcode,
  })
}
