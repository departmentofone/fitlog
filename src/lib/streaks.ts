/** Converts a 'YYYY-MM-DD' string to a timezone-independent integer day count. */
export function toDayNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

/** Matches toDayNumber(todayISO()) from useWorkouts — both are UTC-calendar-day based. */
export function todayDayNumber(): number {
  return Math.floor(Date.now() / 86_400_000)
}

export function computeDayStreaks(dateStrings: string[]): { current: number; best: number } {
  const days = Array.from(new Set(dateStrings.map(toDayNumber))).sort((a, b) => a - b)
  if (days.length === 0) return { current: 0, best: 0 }

  let best = 1
  let running = 1
  for (let i = 1; i < days.length; i++) {
    running = days[i] - days[i - 1] === 1 ? running + 1 : 1
    best = Math.max(best, running)
  }

  const daySet = new Set(days)
  const todayNum = todayDayNumber()
  const anchor = daySet.has(todayNum) ? todayNum : daySet.has(todayNum - 1) ? todayNum - 1 : null

  let current = 0
  if (anchor !== null) {
    let cursor = anchor
    while (daySet.has(cursor)) {
      current++
      cursor--
    }
  }

  return { current, best }
}
