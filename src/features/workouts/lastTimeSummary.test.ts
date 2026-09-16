import { describe, expect, it } from 'vitest'
import { summarizeLastSets } from '../../hooks/useWorkouts'

describe('summarizeLastSets', () => {
  it('returns an empty string for no sets', () => {
    expect(summarizeLastSets([])).toBe('')
  })

  it('collapses identical sets into a single "N×reps @ weight" group', () => {
    expect(
      summarizeLastSets([
        { weight: 60, reps: 8 },
        { weight: 60, reps: 8 },
        { weight: 60, reps: 8 },
      ]),
    ).toBe('3×8 @ 60kg')
  })

  it('lists distinct sets separately for a ramping/pyramid scheme', () => {
    expect(
      summarizeLastSets([
        { weight: 40, reps: 10 },
        { weight: 50, reps: 8 },
        { weight: 60, reps: 6 },
      ]),
    ).toBe('10 @ 40kg, 8 @ 50kg, 6 @ 60kg')
  })

  it('groups only consecutive matches, keeping a returning weight/reps as its own group', () => {
    expect(
      summarizeLastSets([
        { weight: 60, reps: 8 },
        { weight: 60, reps: 8 },
        { weight: 65, reps: 6 },
        { weight: 60, reps: 8 },
      ]),
    ).toBe('2×8 @ 60kg, 6 @ 65kg, 8 @ 60kg')
  })

  it('renders a single set without a count prefix', () => {
    expect(summarizeLastSets([{ weight: 100, reps: 5 }])).toBe('5 @ 100kg')
  })
})
