// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { getRestTimerPref, setRestTimerPref } from './restTimerPrefs'

describe('rest timer prefs', () => {
  beforeEach(() => localStorage.clear())

  it('are both on by default', () => {
    expect(getRestTimerPref('autoStart')).toBe(true)
    expect(getRestTimerPref('notifications')).toBe(true)
  })

  it('remember each switch separately', () => {
    setRestTimerPref('notifications', false)
    expect(getRestTimerPref('notifications')).toBe(false)
    expect(getRestTimerPref('autoStart')).toBe(true)
    setRestTimerPref('notifications', true)
    expect(getRestTimerPref('notifications')).toBe(true)
  })
})
