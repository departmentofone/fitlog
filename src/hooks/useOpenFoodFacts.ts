import { useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Food } from '../types'

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

function foodToProduct(food: Food): OpenFoodFactsProduct {
  return {
    name: food.name,
    caloriesPer100g: food.calories_per_100g,
    proteinPer100g: food.protein_per_100g,
    carbsPer100g: food.carbs_per_100g,
    fatPer100g: food.fat_per_100g,
  }
}

/**
 * Looks up a barcode against the user's own food library first, falling back to
 * {@link lookupBarcode}'s Open Food Facts network call only when there's no local match. A hit
 * is instant and avoids the network entirely.
 *
 * The `foods.barcode` column (migration_v17b_food_barcode.sql) may not exist yet on a database
 * that hasn't been migrated — the `.eq('barcode', ...)` filter would error in that case. That's
 * treated exactly like a cache miss so this never breaks scanning, it just always falls through
 * to the network until the migration runs.
 */
export async function lookupBarcodeCached(barcode: string): Promise<OpenFoodFactsProduct | null> {
  const trimmed = barcode.trim()
  if (!trimmed) return null
  try {
    const { data, error } = await supabase.from('foods').select('*').eq('barcode', trimmed).maybeSingle()
    if (!error && data) return foodToProduct(data as Food)
  } catch {
    // Supabase call failed outright (missing column, offline, etc.) - fall through to the network.
  }
  return lookupBarcode(trimmed)
}

/** React Query wrapper around {@link lookupBarcodeCached} for use from components. */
export function useBarcodeLookup() {
  return useMutation({
    mutationFn: lookupBarcodeCached,
  })
}
