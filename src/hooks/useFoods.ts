import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { CommonServing, Food } from '../types'
import { useAuth } from './useAuth'

export function useFoodSearch(search: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['foods', search],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase.from('foods').select('*').order('name', { ascending: true }).limit(50)
      if (search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`)
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
        })
        .select()
        .single()
      if (error) throw error
      return data as Food
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foods'] }),
  })
}
