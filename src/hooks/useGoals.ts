import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Goal, GoalCategory } from '../types'
import { useAuth } from './useAuth'

export function useGoals() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['goals', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('completed', { ascending: true })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Goal[]
    },
  })
}

export function useCreateGoal() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { category: GoalCategory; title: string; targetDate?: string | null }) => {
      if (!user) throw new Error('Not signed in')
      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        category: input.category,
        title: input.title,
        target_date: input.targetDate ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', user?.id] }),
  })
}

export function useToggleGoal() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from('goals').update({ completed }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', user?.id] }),
  })
}

export function useDeleteGoal() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', user?.id] }),
  })
}
