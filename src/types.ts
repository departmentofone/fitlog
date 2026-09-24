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
  barcode: string | null
  /** Null = the default shared library. Set on foods that belong to an opt-in regional pack
   *  (migration_v22) - hidden from search unless the account has turned that pack on. */
  pack: string | null
  created_at: string
}

/** A personal tag on a food (own, global, or packed) - one account's organization, not shared (migration_v22). */
export interface FoodLabel {
  id: string
  user_id: string
  food_id: string
  label: string
  created_at: string
}

export interface Meal {
  id: string
  user_id: string
  date: string
  name: string
  completed: boolean
  photo_path: string | null
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
  | 'history'
  | 'achievements'
  | 'programs'
  | 'foods'
  | 'community'
  | 'calculator'
  | 'whatsnew'
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
  haptics_enabled: boolean
  /** Extra bottom-nav shortcuts beyond the always-pinned Workouts/Meals (max 2). */
  bottom_nav_tabs: Tab[]
  /** When the user agreed to the health-data disclosure (null = not yet asked/agreed). */
  health_data_consent_at: string | null
  /** Opt-in regional food packs this account has turned on, e.g. ['serbia'] (migration_v22). */
  enabled_food_packs: string[]
  /** The diet this account is following, if any (migration_v29). Optional: absent before it. */
  active_diet_id?: string | null
  /** When this account agreed to the Community guidelines - asked before the first share (v29). */
  community_guidelines_accepted_at?: string | null
  /** People whose Community items this account chose to hide (v29). */
  hidden_community_users?: string[]
  /** The phone's IANA time zone, kept current by the app, so logged times can be read in local
   *  time for stats (migration_v30). Absent before it runs. */
  timezone?: string | null
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
  /** Preserved through save/load so a warm-up doesn't return as a working set (migration v20). */
  is_warmup: boolean
}

export interface WorkoutPreset {
  id: string
  user_id: string
  name: string
  is_shared: boolean
  /** Curated by FitLog, badged "Official" in Community. Optional: absent before migration_v28. */
  is_official?: boolean
  /** On a copy saved from Community, the item it came from (migration_v28). */
  source_id?: string | null
  description?: string | null
  created_at: string
}

export interface Recipe {
  id: string
  user_id: string
  name: string
  servings: number
  is_shared: boolean
  /** Curated by FitLog, badged "Official" in Community. Optional: absent before migration_v28. */
  is_official?: boolean
  /** On a copy saved from Community, the item it came from (migration_v28). */
  source_id?: string | null
  description?: string | null
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
  /** Curated by FitLog, badged "Official" in Community. Optional: absent before migration_v28. */
  is_official?: boolean
  /** On a copy saved from Community, the item it came from (migration_v28). */
  source_id?: string | null
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

/** A list of foods you eat on a given diet (Keto, Mediterranean...) - see migration_v29. */
export interface Diet {
  id: string
  user_id: string
  name: string
  description: string | null
  is_shared: boolean
  is_official?: boolean
  source_id?: string | null
  created_at: string
}

export interface DietFoodRow {
  diet_id: string
  food_id: string
  /** Null when RLS hides it (another user's private food) - see macrosForGrams. */
  food: Food | null
}

export interface DietWithFoods extends Diet {
  diet_foods: DietFoodRow[]
}

/** One day of meals, or up to 7 days combined into a week (migration_v29). */
export interface MealPlan {
  id: string
  user_id: string
  name: string
  description: string | null
  days: number
  /** Set when this is one of a diet's sample plans. */
  diet_id: string | null
  is_shared: boolean
  is_official?: boolean
  source_id?: string | null
  created_at: string
}

export interface MealPlanItem {
  id: string
  plan_id: string
  day_index: number
  meal_name: string
  meal_order: number
  item_order: number
  food_id: string
  grams: number
  serving_label: string | null
  food: Food | null
}

export interface MealPlanWithItems extends MealPlan {
  meal_plan_items: MealPlanItem[]
}

export interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

/**
 * `food` is nullable on purpose: a shared preset/recipe (and any meal logged from one) can
 * reference a custom food owned by another user, which row-level security hides from this reader -
 * PostgREST then returns `food: null` for that row rather than failing. Counting it as zero keeps
 * totals rendering instead of crashing the whole tab; the UI labels it "Unavailable food".
 */
export function macrosForGrams(food: Food | null | undefined, grams: number): MacroTotals {
  if (!food) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
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

/** Label for an exercise this account can't read (another user's custom exercise in a shared preset). */
export const UNAVAILABLE_EXERCISE_NAME = 'Unavailable exercise'

/** Label for a food this account can't read (another user's custom food, kept by a shared preset). */
export const UNAVAILABLE_FOOD_NAME = 'Unavailable food'

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

const EMPTY_MICROS: MicroTotals = { fiber: 0, sugar: 0, sodium: 0, cholesterol: 0, potassium: 0, calcium: 0, iron: 0, vitaminC: 0, vitaminA: 0 }

/** Nullable for the same reason as macrosForGrams - an unreadable food contributes nothing. */
export function microsForGrams(food: Food | null | undefined, grams: number): MicroTotals {
  if (!food) return EMPTY_MICROS
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
