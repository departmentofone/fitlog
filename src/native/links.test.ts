import { describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/app', () => ({ App: {} }))
vi.mock('@capacitor/browser', () => ({ Browser: {} }))
vi.mock('./incoming', () => ({ Incoming: {} }))

const { inAppPath } = await import('./links')
const ID = '0c7e4a7e-5b1f-4d3b-9a77-2f1d3c4b5a69'

describe('links into the app', () => {
  it('turns a share link into the in-app address that opens the item', () => {
    expect(inAppPath(`https://fitlog-two-gamma.vercel.app/s/workout/${ID}`)).toBe(`/?open=workout:${ID}#/community`)
    expect(inAppPath(`https://fitlog-two-gamma.vercel.app/s/diet/${ID}/`)).toBe(`/?open=diet:${ID}#/community`)
  })

  it('keeps the password reset tokens of a home page link', () => {
    const hash = '#access_token=abc&refresh_token=def&type=recovery'
    expect(inAppPath(`https://fitlog-two-gamma.vercel.app/${hash}`)).toBe(`/${hash}`)
    expect(inAppPath(`https://fitlog-two-gamma.vercel.app/?open=meal:${ID}#/community`)).toBe(`/?open=meal:${ID}#/community`)
  })

  it('turns the icon shortcuts into quick actions', () => {
    expect(inAppPath('fitlog://quick/set')).toBe('/?quick=set#/workouts')
    expect(inAppPath('fitlog://quick/meal')).toBe('/?quick=meal#/meals')
    expect(inAppPath('fitlog://quick/fast')).toBe('/?quick=fast#/fasting')
    expect(inAppPath('fitlog://quick/nope')).toBeNull()
  })

  it('leaves everything else alone', () => {
    expect(inAppPath('https://fitlog-two-gamma.vercel.app/privacy')).toBeNull()
    expect(inAppPath('https://fitlog-two-gamma.vercel.app/delete-account')).toBeNull()
    expect(inAppPath('https://fitlog-two-gamma.vercel.app/s/workout/not-an-id')).toBeNull()
    expect(inAppPath(`https://evil.example/s/workout/${ID}`)).toBeNull()
    expect(inAppPath('not a url')).toBeNull()
  })
})
