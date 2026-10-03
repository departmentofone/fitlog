import type { MicroTotals } from '../types'

/** Adult daily reference values (FDA-style), used to show a %DV bar per nutrient. */
export const DAILY_VALUES: { key: keyof MicroTotals; label: string; unit: string; dv: number }[] = [
  { key: 'fiber', label: 'Fiber', unit: 'g', dv: 28 },
  { key: 'sugar', label: 'Sugar', unit: 'g', dv: 50 },
  { key: 'sodium', label: 'Sodium', unit: 'mg', dv: 2300 },
  { key: 'cholesterol', label: 'Cholesterol', unit: 'mg', dv: 300 },
  { key: 'potassium', label: 'Potassium', unit: 'mg', dv: 4700 },
  { key: 'calcium', label: 'Calcium', unit: 'mg', dv: 1000 },
  { key: 'iron', label: 'Iron', unit: 'mg', dv: 18 },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg', dv: 90 },
  { key: 'vitaminA', label: 'Vitamin A', unit: 'mcg', dv: 900 },
]

export function percentDV(value: number, dv: number): number {
  return Math.round((value / dv) * 100)
}

export function formatAmount(value: number, unit: string): string {
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10
  return `${rounded}${unit}`
}

/** Grams to show for a macro: whole numbers from 10 g up, one decimal below that (0.3 g, not 0 g). */
function macroGrams(n: number): string {
  return String(n >= 10 ? Math.round(n) : Math.round(n * 10) / 10)
}

/**
 * A food's macros per 100 g, written the same way everywhere a food is listed (the library, the
 * food search, global search): "P 21g · C 22g · F 50g per 100g", with calories in front unless the
 * row already shows them.
 */
export function per100gLine(
  food: { calories_per_100g: number; protein_per_100g: number; carbs_per_100g: number; fat_per_100g: number },
  withCalories = true,
): string {
  const macros = `P ${macroGrams(food.protein_per_100g)}g · C ${macroGrams(food.carbs_per_100g)}g · F ${macroGrams(food.fat_per_100g)}g per 100g`
  return withCalories ? `${Math.round(food.calories_per_100g)} kcal · ${macros}` : macros
}

// One colour rule for every micronutrient bar (Diet's dashboard and the breakdown sheet).
// Nutrients you want to *limit* read as a warning once you're over 100% DV; nutrients you want
// to *get enough of* read as a warning only while you're clearly short of it.
const LIMIT_KEYS = new Set<keyof MicroTotals>(['sodium', 'cholesterol', 'sugar'])

export function microTone(key: keyof MicroTotals, value: number, pct: number): 'none' | 'good' | 'neutral' | 'warn' {
  // Nothing logged yet isn't a warning - a red "0g" fiber before breakfast just read as an alarm.
  if (value <= 0) return 'none'
  if (LIMIT_KEYS.has(key)) {
    if (pct >= 100) return 'warn'
    if (pct >= 70) return 'neutral'
    return 'good'
  }
  if (pct >= 60) return 'good'
  if (pct >= 25) return 'neutral'
  return 'warn'
}

export const MICRO_TONE_BAR: Record<string, string> = {
  none: 'bg-slate-600',
  good: 'bg-emerald-500',
  neutral: 'bg-amber-400',
  warn: 'bg-red-500',
}
export const MICRO_TONE_TEXT: Record<string, string> = {
  none: 'text-slate-400',
  good: 'text-emerald-400',
  neutral: 'text-amber-400',
  warn: 'text-red-400',
}
