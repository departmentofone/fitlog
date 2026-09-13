import { supabase } from './supabase'

export async function exportUserData(userId: string) {
  const [sessions, sets, meals, mealItems, goals, progress, settings] = await Promise.all([
    supabase.from('workout_sessions').select('*'),
    supabase
      .from('workout_sets')
      .select('*, session:workout_sessions!inner(user_id)')
      .eq('session.user_id', userId),
    supabase.from('meals').select('*'),
    supabase.from('meal_items').select('*, meal:meals!inner(user_id)').eq('meal.user_id', userId),
    supabase.from('goals').select('*'),
    supabase.from('progress_entries').select('*'),
    supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    workout_sessions: sessions.data ?? [],
    workout_sets: sets.data ?? [],
    meals: meals.data ?? [],
    meal_items: mealItems.data ?? [],
    goals: goals.data ?? [],
    progress_entries: progress.data ?? [],
    settings: settings.data ?? null,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fitlog-export-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
