/** Evenly spaced axis ticks (79, 80, 81... or 76, 78, 80...) instead of recharts' uneven picks. */
export function niceAxis(values: number[]): { domain: [number, number]; ticks: number[] } {
  const min = Math.min(...values) - 0.5
  const max = Math.max(...values) + 0.5
  const step = [0.5, 1, 2, 2.5, 5, 10, 20].find((s) => (max - min) / s <= 5) ?? 50
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let t = lo; t <= hi + 1e-9; t += step) ticks.push(Math.round(t * 10) / 10)
  return { domain: [lo, hi], ticks }
}
