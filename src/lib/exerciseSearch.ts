import type { MuscleGroup } from '../types'

/**
 * Gym shorthand people type into the exercise search, expanded to the words the library uses.
 * "db bench" finds Dumbbell Bench Press, "rdl" finds the Romanian deadlifts.
 */
const ALIASES: Record<string, string> = {
  db: 'dumbbell',
  dbs: 'dumbbell',
  bb: 'barbell',
  kb: 'kettlebell',
  ez: 'ez-bar',
  ohp: 'overhead press',
  rdl: 'romanian deadlift',
  sldl: 'romanian deadlift',
  bp: 'bench press',
  squats: 'squat',
  lunges: 'lunge',
  curls: 'curl',
  rows: 'row',
  dips: 'dip',
  pullup: 'pull-up',
  pullups: 'pull-up',
  chinup: 'chin-up',
  chinups: 'chin-up',
  pushup: 'push-up',
  pushups: 'push-up',
  tri: 'triceps',
  tris: 'triceps',
  bi: 'bicep',
  bis: 'bicep',
  delts: 'delt',
  calves: 'calf',
}

/** Lowercase, with quotes and punctuation (other than hyphens) turned into spaces. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Whether an exercise name matches what was typed: every word typed (after expanding shorthand)
 * has to appear in the name, in any order. "press db incline" still finds Incline Dumbbell Press.
 */
export function matchesExercise(name: string, query: string): boolean {
  const q = normalize(query)
  if (!q) return true
  const haystack = normalize(name)
  // "pull up" and "pullup" both find Pull-Up.
  const squashed = haystack.replace(/-/g, '')
  return q.split(' ').every((word) => {
    const expanded = ALIASES[word] ?? word
    return expanded.split(' ').every((w) => haystack.includes(w) || squashed.includes(w.replace(/-/g, '')))
  })
}

export type MuscleFilter = 'all' | 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'cardio'

/** The muscle chips above the exercise list, each covering the library's finer groups. */
export const MUSCLE_FILTERS: { value: MuscleFilter; label: string; groups: MuscleGroup[] }[] = [
  { value: 'all', label: 'All', groups: [] },
  { value: 'chest', label: 'Chest', groups: ['chest', 'upper_chest', 'lower_chest'] },
  { value: 'back', label: 'Back', groups: ['back', 'lats', 'traps', 'lower_back'] },
  { value: 'shoulders', label: 'Shoulders', groups: ['shoulders', 'front_delts', 'side_delts', 'rear_delts'] },
  { value: 'arms', label: 'Arms', groups: ['biceps', 'triceps', 'forearms'] },
  { value: 'legs', label: 'Legs', groups: ['quads', 'hamstrings', 'glutes', 'adductors', 'abductors', 'calves'] },
  { value: 'core', label: 'Core', groups: ['abs'] },
  { value: 'cardio', label: 'Cardio', groups: ['cardio'] },
]

export function inMuscleFilter(group: MuscleGroup, filter: MuscleFilter): boolean {
  if (filter === 'all') return true
  return MUSCLE_FILTERS.find((f) => f.value === filter)?.groups.includes(group) ?? false
}
