import { describe, expect, it } from 'vitest'
import { makeFood } from '../test/factories'
import type { MealPlanItem } from '../types'
import { averageDay, groupPlan, nextMealOrder } from './mealPlans'

function item(day: number, meal: string, mealOrder: number, itemOrder: number, kcalPer100: number, grams: number): MealPlanItem {
  return {
    id: `${day}-${meal}-${itemOrder}`,
    plan_id: 'p',
    day_index: day,
    meal_name: meal,
    meal_order: mealOrder,
    item_order: itemOrder,
    food_id: 'f',
    grams,
    serving_label: null,
    food: makeFood({ calories_per_100g: kcalPer100, protein_per_100g: 10 }),
  }
}

describe('groupPlan', () => {
  it('orders meals and items as stored and totals each level', () => {
    const [day] = groupPlan(
      [item(0, 'Dinner', 2, 0, 200, 100), item(0, 'Breakfast', 0, 1, 100, 100), item(0, 'Breakfast', 0, 0, 100, 50)],
      1,
    )
    expect(day.meals.map((m) => m.name)).toEqual(['Breakfast', 'Dinner'])
    expect(day.meals[0].items.map((i) => i.item_order)).toEqual([0, 1])
    expect(day.meals[0].totals.calories).toBe(150)
    expect(day.totals.calories).toBe(350)
  })

  it('keeps empty days in a week plan', () => {
    const days = groupPlan([item(2, 'Lunch', 0, 0, 100, 100)], 3)
    expect(days.map((d) => d.meals.length)).toEqual([0, 0, 1])
  })
})

describe('averageDay', () => {
  it('averages only days that have food in them', () => {
    const days = groupPlan([item(0, 'Lunch', 0, 0, 100, 100), item(1, 'Lunch', 0, 0, 300, 100)], 3)
    expect(averageDay(days).calories).toBe(200)
  })
})

describe('nextMealOrder', () => {
  it('puts a new meal after the last one on that day only', () => {
    const items = [item(0, 'Breakfast', 0, 0, 1, 1), item(0, 'Lunch', 1, 0, 1, 1), item(1, 'Lunch', 5, 0, 1, 1)]
    expect(nextMealOrder(items, 0)).toBe(2)
    expect(nextMealOrder(items, 2)).toBe(0)
  })
})
