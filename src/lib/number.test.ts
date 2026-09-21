import { describe, expect, it } from 'vitest'
import { parseDecimal } from './number'

describe('parseDecimal', () => {
  it('accepts a comma or a dot as the decimal separator', () => {
    expect(parseDecimal('62,5')).toBe(62.5)
    expect(parseDecimal('62.5')).toBe(62.5)
    expect(parseDecimal(',5')).toBe(0.5)
    expect(parseDecimal('100')).toBe(100)
    expect(parseDecimal(' 7,25 ')).toBe(7.25)
  })

  it('passes numbers through', () => {
    expect(parseDecimal(12.5)).toBe(12.5)
  })

  it('rejects anything that is not a plain number', () => {
    for (const bad of ['', ' ', 'abc', '12abc', '1.2.3', '1,2,3', ',', '.', null, undefined]) {
      expect(parseDecimal(bad as string)).toBeNaN()
    }
  })

  it('keeps a trailing separator while typing valid', () => {
    expect(parseDecimal('62,')).toBe(62)
  })
})
