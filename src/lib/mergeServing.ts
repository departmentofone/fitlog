/**
 * Adding a food that's already in a meal merges it into the existing entry: the grams add up, and
 * the serving label is kept only when it stays accurate. Labels come from FoodAmountForm:
 * "<n> × <serving>" for two or more servings, or just "<serving>" otherwise.
 */
export interface Amount {
  grams: number
  servingLabel: string | null
}

function parse(label: string): { qty: number; serving: string } {
  const m = label.match(/^(\d+(?:\.\d+)?) × (.+)$/)
  return m ? { qty: Number(m[1]), serving: m[2] } : { qty: 1, serving: label }
}

function formatQty(qty: number): string {
  return String(Math.round(qty * 100) / 100)
}

export function mergeAmounts(a: Amount, b: Amount): Amount {
  const grams = a.grams + b.grams
  if (!a.servingLabel || !b.servingLabel) return { grams, servingLabel: null }
  const pa = parse(a.servingLabel)
  const pb = parse(b.servingLabel)
  // Same serving, and the same grams per serving (a half serving is labelled like a whole one).
  const sameServing = pa.serving === pb.serving && Math.abs(a.grams / pa.qty - b.grams / pb.qty) <= 0.01 * (a.grams / pa.qty)
  if (!sameServing) return { grams, servingLabel: null }
  const qty = pa.qty + pb.qty
  return { grams, servingLabel: qty === 1 ? pa.serving : `${formatQty(qty)} × ${pa.serving}` }
}
