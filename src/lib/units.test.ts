import { describe, expect, it } from 'vitest'
import { cmToIn, displayWeightValue, inToCm, kgToLb, lbToKg, weightUnitLabel } from './units'

describe('weight/length conversions', () => {
  it('converts kg to lb', () => {
    expect(kgToLb(1)).toBeCloseTo(2.20462, 4)
  })

  it('round-trips kg -> lb -> kg', () => {
    expect(lbToKg(kgToLb(83))).toBeCloseTo(83, 6)
  })

  it('round-trips cm -> in -> cm', () => {
    expect(inToCm(cmToIn(180))).toBeCloseTo(180, 6)
  })
})

describe('weightUnitLabel', () => {
  it('returns lb for imperial', () => {
    expect(weightUnitLabel('imperial')).toBe('lb')
  })

  it('defaults to kg for metric or undefined', () => {
    expect(weightUnitLabel('metric')).toBe('kg')
    expect(weightUnitLabel(undefined)).toBe('kg')
  })
})

describe('displayWeightValue', () => {
  it('passes kg through unchanged (rounded to 1 decimal) for metric', () => {
    expect(displayWeightValue(82.34, 'metric')).toBe(82.3)
  })

  it('converts to lb and rounds to 1 decimal for imperial', () => {
    expect(displayWeightValue(100, 'imperial')).toBe(220.5)
  })
})
