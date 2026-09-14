import { describe, expect, it } from 'vitest'
import { formatAmount, percentDV } from './nutrition'

describe('percentDV', () => {
  it('computes a rounded percentage of the daily value', () => {
    expect(percentDV(28, 28)).toBe(100)
    expect(percentDV(14, 28)).toBe(50)
    expect(percentDV(0, 28)).toBe(0)
  })
})

describe('formatAmount', () => {
  it('keeps one decimal place below 10', () => {
    expect(formatAmount(5, 'g')).toBe('5g')
    expect(formatAmount(5.55, 'g')).toBe('5.6g')
  })

  it('rounds to a whole number at 10 and above', () => {
    expect(formatAmount(15.4, 'mg')).toBe('15mg')
    expect(formatAmount(15.7, 'mg')).toBe('16mg')
  })
})
