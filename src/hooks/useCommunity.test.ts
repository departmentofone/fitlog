import { describe, expect, it } from 'vitest'
import { makeFood } from '../test/factories'
import type { MealPreset } from './useMealPresets'
import { communitySearchText, sortCommunity, type CommunityItem } from './useCommunity'

function meal(id: string, opts: { official?: boolean; createdAt: string; name?: string; foods?: string[] }): CommunityItem {
  const preset: MealPreset = {
    id,
    user_id: 'someone',
    name: opts.name ?? id,
    is_shared: true,
    is_official: opts.official,
    created_at: opts.createdAt,
    meal_preset_items: (opts.foods ?? []).map((f, i) => ({
      id: `${id}-${i}`,
      preset_id: id,
      food_id: `f${i}`,
      grams: 100,
      serving_label: null,
      food: makeFood({ id: `f${i}`, name: f }),
    })),
  }
  return { kind: 'meal', id, name: preset.name, description: null, isOfficial: !!opts.official, isMine: false, ownerId: 'someone', createdAt: opts.createdAt, meal: preset }
}

describe('sortCommunity', () => {
  it('puts official items first in the order they were curated, then everyone else newest first', () => {
    const sorted = sortCommunity([
      meal('user-old', { createdAt: '2026-09-01T00:00:00Z' }),
      meal('official-2', { official: true, createdAt: '2026-09-10T00:00:02Z' }),
      meal('user-new', { createdAt: '2026-09-20T00:00:00Z' }),
      meal('official-1', { official: true, createdAt: '2026-09-10T00:00:01Z' }),
    ])
    expect(sorted.map((i) => i.id)).toEqual(['official-1', 'official-2', 'user-new', 'user-old'])
  })

  it('leads the official items with diets, whatever order they were curated in', () => {
    const diet = { ...meal('official-diet', { official: true, createdAt: '2026-09-20T00:00:00Z' }), kind: 'diet' } as unknown as CommunityItem
    const sorted = sortCommunity([meal('official-meal', { official: true, createdAt: '2026-09-10T00:00:00Z' }), diet])
    expect(sorted.map((i) => i.id)).toEqual(['official-diet', 'official-meal'])
  })
})

describe('communitySearchText', () => {
  it('matches on the foods inside a preset, ignoring accents and case', () => {
    const item = meal('m', { createdAt: '2026-09-01T00:00:00Z', name: 'Morning bowl', foods: ['Greek yogurt, plain nonfat', 'Ćevapi'] })
    const text = communitySearchText(item)
    expect(text).toContain('greek yogurt')
    expect(text).toContain('cevapi')
    expect(text).toContain('morning bowl')
  })
})
