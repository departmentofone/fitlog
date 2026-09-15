export type MuscleGroup =
  | 'chest'
  | 'upper_chest'
  | 'lower_chest'
  | 'back'
  | 'lats'
  | 'traps'
  | 'lower_back'
  | 'shoulders'
  | 'front_delts'
  | 'side_delts'
  | 'rear_delts'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'adductors'
  | 'abductors'
  | 'calves'
  | 'cardio'

export const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Chest' },
  { value: 'upper_chest', label: 'Upper chest' },
  { value: 'lower_chest', label: 'Lower chest' },
  { value: 'back', label: 'Back (general)' },
  { value: 'lats', label: 'Lats' },
  { value: 'traps', label: 'Traps' },
  { value: 'lower_back', label: 'Lower back' },
  { value: 'shoulders', label: 'Shoulders (general)' },
  { value: 'front_delts', label: 'Front delts' },
  { value: 'side_delts', label: 'Side delts' },
  { value: 'rear_delts', label: 'Rear delts' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'forearms', label: 'Forearms' },
  { value: 'abs', label: 'Abs' },
  { value: 'quads', label: 'Quads' },
  { value: 'hamstrings', label: 'Hamstrings' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'adductors', label: 'Adductors (Inner Thigh)' },
  { value: 'abductors', label: 'Abductors (Outer Thigh)' },
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
  started_at: string | null
  duration_seconds: number | null
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
  is_warmup: boolean
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
  fiber_g: number
  sugar_g: number
  sodium_mg: number
  cholesterol_mg: number
  potassium_mg: number
  calcium_mg: number
  iron_mg: number
  vitamin_c_mg: number
  vitamin_a_mcg: number
  common_servings: CommonServing[]
  created_at: string
}

export interface Meal {
  id: string
  user_id: string
  date: string
  name: string
  completed: boolean
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

export type UnitSystem = 'metric' | 'imperial'
export type ThemePreference = 'light' | 'dark' | 'system'
export type Tab =
  | 'workouts'
  | 'meals'
  | 'scanner'
  | 'diet'
  | 'fasting'
  | 'goals'
  | 'achievements'
  | 'programs'
  | 'about'

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
  unit_system: UnitSystem
  theme: ThemePreference
  color_palette: string
  /** Extra bottom-nav shortcuts beyond the always-pinned Workouts/Meals (max 2). */
  bottom_nav_tabs: Tab[]
  updated_at: string
}

export interface ProgressEntry {
  id: string
  user_id: string
  date: string
  weight: number | null
  notes: string | null
  photo_path: string | null
  created_at: string
}

export interface WaterLog {
  id: string
  user_id: string
  date: string
  ml: number
}

export type GoalCategory = 'workout' | 'custom'

export interface WorkoutPresetItem {
  id: string
  preset_id: string
  exercise_id: string
  set_number: number
  weight: number
  reps: number
}

export interface WorkoutPreset {
  id: string
  user_id: string
  name: string
  is_shared: boolean
  created_at: string
}

export interface Recipe {
  id: string
  user_id: string
  name: string
  servings: number
  is_shared: boolean
  created_at: string
}

/**
 * Program contents are self-contained snapshots - exercises/foods are embedded by name and
 * macros rather than by id, so a program built on one account can be imported into a
 * completely different account (find-or-create by name at import time; see usePrograms.ts).
 */
export interface ProgramWorkoutItem {
  exerciseName: string
  muscleGroup: MuscleGroup
  setNumber: number
  weight: number
  reps: number
}

export interface ProgramWorkout {
  name: string
  items: ProgramWorkoutItem[]
}

export interface ProgramFoodSnapshot {
  foodName: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  grams: number
  servingLabel: string | null
}

export interface ProgramRecipe {
  name: string
  servings: number
  ingredients: ProgramFoodSnapshot[]
}

export interface ProgramMealPreset {
  name: string
  items: ProgramFoodSnapshot[]
}

export interface Program {
  id: string
  user_id: string
  name: string
  description: string
  is_shared: boolean
  diet_goal: DietGoal | null
  calorie_goal: number | null
  water_goal_ml: number | null
  workouts: ProgramWorkout[]
  recipes: ProgramRecipe[]
  meal_presets: ProgramMealPreset[]
  created_at: string
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  food_id: string
  grams: number
  serving_label: string | null
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  category: GoalCategory
  title: string
  notes: string | null
  target_date: string | null
  completed: boolean
  target_exercise_id: string | null
  target_weight: number | null
  target_reps: number | null
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

export interface MicroTotals {
  fiber: number
  sugar: number
  sodium: number
  cholesterol: number
  potassium: number
  calcium: number
  iron: number
  vitaminC: number
  vitaminA: number
}

export function microsForGrams(food: Food, grams: number): MicroTotals {
  const factor = grams / 100
  return {
    fiber: food.fiber_g * factor,
    sugar: food.sugar_g * factor,
    sodium: food.sodium_mg * factor,
    cholesterol: food.cholesterol_mg * factor,
    potassium: food.potassium_mg * factor,
    calcium: food.calcium_mg * factor,
    iron: food.iron_mg * factor,
    vitaminC: food.vitamin_c_mg * factor,
    vitaminA: food.vitamin_a_mcg * factor,
  }
}

const ZERO_MICROS: MicroTotals = {
  fiber: 0,
  sugar: 0,
  sodium: 0,
  cholesterol: 0,
  potassium: 0,
  calcium: 0,
  iron: 0,
  vitaminC: 0,
  vitaminA: 0,
}

export function sumMicros(items: MicroTotals[]): MicroTotals {
  return items.reduce(
    (acc, m) => ({
      fiber: acc.fiber + m.fiber,
      sugar: acc.sugar + m.sugar,
      sodium: acc.sodium + m.sodium,
      cholesterol: acc.cholesterol + m.cholesterol,
      potassium: acc.potassium + m.potassium,
      calcium: acc.calcium + m.calcium,
      iron: acc.iron + m.iron,
      vitaminC: acc.vitaminC + m.vitaminC,
      vitaminA: acc.vitaminA + m.vitaminA,
    }),
    { ...ZERO_MICROS },
  )
}
