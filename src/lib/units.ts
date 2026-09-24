import type { UnitSystem } from '../types'

const KG_PER_LB = 0.45359237
const CM_PER_IN = 2.54
const ML_PER_FL_OZ = 29.5735295625
const G_PER_OZ = 28.349523125

export const kgToLb = (kg: number) => kg / KG_PER_LB
export const lbToKg = (lb: number) => lb * KG_PER_LB
export const cmToIn = (cm: number) => cm / CM_PER_IN
export const inToCm = (inches: number) => inches * CM_PER_IN
export const mlToFlOz = (ml: number) => ml / ML_PER_FL_OZ
export const flOzToMl = (flOz: number) => flOz * ML_PER_FL_OZ
export const gToOz = (g: number) => g / G_PER_OZ
export const ozToG = (oz: number) => oz * G_PER_OZ

const round1 = (n: number) => Math.round(n * 10) / 10

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

/*
 * Drinks (water, alcohol) are stored in ml and food portions in grams. Imperial shows fl oz / oz,
 * rounded to 0.1 so a typed value survives the round trip through storage; metric passes through.
 * Nutrients (protein, carbs, fiber...) stay in grams in both systems - US labels use grams too.
 */

export function volumeUnitLabel(unit: UnitSystem | undefined): 'ml' | 'fl oz' {
  return unit === 'imperial' ? 'fl oz' : 'ml'
}

export function toDisplayVolume(ml: number, unit: UnitSystem | undefined): number {
  return unit === 'imperial' ? round1(mlToFlOz(ml)) : ml
}

export function fromDisplayVolume(value: number, unit: UnitSystem | undefined): number {
  return unit === 'imperial' ? flOzToMl(value) : value
}

export function formatVolume(ml: number, unit: UnitSystem | undefined): string {
  return `${toDisplayVolume(ml, unit)} ${volumeUnitLabel(unit)}`
}

export function foodUnitLabel(unit: UnitSystem | undefined): 'g' | 'oz' {
  return unit === 'imperial' ? 'oz' : 'g'
}

export function toDisplayFoodAmount(g: number, unit: UnitSystem | undefined): number {
  return unit === 'imperial' ? round1(gToOz(g)) : g
}

export function fromDisplayFoodAmount(value: number, unit: UnitSystem | undefined): number {
  return unit === 'imperial' ? ozToG(value) : value
}

/** "150 g" / "5.3 oz". Grams round to `gramDecimals` places (screens differ: whole vs 0.1 g). */
export function formatFoodAmount(g: number, unit: UnitSystem | undefined, gramDecimals = 1): string {
  if (unit === 'imperial') return `${round1(gToOz(g))} oz`
  const f = 10 ** gramDecimals
  return `${Math.round(g * f) / f} g`
}
