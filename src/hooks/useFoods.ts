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

export function useCreateFood() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      name: string
      caloriesPer100g: number
      proteinPer100g: number
      carbsPer100g: number
      fatPer100g: number
      commonServings: CommonServing[]
    }) => {
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
        })
        .select()
        .single()
      if (error) throw error
      return data as Food
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foods'] }),
  })
}
