import type { Food } from '../types'

/**
 * Ranks food-library matches so the plain ingredient comes first: "egg" shows "Egg, whole" before
 * "Egg noodles", and "chicken" shows "Chicken breast" before breaded fillets.
 *
 * Library names follow a "Thing, qualifier (notes)" convention (USDA-style), and local products
 * put an English gloss in parentheses. So the part before the first comma/parenthesis is the
 * food's identity ("head"), and English compound nouns put the actual thing last ("duck egg" is an
 * egg, "egg noodles" is noodles).
 */

/** Words that mark a prepared/processed product rather than the ingredient itself. */
const PRODUCT_WORDS = new Set([
  'noodles', 'pasta', 'sandwich', 'burger', 'pizza', 'soup', 'salad', 'sauce', 'spread', 'dressing',
  'cake', 'cakes', 'cookie', 'cookies', 'biscuit', 'biscuits', 'bar', 'bars', 'chips', 'crackers',
  'cereal', 'flakes', 'chocolate', 'candy', 'ice', 'cream', 'pudding', 'muffin', 'pie', 'pastry',
  'nuggets', 'breaded', 'fried', 'sausage', 'sausages', 'hot', 'dog', 'dogs', 'ham', 'salami',
  'smoked', 'drink', 'shake', 'smoothie', 'juice', 'syrup', 'jam', 'mashed', 'powder', 'bread',
  // Serbian product words used in the local library
  'zitarice', 'cokolada', 'virsla', 'panirani', 'dimljena', 'kobasica', 'pasteta', 'namaz',
])

/** Words that name a part or plain state of the same ingredient - these belong near the top. */
const PART_WORDS = new Set([
  'whole', 'raw', 'plain', 'fresh', 'white', 'yolk', 'breast', 'thigh', 'wing', 'wings', 'drumstick',
  'leg', 'fillet', 'loin', 'skinless', 'boneless', 'lean', 'cooked', 'boiled', 'steamed', 'dried',
])

/** Lowercase, accents stripped (so "pilec" finds "pileći"), punctuation to spaces. */
export function normalizeFoodText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'dj')
    .replace(/[^a-z0-9%]+/g, ' ')
    .trim()
}

function words(text: string): string[] {
  return text ? text.split(' ') : []
}

/** Lower is better. Returns null when the food doesn't match at all. */
export function scoreFood(name: string, query: string): number | null {
  const q = normalizeFoodText(query)
  if (!q) return 0
  const full = normalizeFoodText(name)
  if (!full.includes(q)) return null

  const headRaw = name.split(/[,(]/)[0]
  const head = normalizeFoodText(headRaw)
  const headWords = words(head)
  const qWords = words(q)
  const allWords = words(full)
  const qIsWordsIn = (list: string[]) =>
    list.some((_, i) => qWords.every((w, j) => list[i + j] === w))

  let tier: number
  if (head === q) {
    tier = 0 // "Egg, whole", "Banana", "Milk, skim"
  } else if (headWords.length > qWords.length && qIsWordsIn(headWords)) {
    const rest = headWords.filter((w) => !qWords.includes(w))
    const endsWithQuery = headWords.slice(-qWords.length).join(' ') === q
    const onlyParts = rest.every((w) => PART_WORDS.has(w))
    if (onlyParts) tier = 1 // "Egg white", "Chicken breast"
    else if (endsWithQuery && rest.length === 1) tier = 2 // "Duck egg", "Brown rice"
    else tier = 3 // "Egg noodles", "Ground chicken"
  } else if (qIsWordsIn(allWords)) {
    tier = 4 // matches a whole word outside the name's head, e.g. the English gloss "(chicken breast)"
  } else {
    tier = 5 // inside another word: "Eggplant", "Buttermilk"
  }

  let score = tier * 10
  if (allWords.some((w) => PRODUCT_WORDS.has(w) && !qWords.includes(w))) score += 12
  // Among equals, prefer the plainest qualifier ("whole"/"raw") and then the shorter name.
  if (tier <= 2 && /\b(whole|raw|plain)\b/.test(full)) score -= 1
  score += Math.min(allWords.length, 12) * 0.1
  return score
}

/** Filters and orders `foods` for `query`; with an empty query returns them alphabetically. */
export function rankFoods(foods: Food[], query: string, limit = 50): Food[] {
  if (!normalizeFoodText(query)) {
    return [...foods].sort((a, b) => a.name.localeCompare(b.name)).slice(0, limit)
  }
  const scored: { food: Food; score: number }[] = []
  for (const food of foods) {
    const score = scoreFood(food.name, query)
    if (score !== null) scored.push({ food, score })
  }
  scored.sort((a, b) => a.score - b.score || a.food.name.localeCompare(b.food.name))
  return scored.slice(0, limit).map((s) => s.food)
}
