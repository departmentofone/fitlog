import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Food } from '../types'
import { useAuth } from './useAuth'
import type { MealWithItems } from './useMeals'

export interface MealPresetItem {
  id: string
  preset_id: string
  food_id: string
  grams: number
  serving_label: string | null
  /** Null when the food belongs to another user and RLS hides it - see macrosForGrams. */
  food: Food | null
}

export interface MealPreset {
  id: string
  user_id: string
  name: string
  is_shared: boolean
  created_at: string
  meal_preset_items: MealPresetItem[]
}

export function useMealPresets() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['meal-presets', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_presets')
        .select('*, meal_preset_items(*, food:foods(*))')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as MealPreset[]
    },
  })
}

export function useCreateMealPresetFromMeal() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, meal }: { name: string; meal: MealWithItems }) => {
      if (!user) throw new Error('Not signed in')
      const { data: preset, error: presetError } = await supabase
        .from('meal_presets')
        .insert({ user_id: user.id, name })
        .select()
        .single()
      if (presetError) throw presetError

      const items = meal.meal_items.map((i) => ({
        preset_id: preset.id,
        food_id: i.food_id,
        grams: i.grams,
        serving_label: i.serving_label,
      }))
      if (items.length > 0) {
        const { error: itemsError } = await supabase.from('meal_preset_items').insert(items)
        if (itemsError) throw itemsError
      }
      return preset
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-presets', user?.id] }),
  })
}

/** Creates a preset with no items yet - the Foods tab's "add to preset" flow fills it in afterward. */
export function useCreateMealPreset() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Not signed in')
      const { data, error } = await supabase.from('meal_presets').insert({ user_id: user.id, name }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-presets', user?.id] }),
  })
}

export function useRenameMealPreset() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ presetId, name }: { presetId: string; name: string }) => {
      const { error } = await supabase.from('meal_presets').update({ name }).eq('id', presetId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-presets', user?.id] }),
  })
}

/** Adds one food into an existing preset - the Foods tab's "add to preset" action. */
export function useAddMealPresetItem() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { presetId: string; foodId: string; grams: number; servingLabel: string | null }) => {
      const { error } = await supabase.from('meal_preset_items').insert({
        preset_id: input.presetId,
        food_id: input.foodId,
        grams: input.grams,
        serving_label: input.servingLabel,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-presets', user?.id] }),
  })
}

export function useRemoveMealPresetItem() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('meal_preset_items').delete().eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-presets', user?.id] }),
  })
}

export function useSetMealPresetShared() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ presetId, isShared }: { presetId: string; isShared: boolean }) => {
      const { error } = await supabase.from('meal_presets').update({ is_shared: isShared }).eq('id', presetId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-presets', user?.id] }),
  })
}

export function useDeleteMealPreset() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (presetId: string) => {
      const { error } = await supabase.from('meal_presets').delete().eq('id', presetId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-presets', user?.id] }),
  })
}

/** Recreates a deleted meal preset from its last-known snapshot, for the undo toast. */
export function useRestoreMealPreset() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (preset: MealPreset) => {
      if (!user) throw new Error('Not signed in')
      const { data: created, error: presetError } = await supabase
        .from('meal_presets')
        .insert({ user_id: user.id, name: preset.name, is_shared: preset.is_shared })
        .select()
        .single()
      if (presetError) throw presetError

      const items = preset.meal_preset_items.map((i) => ({
        preset_id: created.id,
        food_id: i.food_id,
        grams: i.grams,
        serving_label: i.serving_label,
      }))
      if (items.length > 0) {
        const { error: itemsError } = await supabase.from('meal_preset_items').insert(items)
        if (itemsError) throw itemsError
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-presets', user?.id] }),
  })
}

/** Loads a meal preset as a new meal on the given date. */
export function useLoadMealPreset() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ preset, date }: { preset: MealPreset; date: string }) => {
      if (!user) throw new Error('Not signed in')
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({ user_id: user.id, date, name: preset.name })
        .select()
        .single()
      if (mealError) throw mealError

      const items = preset.meal_preset_items.map((i) => ({
        meal_id: meal.id,
        food_id: i.food_id,
        grams: i.grams,
        serving_label: i.serving_label,
      }))
      if (items.length > 0) {
        const { error: itemsError } = await supabase.from('meal_items').insert(items)
        if (itemsError) throw itemsError
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }),
  })
}
