import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { UserSettings } from '../types'
import { useAuth } from './useAuth'

export const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id' | 'updated_at'> = {
  ask_preworkout: true,
  diet_goal: 'deficit',
  calorie_goal: null,
  water_goal_ml: 2000,
  weight_goal: null,
  current_weight: null,
  height_cm: null,
  age: null,
  sex: null,
  activity_level: null,
  unit_system: 'metric',
  theme: 'system',
  color_palette: 'emerald',
  haptics_enabled: true,
  bottom_nav_tabs: [],
}

export function useUserSettings() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['user-settings', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<UserSettings> => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (error) throw error
      if (data) return data as UserSettings
      return { user_id: user!.id, updated_at: new Date().toISOString(), ...DEFAULT_SETTINGS }
    },
  })
}

export function useUpdateSettings() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Omit<UserSettings, 'user_id' | 'updated_at'>>) => {
      if (!user) throw new Error('Not signed in')
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-settings', user?.id] }),
  })
}
