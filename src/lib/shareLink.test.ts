// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { clearPendingShared, parseOpenParam, peekPendingShared, shareUrl, storePendingShared } from './shareLink'

const ID = '0d3e5f10-2c4b-4e8a-9f61-7a2b3c4d5e6f'

describe('share links', () => {
  beforeEach(() => localStorage.clear())

  it('builds a short /s/ link', () => {
    expect(shareUrl({ kind: 'workout', id: ID }, 'https://fitlog.example')).toBe(`https://fitlog.example/s/workout/${ID}`)
  })

  it('reads ?open=kind:id and rejects anything else', () => {
    expect(parseOpenParam(`?open=diet:${ID}`)).toEqual({ kind: 'diet', id: ID })
    expect(parseOpenParam(`?source=play&open=plan:${ID}`)).toEqual({ kind: 'plan', id: ID })
    expect(parseOpenParam('')).toBeNull()
    expect(parseOpenParam(`?open=users:${ID}`)).toBeNull()
    expect(parseOpenParam('?open=workout:not-a-uuid')).toBeNull()
  })

  it('keeps a pending link through sign-up, and drops it after a week', () => {
    storePendingShared({ kind: 'recipe', id: ID }, 1000)
    expect(peekPendingShared(2000)).toEqual({ kind: 'recipe', id: ID })
    expect(peekPendingShared(1000 + 8 * 24 * 60 * 60 * 1000)).toBeNull()
    clearPendingShared()
    expect(peekPendingShared(2000)).toBeNull()
  })
})
