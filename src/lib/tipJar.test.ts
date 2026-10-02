// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { loadedOnBar, plateName, recordTip, TIP_PRODUCTS } from './tipJar'

describe('tip jar plates', () => {
  beforeEach(() => localStorage.clear())

  it("names each tip as a plate in the person's unit", () => {
    expect(TIP_PRODUCTS.map((p) => plateName(p.id, 'kg'))).toEqual(['1.25 kg plate', '5 kg plate', '10 kg plate', '20 kg plate'])
    expect(TIP_PRODUCTS.map((p) => plateName(p.id, 'lb'))).toEqual(['2.5 lb plate', '10 lb plate', '25 lb plate', '45 lb plate'])
  })

  it('adds up what this phone has loaded onto the bar', () => {
    expect(loadedOnBar('kg')).toBe(0)
    recordTip('tip_tier_4')
    recordTip('tip_tier_1')
    recordTip('tip_tier_1')
    expect(loadedOnBar('kg')).toBe(22.5)
    expect(loadedOnBar('lb')).toBe(50)
  })

  it('ignores junk in storage', () => {
    localStorage.setItem('fitlog-tips', '{"tip_tier_2":"lots","tip_tier_3":-4,"made_up":9}')
    expect(loadedOnBar('kg')).toBe(0)
    localStorage.setItem('fitlog-tips', 'not json')
    expect(loadedOnBar('kg')).toBe(0)
  })
})
