import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { CommonServing, Food } from '../types'
import { useAuth } from './useAuth'

/** Delays reacting to a fast-changing value (e.g. keystrokes) until it settles for `delayMs`. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

export function useFoodSearch(search: string) {
  const { user } = useAuth()
  const debouncedSearch = useDebouncedValue(search, 300)
  return useQuery({
    queryKey: ['foods', debouncedSearch],
    enabled: !!user,
    placeholderData: (previous) => previous,
    queryFn: async () => {
      let query = supabase.from('foods').select('*').order('name', { ascending: true }).limit(50)
      if (debouncedSearch.trim()) {
        query = query.ilike('name', `%${debouncedSearch.trim()}%`)
      }
      const { data, error } = await query
      if (error) throw error
      return data as Food[]
    },
  })
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
