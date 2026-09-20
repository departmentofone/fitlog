import { supabase } from './supabase'

/**
 * Every user-owned table, so "Export my data" really means all of it - the Settings and
 * delete-account copy both promise a full export before deletion, and it previously skipped
 * fasting, body measurements, water, alcohol, rest days, presets, recipes and programs.
 *
 * Tables whose rows belong to the user directly are filtered by RLS. Child tables (rows owned via
 * a parent) need an explicit join filter, because RLS on the child is expressed through its parent.
 */
const OWN_TABLES = [
  'workout_sessions',
  'meals',
  'goals',
  'progress_entries',
  'body_measurements',
  'water_logs',
  'alcohol_logs',
  'fasting_sessions',
  'rest_days',
  'exercise_notes',
  'workout_presets',
  'meal_presets',
  'recipes',
  'programs',
] as const

/** [table, embedded parent, the parent's user column path] */
const CHILD_TABLES = [
  ['workout_sets', 'session:workout_sessions!inner(user_id)', 'session.user_id'],
  ['meal_items', 'meal:meals!inner(user_id)', 'meal.user_id'],
  ['workout_preset_items', 'preset:workout_presets!inner(user_id)', 'preset.user_id'],
  ['meal_preset_items', 'preset:meal_presets!inner(user_id)', 'preset.user_id'],
  ['recipe_ingredients', 'recipe:recipes!inner(user_id)', 'recipe.user_id'],
] as const

export async function exportUserData(userId: string) {
  const [own, children, custom, settings] = await Promise.all([
    Promise.all(OWN_TABLES.map((table) => supabase.from(table).select('*'))),
    Promise.all(
      CHILD_TABLES.map(([table, embed, column]) => supabase.from(table).select(`*, ${embed}`).eq(column, userId)),
    ),
    // Custom foods/exercises this account created; the global library is deliberately left out.
    Promise.all([
      supabase.from('foods').select('*').eq('user_id', userId),
      supabase.from('exercises').select('*').eq('user_id', userId),
    ]),
    supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
  ])

  const payload: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    settings: settings.data ?? null,
    custom_foods: custom[0].data ?? [],
    custom_exercises: custom[1].data ?? [],
  }
  OWN_TABLES.forEach((table, i) => {
    payload[table] = own[i].data ?? []
  })
  CHILD_TABLES.forEach(([table], i) => {
    payload[table] = children[i].data ?? []
  })

  // Anything that failed (a table not yet migrated, a dropped connection) is named in the file
  // rather than silently exported as an empty list.
  const failed = [
    ...own.map((r, i) => [OWN_TABLES[i] as string, r.error] as const),
    ...children.map((r, i) => [CHILD_TABLES[i][0] as string, r.error] as const),
    ...custom.map((r, i) => [['foods', 'exercises'][i], r.error] as const),
    ['user_settings', settings.error] as const,
  ].flatMap(([table, error]) => (error ? [{ table, error: error.message }] : []))
  if (failed.length > 0) payload.incomplete = failed

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fitlog-export-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return { incomplete: failed }
}
