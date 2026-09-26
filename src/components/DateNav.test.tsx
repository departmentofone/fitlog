import { describe, expect, it } from 'vitest'
import { formatDayLabel } from './DateNav'

describe('formatDayLabel', () => {
  const today = '2026-09-26'

  it('names today, yesterday and tomorrow', () => {
    expect(formatDayLabel('2026-09-26', today)).toBe('Today')
    expect(formatDayLabel('2026-09-25', today)).toBe('Yesterday')
    expect(formatDayLabel('2026-09-27', today)).toBe('Tomorrow')
  })

  it('handles month boundaries', () => {
    expect(formatDayLabel('2026-09-30', '2026-10-01')).toBe('Yesterday')
  })

  it('shows the year only for other years', () => {
    expect(formatDayLabel('2026-09-10', today)).not.toMatch(/2026/)
    expect(formatDayLabel('2025-09-10', today)).toMatch(/2025/)
  })
})
