import { describe, expect, it } from 'vitest'
import { isReturningDevice, SIGNED_IN_BEFORE_KEY } from './deviceHistory'

describe('isReturningDevice', () => {
  it('treats a device with nothing stored as new', () => {
    expect(isReturningDevice([])).toBe(false)
  })

  it('ignores keys that can exist before anyone signs in', () => {
    expect(isReturningDevice(['fitlog-query-cache', 'fitlog-only-diet', 'something-else'])).toBe(false)
  })

  it('recognizes the sign-in flag', () => {
    expect(isReturningDevice([SIGNED_IN_BEFORE_KEY])).toBe(true)
  })

  it('recognizes people who signed in before the flag existed', () => {
    expect(isReturningDevice(['fitlog-onboarded-v2'])).toBe(true)
    expect(isReturningDevice(['fitlog-celebrated-unlocks:0d3e5f10-2c4b-4e8a-9f61-7a2b3c4d5e6f'])).toBe(true)
    expect(isReturningDevice(['sb-uxmdzudoojexfcoircoo-auth-token'])).toBe(true)
  })
})
