import { describe, expect, it } from 'vitest'
import { describeError } from './queryClient'

describe('describeError', () => {
  it('reads the message from plain Supabase error objects and Errors', () => {
    expect(describeError({ code: '23505', message: 'duplicate key' })).toBe('duplicate key')
    expect(describeError(new Error('boom'))).toBe('boom')
  })

  it('explains missing tables/columns instead of showing the raw schema error', () => {
    expect(describeError({ code: 'PGRST205', message: "Could not find the table 'public.rest_days'" })).toMatch(
      /isn't set up on the server/,
    )
  })

  it('falls back to a generic message', () => {
    expect(describeError(undefined)).toBe('Something went wrong')
    expect(describeError({})).toBe('Something went wrong')
  })
})
