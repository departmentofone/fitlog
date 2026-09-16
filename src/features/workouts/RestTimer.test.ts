// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { formatRestTime, getDefaultRestSeconds, setDefaultRestSeconds } from '../../components/RestTimer'

describe('formatRestTime', () => {
  it('formats seconds as mm:ss', () => {
    expect(formatRestTime(90)).toBe('1:30')
    expect(formatRestTime(5)).toBe('0:05')
    expect(formatRestTime(0)).toBe('0:00')
    expect(formatRestTime(125)).toBe('2:05')
  })

  it('never goes negative', () => {
    expect(formatRestTime(-10)).toBe('0:00')
  })
})

describe('default rest duration persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('falls back to 90s when nothing is stored', () => {
    expect(getDefaultRestSeconds()).toBe(90)
  })

  it('round-trips a value through localStorage', () => {
    setDefaultRestSeconds(120)
    expect(getDefaultRestSeconds()).toBe(120)
  })

  it('clamps to the 15s-300s range', () => {
    setDefaultRestSeconds(5)
    expect(getDefaultRestSeconds()).toBe(15)
    setDefaultRestSeconds(1000)
    expect(getDefaultRestSeconds()).toBe(300)
  })

  it('ignores corrupt stored values', () => {
    localStorage.setItem('fitlog-rest-seconds', 'not-a-number')
    expect(getDefaultRestSeconds()).toBe(90)
  })
})
