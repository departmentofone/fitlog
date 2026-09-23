import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { MealPlanWithItems } from '../types'
import { useAuth } from './useAuth'

/** Your own meal plans (including your diets' sample plans). Others' are in Community. */
export function useMealPlans() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['meal-plans', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*, meal_plan_items(*, food:foods(*))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as unknown as MealPlanWithItems[]).filter((p) => !p.is_official)
    },
  })
}

function useInvalidatePlans() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['meal-plans'] })
    qc.invalidateQueries({ queryKey: ['community'] })
  }
}

export function useCreateMealPlan() {
  const { user } = useAuth()
  const invalidate = useInvalidatePlans()
  return useMutation({
    mutationFn: async ({ name, dietId = null }: { name: string; dietId?: string | null }) => {
      if (!user) throw new Error('Not signed in')
      const { data, error } = await supabase.from('meal_plans').insert({ user_id: user.id, name, days: 1, diet_id: dietId }).select('id').single()
      if (error) throw error
      return data.id as string
    },
    onSuccess: invalidate,
  })
}

export function useUpdateMealPlan() {
  const invalidate = useInvalidatePlans()
  return useMutation({
    mutationFn: async ({ planId, ...patch }: { planId: string; name?: string; is_shared?: boolean }) => {
      const { error } = await supabase.from('meal_plans').update(patch).eq('id', planId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useDeleteMealPlan() {
  const invalidate = useInvalidatePlans()
  return useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase.from('meal_plans').delete().eq('id', planId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

/** Recreates a deleted plan from its snapshot, for the undo toast. */
export function useRestoreMealPlan() {
  const { user } = useAuth()
  const invalidate = useInvalidatePlans()
  return useMutation({
    mutationFn: async (plan: MealPlanWithItems) => {
      if (!user) throw new Error('Not signed in')
      const { data, error } = await supabase
        .from('meal_plans')
        .insert({ user_id: user.id, name: plan.name, description: plan.description, days: plan.days, diet_id: plan.diet_id, is_shared: plan.is_shared, source_id: plan.source_id ?? null })
        .select('id')
        .single()
      if (error) throw error
      const rows = plan.meal_plan_items.map(({ day_index, meal_name, meal_order, item_order, food_id, grams, serving_label }) => ({
        plan_id: data.id, day_index, meal_name, meal_order, item_order, food_id, grams, serving_label,
      }))
      if (rows.length > 0) {
        const { error: itemsError } = await supabase.from('meal_plan_items').insert(rows)
        if (itemsError) throw itemsError
      }
    },
    onSuccess: invalidate,
  })
}

export interface NewPlanItem {
  planId: string
  dayIndex: number
  mealName: string
  mealOrder: number
  itemOrder: number
  foodId: string
  grams: number
  servingLabel: string | null
}

export function useAddMealPlanItem() {
  const invalidate = useInvalidatePlans()
  return useMutation({
    mutationFn: async (i: NewPlanItem) => {
      const { error } = await supabase.from('meal_plan_items').insert({
        plan_id: i.planId, day_index: i.dayIndex, meal_name: i.mealName, meal_order: i.mealOrder,
        item_order: i.itemOrder, food_id: i.foodId, grams: i.grams, serving_label: i.servingLabel,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useRemoveMealPlanItem() {
  const invalidate = useInvalidatePlans()
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('meal_plan_items').delete().eq('id', itemId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

/**
 * Combines up to 7 one-day plans, in the order given, into a new week plan. The originals are
 * left alone - this makes a copy, so each day can still be edited or used on its own.
 */
export function useCombineIntoWeek() {
  const { user } = useAuth()
  const invalidate = useInvalidatePlans()
  return useMutation({
    mutationFn: async ({ name, plans }: { name: string; plans: MealPlanWithItems[] }) => {
      if (!user) throw new Error('Not signed in')
      if (plans.length < 2 || plans.length > 7) throw new Error('Pick 2 to 7 day plans')
      const { data, error } = await supabase.from('meal_plans').insert({ user_id: user.id, name, days: plans.length }).select('id').single()
      if (error) throw error
      const rows = plans.flatMap((p, dayIndex) =>
        p.meal_plan_items
          .filter((i) => i.day_index === 0)
          .map(({ meal_name, meal_order, item_order, food_id, grams, serving_label }) => ({
            plan_id: data.id, day_index: dayIndex, meal_name, meal_order, item_order, food_id, grams, serving_label,
          })),
      )
      if (rows.length > 0) {
        const { error: itemsError } = await supabase.from('meal_plan_items').insert(rows)
        if (itemsError) throw itemsError
      }
      return data.id as string
    },
    onSuccess: invalidate,
  })
}

/**
 * Logs one day of a plan onto a date: each plan meal goes into that day's meal with the same
 * name (e.g. your existing "Breakfast") or a new one, so nothing is duplicated. Returns how many
 * foods were added.
 */
export function useLogPlanDay() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ plan, dayIndex, date }: { plan: MealPlanWithItems; dayIndex: number; date: string }) => {
      if (!user) throw new Error('Not signed in')
      const items = plan.meal_plan_items.filter((i) => i.day_index === dayIndex && i.food)
      const { data: existing, error: existingError } = await supabase.from('meals').select('id, name').eq('date', date)
      if (existingError) throw existingError
      const mealIdByName = new Map((existing ?? []).map((m) => [m.name.trim().toLowerCase(), m.id as string]))

      const mealNames = [...new Set([...items].sort((a, b) => a.meal_order - b.meal_order).map((i) => i.meal_name))]
      for (const name of mealNames) {
        if (mealIdByName.has(name.trim().toLowerCase())) continue
        const { data, error } = await supabase.from('meals').insert({ user_id: user.id, date, name }).select('id').single()
        if (error) throw error
        mealIdByName.set(name.trim().toLowerCase(), data.id)
      }

      const rows = [...items]
        .sort((a, b) => a.meal_order - b.meal_order || a.item_order - b.item_order)
        .map((i) => ({ meal_id: mealIdByName.get(i.meal_name.trim().toLowerCase())!, food_id: i.food_id, grams: i.grams, serving_label: i.serving_label }))
      if (rows.length > 0) {
        const { error } = await supabase.from('meal_items').insert(rows)
        if (error) throw error
      }
      return rows.length
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }),
  })
}
