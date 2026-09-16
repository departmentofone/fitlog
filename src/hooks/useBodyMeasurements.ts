import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface BodyMeasurement {
  id: string
  user_id: string
  date: string
  waist_cm: number | null
  chest_cm: number | null
  arms_cm: number | null
  hips_cm: number | null
  created_at: string
}

export type BodyMeasurementInput = {
  date: string
  waist_cm: number | null
  chest_cm: number | null
  arms_cm: number | null
  hips_cm: number | null
}

export function useBodyMeasurements() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['body-measurements', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<BodyMeasurement[]> => {
      const { data, error } = await supabase.from('body_measurements').select('*').order('date', { ascending: false })
      // body_measurements may not exist yet on a database that hasn't run migration_v16 -
      // degrade to "no measurements" rather than breaking the whole Goals tab.
      if (error) return []
      return (data ?? []) as BodyMeasurement[]
    },
  })
}

export function useUpsertBodyMeasurement() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: BodyMeasurementInput) => {
      if (!user) throw new Error('Not signed in')
      const { error } = await supabase
        .from('body_measurements')
        .upsert(
          {
            user_id: user.id,
            date: input.date,
            waist_cm: input.waist_cm,
            chest_cm: input.chest_cm,
            arms_cm: input.arms_cm,
            hips_cm: input.hips_cm,
          },
          { onConflict: 'user_id,date' },
        )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['body-measurements', user?.id] }),
  })
}

export function useDeleteBodyMeasurement() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('body_measurements').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['body-measurements', user?.id] }),
  })
}
