import { macrosForGrams, sumMacros, type MacroTotals, type MealPlanItem } from '../types'

export interface PlanMeal {
  name: string
  order: number
  items: MealPlanItem[]
  totals: MacroTotals
}

export interface PlanDay {
  index: number
  meals: PlanMeal[]
  totals: MacroTotals
}

/** The default meal slots offered when building a plan day, in order. */
export const DEFAULT_PLAN_MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

/**
 * A plan's flat item rows as days -> meals -> items, each level in its stored order, with macro
 * totals. `days` is the plan's day count, so an empty day still shows up as an empty day.
 */
export function groupPlan(items: MealPlanItem[], days: number): PlanDay[] {
  const out: PlanDay[] = []
  for (let d = 0; d < Math.max(days, 1); d++) {
    const dayItems = items.filter((i) => i.day_index === d)
    const byMeal = new Map<string, MealPlanItem[]>()
    for (const i of dayItems) byMeal.set(i.meal_name, [...(byMeal.get(i.meal_name) ?? []), i])
    const meals: PlanMeal[] = [...byMeal.entries()]
      .map(([name, mealItems]) => ({
        name,
        order: Math.min(...mealItems.map((i) => i.meal_order)),
        items: [...mealItems].sort((a, b) => a.item_order - b.item_order),
        totals: sumMacros(mealItems.map((i) => macrosForGrams(i.food, i.grams))),
      }))
      .sort((a, b) => a.order - b.order)
    out.push({ index: d, meals, totals: sumMacros(meals.map((m) => m.totals)) })
  }
  return out
}

/** Average calories and protein per day, over days that have anything in them. */
export function averageDay(days: PlanDay[]): MacroTotals {
  const filled = days.filter((d) => d.meals.length > 0)
  if (filled.length === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const t = sumMacros(filled.map((d) => d.totals))
  return { calories: t.calories / filled.length, protein: t.protein / filled.length, carbs: t.carbs / filled.length, fat: t.fat / filled.length }
}

/** Where a new meal slot goes: after the last one already in that day. */
export function nextMealOrder(items: MealPlanItem[], dayIndex: number): number {
  const orders = items.filter((i) => i.day_index === dayIndex).map((i) => i.meal_order)
  return orders.length === 0 ? 0 : Math.max(...orders) + 1
}
