import { describe, expect, it } from 'vitest'
import { isPlayLaunch } from './platform'

describe('isPlayLaunch', () => {
  it('recognizes the Trusted Web Activity referrer', () => {
    expect(isPlayLaunch('android-app://com.departmentofone.fitlog/', '')).toBe(true)
  })

  it('recognizes the launch URL marker when there is no referrer', () => {
    expect(isPlayLaunch('', '?source=play')).toBe(true)
    expect(isPlayLaunch('', '?utm_medium=x&source=play')).toBe(true)
  })

  it('treats a normal browser visit as the website', () => {
    expect(isPlayLaunch('', '')).toBe(false)
    expect(isPlayLaunch('https://www.google.com/', '')).toBe(false)
    expect(isPlayLaunch('', '?source=web')).toBe(false)
  })
})
