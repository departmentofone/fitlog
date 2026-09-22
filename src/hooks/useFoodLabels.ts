import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { FoodLabel } from '../types'
import { useAuth } from './useAuth'

/**
 * All of this account's food labels, in one query rather than one per food - the Foods tab lists
 * a few hundred rows, so N+1 would mean a few hundred requests. `byFood` groups them for lookup;
 * `allLabels` is the distinct set for the filter-chip row.
 */
export function useFoodLabels() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['food-labels', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('food_labels').select('*').order('label', { ascending: true })
      if (error) throw error
      return data as FoodLabel[]
    },
  })

  const byFood = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const l of query.data ?? []) map.set(l.food_id, [...(map.get(l.food_id) ?? []), l.label])
    return map
  }, [query.data])

  const allLabels = useMemo(() => Array.from(new Set((query.data ?? []).map((l) => l.label))).sort(), [query.data])

  return { ...query, byFood, allLabels }
}

export function useAddFoodLabel() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ foodId, label }: { foodId: string; label: string }) => {
      if (!user) throw new Error('Not signed in')
      const trimmed = label.trim()
      if (!trimmed) return
      // Adding a label that's already there is a silent no-op, not an error - the unique
      // constraint exists to prevent duplicates, not to make re-adding one a failure case.
      const { error } = await supabase.from('food_labels').upsert(
        { user_id: user.id, food_id: foodId, label: trimmed },
        { onConflict: 'user_id,food_id,label', ignoreDuplicates: true },
      )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['food-labels'] }),
  })
}

export function useRemoveFoodLabel() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ foodId, label }: { foodId: string; label: string }) => {
      if (!user) throw new Error('Not signed in')
      const { error } = await supabase.from('food_labels').delete().eq('user_id', user.id).eq('food_id', foodId).eq('label', label)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['food-labels'] }),
  })
}
