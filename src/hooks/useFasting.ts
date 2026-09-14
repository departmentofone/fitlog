import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface FastingSession {
  id: string
  user_id: string
  start_time: string
  end_time: string | null
  target_hours: number
  created_at: string
}

export function useActiveFast() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['active-fast', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fasting_sessions')
        .select('*')
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as FastingSession | null
    },
  })
}

export function useFastHistory() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['fast-history', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fasting_sessions')
        .select('*')
        .not('end_time', 'is', null)
        .order('start_time', { ascending: false })
        .limit(10)
      if (error) throw error
      return data as FastingSession[]
    },
  })
}

export function useStartFast() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (targetHours: number) => {
      if (!user) throw new Error('Not signed in')
      const { error } = await supabase
        .from('fasting_sessions')
        .insert({ user_id: user.id, start_time: new Date().toISOString(), target_hours: targetHours })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['active-fast', user?.id] }),
  })
}

export function useEndFast() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (fastId: string) => {
      const { error } = await supabase.from('fasting_sessions').update({ end_time: new Date().toISOString() }).eq('id', fastId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-fast', user?.id] })
      qc.invalidateQueries({ queryKey: ['fast-history', user?.id] })
    },
  })
}
