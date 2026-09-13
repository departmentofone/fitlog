import type { UnitSystem } from '../types'

const KG_PER_LB = 0.45359237
const CM_PER_IN = 2.54

export const kgToLb = (kg: number) => kg / KG_PER_LB
export const lbToKg = (lb: number) => lb * KG_PER_LB
export const cmToIn = (cm: number) => cm / CM_PER_IN
export const inToCm = (inches: number) => inches * CM_PER_IN

export function weightUnitLabel(unit: UnitSystem | undefined): 'kg' | 'lb' {
  return unit === 'imperial' ? 'lb' : 'kg'
}

export function displayWeightValue(kg: number, unit: UnitSystem | undefined): number {
  return Math.round((unit === 'imperial' ? kgToLb(kg) : kg) * 10) / 10
}
