import { describe, expect, it } from 'vitest'
import { formatDuration, formatDurationLabel } from './duration'

describe('formatDuration', () => {
  it('formats minutes and seconds, padding the seconds', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(599)).toBe('9:59')
  })

  it('adds an hours part once past an hour', () => {
    expect(formatDuration(3600)).toBe('1:00:00')
    expect(formatDuration(3725)).toBe('1:02:05')
  })

  it('never renders a negative clock', () => {
    expect(formatDuration(-30)).toBe('0:00')
  })
})

describe('formatDurationLabel', () => {
  it('reads as minutes below an hour and hours above', () => {
    expect(formatDurationLabel(2700)).toBe('45 min')
    expect(formatDurationLabel(3600)).toBe('1 h')
    expect(formatDurationLabel(4320)).toBe('1 h 12 min')
  })
})
