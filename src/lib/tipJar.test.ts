// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { ALL_TIP_IDS, grandmaId, kcalFed, kcalOf, recordTip } from './tipJar'

describe('tip jar', () => {
  beforeEach(() => localStorage.clear())

  it('adds up the calories this phone has fed the developer', () => {
    expect(kcalFed()).toBe(0)
    recordTip('tip_tier_4')
    recordTip('tip_tier_1')
    recordTip('tip_tier_1')
    expect(kcalFed()).toBe(1800 + 105 + 105)
  })

  it("counts Grandma's portion at 100 kcal a dollar", () => {
    expect(kcalOf(grandmaId(7))).toBe(700)
    expect(kcalOf('tip_custom_100')).toBe(10000)
    recordTip(grandmaId(3))
    recordTip('tip_tier_2')
    expect(kcalFed()).toBe(300 + 220)
  })

  it('lists every product once for the store to look up', () => {
    expect(ALL_TIP_IDS).toHaveLength(4 + 14)
    expect(new Set(ALL_TIP_IDS).size).toBe(ALL_TIP_IDS.length)
    // Play product IDs: lowercase letters, digits, underscores and periods, starting with a letter or digit.
    for (const id of ALL_TIP_IDS) expect(id).toMatch(/^[a-z0-9][a-z0-9_.]*$/)
  })

  it('ignores junk in storage', () => {
    localStorage.setItem('fitlog-tips', '{"tip_tier_2":"lots","tip_tier_3":-4,"made_up":9}')
    expect(kcalFed()).toBe(0)
    localStorage.setItem('fitlog-tips', 'not json')
    expect(kcalFed()).toBe(0)
  })
})
