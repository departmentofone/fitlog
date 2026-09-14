import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface AlcoholLog {
  id: string
  user_id: string
  date: string
  name: string
  volume_ml: number | null
  abv_percent: number | null
  calories: number
  created_at: string
}

export function useAlcoholLogsForDate(date: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['alcohol-logs', user?.id, date],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('alcohol_logs').select('*').eq('date', date).order('created_at')
      if (error) throw error
      return data as AlcoholLog[]
    },
  })
}

export function useAddAlcoholLog() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { date: string; name: string; volumeMl: number | null; abvPercent: number | null; calories: number }) => {
      if (!user) throw new Error('Not signed in')
      const { error } = await supabase.from('alcohol_logs').insert({
        user_id: user.id,
        date: input.date,
        name: input.name,
        volume_ml: input.volumeMl,
        abv_percent: input.abvPercent,
        calories: input.calories,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alcohol-logs'] }),
  })
}

export function useDeleteAlcoholLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('alcohol_logs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alcohol-logs'] }),
  })
}

/** Ethanol density ~0.789 g/mL, 7 kcal per gram of alcohol. */
export function estimateAlcoholCalories(volumeMl: number, abvPercent: number): number {
  const grams = volumeMl * (abvPercent / 100) * 0.789
  return Math.round(grams * 7)
}
