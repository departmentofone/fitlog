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

/**
 * A stored kg weight in the user's unit, for showing on screen or pre-filling an input. Metric
 * passes through untouched (no rounding, so 61.25 stays 61.25). Imperial rounds to 0.1 lb so a
 * 135 lb set - stored as 61.23... kg - reads back as 135, not 134.99999.
 */
export function toDisplayWeight(kg: number, unit: UnitSystem | undefined): number {
  return unit === 'imperial' ? Math.round(kgToLb(kg) * 10) / 10 : kg
}

/** A weight the user typed in their own unit, converted to kg for storage. */
export function fromDisplayWeight(value: number, unit: UnitSystem | undefined): number {
  return unit === 'imperial' ? lbToKg(value) : value
}

/** "61.25 kg" / "135 lb" - `sep` is '' for the compact "61.25kg" style some screens use. */
export function formatWeight(kg: number, unit: UnitSystem | undefined, sep = ' '): string {
  return `${toDisplayWeight(kg, unit)}${sep}${weightUnitLabel(unit)}`
}

/**
 * A kg-based total (weight × reps volume, an estimated 1RM) in the user's unit. Metric is left
 * as-is for the caller to format; imperial rounds to a whole lb since these are big, fuzzy totals.
 */
export function toDisplayTotal(kg: number, unit: UnitSystem | undefined): number {
  return unit === 'imperial' ? Math.round(kgToLb(kg)) : kg
}

/** The -/+ nudge on a weight stepper: the smallest common plate jump in each system. */
export function weightStep(unit: UnitSystem | undefined): number {
  return unit === 'imperial' ? 5 : 2.5
}
