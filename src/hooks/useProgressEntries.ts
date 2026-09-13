import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ProgressEntry } from '../types'
import { useAuth } from './useAuth'

const BUCKET = 'progress-photos'

export function useProgressEntries() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['progress-entries', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('progress_entries').select('*').order('date', { ascending: false })
      if (error) throw error
      return data as ProgressEntry[]
    },
  })
}

export function useUpsertProgressEntry() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { date: string; weight: number | null; notes: string | null }) => {
      if (!user) throw new Error('Not signed in')
      const { error } = await supabase
        .from('progress_entries')
        .upsert(
          { user_id: user.id, date: input.date, weight: input.weight, notes: input.notes },
          { onConflict: 'user_id,date' },
        )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress-entries', user?.id] }),
  })
}

export function useUploadProgressPhoto() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ date, file, previousPath }: { date: string; file: File; previousPath?: string | null }) => {
      if (!user) throw new Error('Not signed in')
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/${date}.${ext}`

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      if (previousPath && previousPath !== path) {
        await supabase.storage.from(BUCKET).remove([previousPath])
      }

      const { error } = await supabase
        .from('progress_entries')
        .upsert({ user_id: user.id, date, photo_path: path }, { onConflict: 'user_id,date' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress-entries', user?.id] }),
  })
}

export function useDeleteProgressEntry() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entry: ProgressEntry) => {
      if (entry.photo_path) await supabase.storage.from(BUCKET).remove([entry.photo_path])
      const { error } = await supabase.from('progress_entries').delete().eq('id', entry.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress-entries', user?.id] }),
  })
}

export function useSignedPhotoUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['progress-photo-url', path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path!, 3600)
      if (error) throw error
      return data.signedUrl
    },
  })
}
