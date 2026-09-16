import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useRestDays() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['rest-days', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from('rest_days').select('date')
      if (error) throw error
      return (data ?? []).map((r) => r.date as string)
    },
  })
}

export function useLogRestDay() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (date: string) => {
      if (!user) throw new Error('Not signed in')
      const { error } = await supabase.from('rest_days').upsert({ user_id: user.id, date }, { onConflict: 'user_id,date' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rest-days'] })
      qc.invalidateQueries({ queryKey: ['workout-streaks'] })
    },
  })
}

export function useDeleteRestDay() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (date: string) => {
      if (!user) throw new Error('Not signed in')
      const { error } = await supabase.from('rest_days').delete().eq('user_id', user.id).eq('date', date)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rest-days'] })
      qc.invalidateQueries({ queryKey: ['workout-streaks'] })
    },
  })
}
