import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { todayISO } from './useWorkouts'

export function useTodayWater() {
  const { user } = useAuth()
  const date = todayISO()
  return useQuery({
    queryKey: ['water', user?.id, date],
    enabled: !!user,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('water_logs')
        .select('ml')
        .eq('date', date)
        .maybeSingle()
      if (error) throw error
      return data?.ml ?? 0
    },
  })
}

export function useAddWater() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const date = todayISO()
  return useMutation({
    mutationFn: async (deltaMl: number) => {
      if (!user) throw new Error('Not signed in')
      const current = qc.getQueryData<number>(['water', user.id, date]) ?? 0
      const next = Math.max(0, current + deltaMl)
      const { error } = await supabase
        .from('water_logs')
        .upsert({ user_id: user.id, date, ml: next }, { onConflict: 'user_id,date' })
      if (error) throw error
      return next
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['water', user?.id, date] }),
  })
}
