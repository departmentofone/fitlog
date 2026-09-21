import { describe, expect, it } from 'vitest'
import { makeFood } from '../test/factories'
import { normalizeFoodText, rankFoods } from './foodSearch'

// Real names from the FitLog library, in the alphabetical order the old search returned them.
const LIBRARY = [
  'Almond milk, unsweetened',
  'Banana',
  'Basmati rice, cooked',
  'Brown rice, cooked',
  'Buttermilk, low fat',
  'Carnex dimljena pileća prsa, slajs (smoked chicken breast)',
  'Carnex pileća viršla (chicken hot dogs)',
  'Chicken breast, cooked',
  'Chicken breast, raw (skinless, boneless)',
  'Chicken thigh, cooked',
  'Corn Flakes žitarice (kukuruzne pahuljice)',
  'Duck egg',
  'Egg noodles, cooked',
  'Egg white',
  'Egg yolk',
  'Egg, whole',
  'Eggplant',
  'Ground chicken, cooked',
  'Milk, 2% reduced fat',
  'Milk, whole',
  'Milka mlečna čokolada, alpsko mleko (milk chocolate)',
  'Panirani pileći file, smrznuto (frozen breaded chicken fillet)',
  'Quail egg',
  'Rice cakes',
  'White rice, cooked',
].map((name, i) => makeFood({ id: String(i), name }))

const names = (query: string) => rankFoods(LIBRARY, query).map((f) => f.name)

describe('rankFoods', () => {
  it('puts the plain ingredient first, then its parts, then other eggs, then products', () => {
    expect(names('egg')).toEqual([
      'Egg, whole',
      'Egg white',
      'Egg yolk',
      'Duck egg',
      'Quail egg',
      'Egg noodles, cooked',
      'Eggplant',
    ])
  })

  it('ranks raw cuts above processed chicken products', () => {
    const result = names('chicken')
    expect(result.slice(0, 3)).toEqual([
      'Chicken breast, raw (skinless, boneless)',
      'Chicken breast, cooked',
      'Chicken thigh, cooked',
    ])
    // Branded/processed products sink to the bottom.
    expect(result.indexOf('Ground chicken, cooked')).toBeLessThan(result.indexOf('Carnex pileća viršla (chicken hot dogs)'))
    expect(result.slice(-3)).toContain('Panirani pileći file, smrznuto (frozen breaded chicken fillet)')
  })

  it('prefers the whole/plain variant among exact matches', () => {
    expect(names('milk')[0]).toBe('Milk, whole')
    expect(names('milk').indexOf('Milka mlečna čokolada, alpsko mleko (milk chocolate)')).toBeGreaterThan(
      names('milk').indexOf('Almond milk, unsweetened'),
    )
  })

  it('shows kinds of rice before rice products', () => {
    const result = names('rice')
    expect(result.indexOf('Rice cakes')).toBeGreaterThan(result.indexOf('Brown rice, cooked'))
  })

  it('matches without diacritics', () => {
    expect(names('pilec')).toContain('Carnex pileća viršla (chicken hot dogs)')
    expect(names('zitarice')).toEqual(['Corn Flakes žitarice (kukuruzne pahuljice)'])
  })

  it('returns everything alphabetically for an empty query and nothing for no match', () => {
    expect(names('')[0]).toBe('Almond milk, unsweetened')
    expect(names('zzz')).toEqual([])
  })
})

describe('normalizeFoodText', () => {
  it('lowercases, strips accents and punctuation', () => {
    expect(normalizeFoodText('Pileća Prsa, Slajs!')).toBe('pileca prsa slajs')
    expect(normalizeFoodText('Đumbir')).toBe('djumbir')
  })
})
