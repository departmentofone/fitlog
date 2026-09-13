export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'cardio'

export const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'forearms', label: 'Forearms' },
  { value: 'abs', label: 'Abs' },
  { value: 'quads', label: 'Quads' },
  { value: 'hamstrings', label: 'Hamstrings' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'calves', label: 'Calves' },
  { value: 'cardio', label: 'Cardio / Full Body' },
]

export interface Exercise {
  id: string
  user_id: string | null
  name: string
  muscle_group: MuscleGroup
  created_at: string
}

export interface WorkoutSession {
  id: string
  user_id: string
  date: string
  preworkout: boolean
  notes: string | null
  created_at: string
}

export interface WorkoutSet {
  id: string
  session_id: string
  exercise_id: string
  set_number: number
  weight: number
  reps: number
  difficulty: number
  created_at: string
}

export interface CommonServing {
  label: string
  grams: number
}

export interface Food {
  id: string
  user_id: string | null
  name: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  common_servings: CommonServing[]
  created_at: string
}

export interface Meal {
  id: string
  user_id: string
  date: string
  name: string
  created_at: string
}

export interface MealItem {
  id: string
  meal_id: string
  food_id: string
  grams: number
  serving_label: string | null
  created_at: string
}

export type DietGoal = 'deficit' | 'maintenance' | 'surplus'
export type Sex = 'male' | 'female' | 'other'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

export interface UserSettings {
  user_id: string
  ask_preworkout: boolean
  diet_goal: DietGoal
  calorie_goal: number | null
  water_goal_ml: number
  weight_goal: number | null
  current_weight: number | null
  height_cm: number | null
  age: number | null
  sex: Sex | null
  activity_level: ActivityLevel | null
  updated_at: string
}

export interface WaterLog {
  id: string
  user_id: string
  date: string
  ml: number
}

export type GoalCategory = 'workout' | 'custom'

export interface Goal {
  id: string
  user_id: string
  category: GoalCategory
  title: string
  notes: string | null
  target_date: string | null
  completed: boolean
  created_at: string
}

export interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export function macrosForGrams(food: Food, grams: number): MacroTotals {
  const factor = grams / 100
  return {
    calories: food.calories_per_100g * factor,
    protein: food.protein_per_100g * factor,
    carbs: food.carbs_per_100g * factor,
    fat: food.fat_per_100g * factor,
  }
}

export function sumMacros(items: MacroTotals[]): MacroTotals {
  return items.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}
