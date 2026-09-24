import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { UserSettings } from '../types'
import { useAuth } from './useAuth'

export const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id' | 'updated_at'> = {
  ask_preworkout: false,
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
  health_data_consent_at: null,
  enabled_food_packs: [],
  active_diet_id: null,
  community_guidelines_accepted_at: null,
  hidden_community_users: [],
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
  const queryKey = ['user-settings', user?.id]
  return useMutation({
    // Settings writes run one at a time, in tap order - otherwise two quick toggles race and the
    // later-arriving request can overwrite the newer choice.
    scope: { id: 'user-settings' },
    // Optimistic: the UI (and the next tap) sees the change immediately, instead of computing the
    // next value from stale data while the previous save is still in flight.
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey })
      const previous = qc.getQueryData<UserSettings>(queryKey)
      if (previous) qc.setQueryData<UserSettings>(queryKey, { ...previous, ...patch })
      return { previous }
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous)
    },
    mutationFn: async (patch: Partial<Omit<UserSettings, 'user_id' | 'updated_at'>>) => {
      if (!user) throw new Error('Not signed in')
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (error) throw error
    },
    onSettled: () => {
      // Refetch once the last queued settings write has finished, not after each one.
      if (qc.isMutating({ predicate: (m) => m.options.scope?.id === 'user-settings' }) <= 1) {
        qc.invalidateQueries({ queryKey })
      }
    },
  })
}

let timezoneSyncedFor: string | null = null

/**
 * Keeps user_settings.timezone matching the phone, so the times every set, meal and food is logged
 * at (created_at, stored in UTC) can later be read in local time for stats. Only writes when the
 * column exists (migration_v30) and the saved value differs, so it's one write per device/time zone.
 */
export function useSyncTimezone() {
  const { data: settings } = useUserSettings()
  const updateSettings = useUpdateSettings()
  const saved = settings && 'timezone' in settings ? (settings.timezone ?? '') : undefined
  useEffect(() => {
    if (saved === undefined) return
    let zone = ''
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
    } catch {
      return
    }
    // Once per app session: if the save fails (offline, column missing) the refetch would bring back
    // the old value and retry forever otherwise.
    if (zone && zone !== saved && timezoneSyncedFor !== zone) {
      timezoneSyncedFor = zone
      updateSettings.mutate({ timezone: zone })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved])
}
