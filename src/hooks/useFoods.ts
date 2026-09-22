import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { rankFoods } from '../lib/foodSearch'
import { supabase } from '../lib/supabase'
import type { CommonServing, Food } from '../types'
import { useAuth } from './useAuth'
import { useUserSettings } from './useUserSettings'

const LIBRARY_PAGE = 1000

/**
 * The whole food library this account can read (global foods + its own + ones in shared content).
 * It's a few hundred rows, so it's fetched once and searched on the device: results appear on every
 * keystroke with no network round trip, work offline, and can be ranked properly (see foodSearch.ts)
 * instead of the old alphabetical `ilike` top-50, which put "Egg, whole" fifth for "egg".
 */
export function useFoodLibrary() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['foods', 'library', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const all: Food[] = []
      // PostgREST caps a response at 1000 rows, so page until a short page comes back.
      for (let from = 0; ; from += LIBRARY_PAGE) {
        const { data, error } = await supabase
          .from('foods')
          .select('*')
          .order('name', { ascending: true })
          .range(from, from + LIBRARY_PAGE - 1)
        if (error) throw error
        all.push(...(data as Food[]))
        if (!data || data.length < LIBRARY_PAGE) return all
      }
    },
  })
}

/**
 * Ranked matches for `search`: the plain ingredient first, processed products last. Shared-library
 * foods (`user_id` null) in a pack the account hasn't turned on (see the Foods tab) are left out
 * entirely - this is what actually keeps them out of everyday search, not just out of the default
 * list. A `pack` value on a food you own is just your own label and never hides it from you.
 */
export function useFoodSearch(search: string) {
  const library = useFoodLibrary()
  const { data: settings } = useUserSettings()
  const enabledPacks = settings?.enabled_food_packs ?? []
  const data = useMemo(() => {
    if (!library.data) return undefined
    const visible = library.data.filter((f) => f.user_id || !f.pack || enabledPacks.includes(f.pack))
    return rankFoods(visible, search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [library.data, search, enabledPacks.join(',')])
  return { data, isLoading: library.isLoading, error: library.error }
}

export interface CreateFoodInput {
  name: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  commonServings: CommonServing[]
  fiberG?: number
  sugarG?: number
  sodiumMg?: number
  cholesterolMg?: number
  potassiumMg?: number
  calciumMg?: number
  ironMg?: number
  vitaminCMg?: number
  vitaminAMcg?: number
  /**
   * Only set by the barcode scanner. Left undefined (rather than null) for every other
   * caller so the insert payload below omits the `barcode` key entirely for them - that
   * keeps normal food creation working even on a database that hasn't run
   * migration_v17b_food_barcode.sql yet, since the column simply won't be referenced.
   */
  barcode?: string
}

export function useCreateFood() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateFoodInput) => {
      if (!user) throw new Error('Not signed in')
      const { data, error } = await supabase
        .from('foods')
        .insert({
          user_id: user.id,
          name: input.name,
          calories_per_100g: input.caloriesPer100g,
          protein_per_100g: input.proteinPer100g,
          carbs_per_100g: input.carbsPer100g,
          fat_per_100g: input.fatPer100g,
          common_servings: input.commonServings,
          fiber_g: input.fiberG ?? 0,
          sugar_g: input.sugarG ?? 0,
          sodium_mg: input.sodiumMg ?? 0,
          cholesterol_mg: input.cholesterolMg ?? 0,
          potassium_mg: input.potassiumMg ?? 0,
          calcium_mg: input.calciumMg ?? 0,
          iron_mg: input.ironMg ?? 0,
          vitamin_c_mg: input.vitaminCMg ?? 0,
          vitamin_a_mcg: input.vitaminAMcg ?? 0,
          // Omitted entirely (not sent as null) unless the caller passed one - see the
          // comment on CreateFoodInput.barcode.
          ...(input.barcode !== undefined ? { barcode: input.barcode } : {}),
        })
        .select()
        .single()
      if (error) throw error
      return data as Food
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foods'] }),
  })
}

export type UpdateFoodInput = CreateFoodInput & { id: string }

/** Edits a food you own. RLS blocks this for the shared library and other accounts' foods. */
export function useUpdateFood() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateFoodInput) => {
      const { data, error } = await supabase
        .from('foods')
        .update({
          name: input.name,
          calories_per_100g: input.caloriesPer100g,
          protein_per_100g: input.proteinPer100g,
          carbs_per_100g: input.carbsPer100g,
          fat_per_100g: input.fatPer100g,
          common_servings: input.commonServings,
          fiber_g: input.fiberG ?? 0,
          sugar_g: input.sugarG ?? 0,
          sodium_mg: input.sodiumMg ?? 0,
          cholesterol_mg: input.cholesterolMg ?? 0,
          potassium_mg: input.potassiumMg ?? 0,
          calcium_mg: input.calciumMg ?? 0,
          iron_mg: input.ironMg ?? 0,
          vitamin_c_mg: input.vitaminCMg ?? 0,
          vitamin_a_mcg: input.vitaminAMcg ?? 0,
        })
        .eq('id', input.id)
        .select()
        .single()
      if (error) throw error
      return data as Food
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foods'] }),
  })
}

/**
 * Deletes a food you own. Blocked by the database (`on delete restrict`) if anything still
 * references it - a logged meal, a recipe ingredient, or a preset item - so the caller finds
 * out via the thrown error rather than silently corrupting old logs.
 */
export function useDeleteFood() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('foods').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foods'] }),
  })
}
