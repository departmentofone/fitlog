import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { DietWithFoods } from '../types'
import { useAuth } from './useAuth'
import { useUpdateSettings, useUserSettings } from './useUserSettings'

/** Your own diets with their foods. Official and other people's live in Community (migration_v29). */
export function useDiets() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['diets', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diets')
        .select('*, diet_foods(diet_id, food_id, food:foods(*))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as unknown as DietWithFoods[]).filter((d) => !d.is_official)
    },
  })
}

/**
 * The diet you're following, and the set of its food ids for quick "is this on my diet?" checks
 * in food search and the meal log. Null when you aren't following one (or it was deleted).
 */
export function useActiveDiet() {
  const { data: settings } = useUserSettings()
  const { data: diets = [] } = useDiets()
  const activeId = settings?.active_diet_id ?? null
  return useMemo(() => {
    const diet = activeId ? diets.find((d) => d.id === activeId) ?? null : null
    return { diet, foodIds: new Set(diet?.diet_foods.map((f) => f.food_id) ?? []) }
  }, [activeId, diets])
}

export function useFollowDiet() {
  const update = useUpdateSettings()
  return {
    follow: (dietId: string | null) => update.mutate({ active_diet_id: dietId }),
    isPending: update.isPending,
  }
}

function useInvalidateDiets() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['diets'] })
    qc.invalidateQueries({ queryKey: ['community'] })
  }
}

export function useCreateDiet() {
  const { user } = useAuth()
  const invalidate = useInvalidateDiets()
  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string | null }) => {
      if (!user) throw new Error('Not signed in')
      const { data, error } = await supabase.from('diets').insert({ user_id: user.id, name, description }).select('id').single()
      if (error) throw error
      return data.id as string
    },
    onSuccess: invalidate,
  })
}

export function useUpdateDiet() {
  const invalidate = useInvalidateDiets()
  return useMutation({
    mutationFn: async ({ dietId, ...patch }: { dietId: string; name?: string; description?: string | null; is_shared?: boolean }) => {
      const { error } = await supabase.from('diets').update(patch).eq('id', dietId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

/** Deleting a diet also deletes its sample plans (on delete cascade) and stops following it. */
export function useDeleteDiet() {
  const qc = useQueryClient()
  const invalidate = useInvalidateDiets()
  return useMutation({
    mutationFn: async (dietId: string) => {
      const { error } = await supabase.from('diets').delete().eq('id', dietId)
      if (error) throw error
    },
    onSuccess: () => {
      invalidate()
      qc.invalidateQueries({ queryKey: ['meal-plans'] })
      qc.invalidateQueries({ queryKey: ['user-settings'] })
    },
  })
}

export function useAddDietFood() {
  const invalidate = useInvalidateDiets()
  return useMutation({
    mutationFn: async ({ dietId, foodId }: { dietId: string; foodId: string }) => {
      // Adding a food that's already on the diet is a no-op, not an error.
      const { error } = await supabase.from('diet_foods').upsert({ diet_id: dietId, food_id: foodId }, { ignoreDuplicates: true })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useRemoveDietFood() {
  const invalidate = useInvalidateDiets()
  return useMutation({
    mutationFn: async ({ dietId, foodId }: { dietId: string; foodId: string }) => {
      const { error } = await supabase.from('diet_foods').delete().eq('diet_id', dietId).eq('food_id', foodId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}
