import { describe, expect, it } from 'vitest'
import {
  cmToIn,
  displayWeightValue,
  flOzToMl,
  foodUnitLabel,
  formatFoodAmount,
  formatVolume,
  formatWeight,
  fromDisplayFoodAmount,
  fromDisplayVolume,
  fromDisplayWeight,
  gToOz,
  mlToFlOz,
  ozToG,
  inToCm,
  kgToLb,
  lbToKg,
  toDisplayFoodAmount,
  toDisplayTotal,
  toDisplayVolume,
  toDisplayWeight,
  volumeUnitLabel,
  weightStep,
  weightUnitLabel,
} from './units'

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

describe('toDisplayWeight / fromDisplayWeight', () => {
  it('leaves metric values untouched, without rounding', () => {
    expect(toDisplayWeight(61.25, 'metric')).toBe(61.25)
    expect(toDisplayWeight(61.25, undefined)).toBe(61.25)
    expect(fromDisplayWeight(61.25, 'metric')).toBe(61.25)
  })

  it('round-trips a typed lb value through kg storage back to the same lb', () => {
    for (const lb of [0, 2.5, 45, 135, 137.5, 225, 315, 405]) {
      expect(toDisplayWeight(fromDisplayWeight(lb, 'imperial'), 'imperial')).toBe(lb)
    }
  })

  it('stores lb as kg', () => {
    expect(fromDisplayWeight(100, 'imperial')).toBeCloseTo(45.359237, 6)
  })

  it('shows kg as lb rounded to 0.1', () => {
    expect(toDisplayWeight(100, 'imperial')).toBe(220.5)
  })
})

describe('formatWeight', () => {
  it('formats in the user unit with a space by default', () => {
    expect(formatWeight(60, 'metric')).toBe('60 kg')
    expect(formatWeight(lbToKg(135), 'imperial')).toBe('135 lb')
  })

  it('supports the compact no-space style', () => {
    expect(formatWeight(62.5, 'metric', '')).toBe('62.5kg')
    expect(formatWeight(lbToKg(225), 'imperial', '')).toBe('225lb')
  })
})

describe('toDisplayTotal', () => {
  it('leaves metric totals untouched', () => {
    expect(toDisplayTotal(1234.5, 'metric')).toBe(1234.5)
  })

  it('converts imperial totals to whole lb', () => {
    expect(toDisplayTotal(1000, 'imperial')).toBe(2205)
  })
})

describe('weightStep', () => {
  it('nudges by 2.5 kg for metric and 5 lb for imperial', () => {
    expect(weightStep('metric')).toBe(2.5)
    expect(weightStep(undefined)).toBe(2.5)
    expect(weightStep('imperial')).toBe(5)
  })
})

describe('volume (drinks)', () => {
  it('converts ml to fl oz and back', () => {
    expect(mlToFlOz(29.5735295625)).toBeCloseTo(1, 10)
    expect(flOzToMl(mlToFlOz(500))).toBeCloseTo(500, 6)
  })

  it('labels ml / fl oz', () => {
    expect(volumeUnitLabel('metric')).toBe('ml')
    expect(volumeUnitLabel(undefined)).toBe('ml')
    expect(volumeUnitLabel('imperial')).toBe('fl oz')
  })

  it('passes metric through and rounds imperial to 0.1 fl oz', () => {
    expect(toDisplayVolume(250, 'metric')).toBe(250)
    expect(fromDisplayVolume(250, 'metric')).toBe(250)
    expect(toDisplayVolume(2000, 'imperial')).toBe(67.6)
  })

  it('round-trips typed fl oz through ml storage', () => {
    for (const flOz of [1.5, 5, 8, 12, 16, 64]) {
      expect(toDisplayVolume(fromDisplayVolume(flOz, 'imperial'), 'imperial')).toBe(flOz)
    }
  })

  it('formats with the unit', () => {
    expect(formatVolume(500, 'metric')).toBe('500 ml')
    expect(formatVolume(flOzToMl(12), 'imperial')).toBe('12 fl oz')
  })
})

describe('food amounts', () => {
  it('converts g to oz and back', () => {
    expect(gToOz(28.349523125)).toBeCloseTo(1, 10)
    expect(ozToG(gToOz(150))).toBeCloseTo(150, 6)
  })

  it('labels g / oz', () => {
    expect(foodUnitLabel('metric')).toBe('g')
    expect(foodUnitLabel('imperial')).toBe('oz')
  })

  it('passes metric through and rounds imperial to 0.1 oz', () => {
    expect(toDisplayFoodAmount(33.333, 'metric')).toBe(33.333)
    expect(fromDisplayFoodAmount(100, 'metric')).toBe(100)
    expect(toDisplayFoodAmount(100, 'imperial')).toBe(3.5)
  })

  it('round-trips typed oz through gram storage', () => {
    for (const oz of [0.5, 1, 3.5, 4, 6.2, 16]) {
      expect(toDisplayFoodAmount(fromDisplayFoodAmount(oz, 'imperial'), 'imperial')).toBe(oz)
    }
  })

  it('formats grams at the requested precision, and oz to 0.1', () => {
    expect(formatFoodAmount(33.36, 'metric')).toBe('33.4 g')
    expect(formatFoodAmount(33.36, 'metric', 0)).toBe('33 g')
    expect(formatFoodAmount(150, 'imperial')).toBe('5.3 oz')
  })
})
