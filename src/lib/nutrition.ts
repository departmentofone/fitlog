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
