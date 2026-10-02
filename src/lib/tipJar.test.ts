// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { kcalFed, recordTip } from './tipJar'

describe('tip jar', () => {
  beforeEach(() => localStorage.clear())

  it('adds up the calories this phone has fed the developer', () => {
    expect(kcalFed()).toBe(0)
    recordTip('tip_tier_4')
    recordTip('tip_tier_1')
    recordTip('tip_tier_1')
    expect(kcalFed()).toBe(1800 + 105 + 105)
  })

  it('ignores junk in storage', () => {
    localStorage.setItem('fitlog-tips', '{"tip_tier_2":"lots","tip_tier_3":-4,"made_up":9}')
    expect(kcalFed()).toBe(0)
    localStorage.setItem('fitlog-tips', 'not json')
    expect(kcalFed()).toBe(0)
  })
})
