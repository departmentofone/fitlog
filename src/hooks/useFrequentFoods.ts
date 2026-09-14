import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Food } from '../types'
import { useAuth } from './useAuth'

/** Your most-logged foods over the last ~60 days, for a quick "frequently used" shortlist. */
export function useFrequentFoods() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['frequent-foods', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Food[]> => {
      const since = new Date()
      since.setDate(since.getDate() - 60)
      const sinceISO = since.toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('meal_items')
        .select('food_id, food:foods(*), meal:meals!inner(date)')
        .gte('meal.date', sinceISO)
      if (error) throw error

      type Row = { food_id: string; food: Food | null }
      const counts = new Map<string, { food: Food; count: number }>()
      for (const row of (data as unknown as Row[]) ?? []) {
        if (!row.food) continue
        const cur = counts.get(row.food_id)
        counts.set(row.food_id, { food: row.food, count: (cur?.count ?? 0) + 1 })
      }

      return Array.from(counts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        .map((c) => c.food)
    },
  })
}
