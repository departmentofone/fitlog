/** Converts a 'YYYY-MM-DD' string to a timezone-independent integer day count. */
export function toDayNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

/** Matches toDayNumber(todayISO()) from useWorkouts — both are UTC-calendar-day based. */
export function todayDayNumber(): number {
  return Math.floor(Date.now() / 86_400_000)
}

/**
 * `restDayStrings` (optional) bridges gaps for streak-continuity purposes only - a logged rest
 * day counts toward keeping the streak alive without being a real activity day. Pass it for the
 * workout streak (where "rest day" is a meaningful concept); leave it out for the diet streak.
 */
export function computeDayStreaks(dateStrings: string[], restDayStrings: string[] = []): { current: number; best: number } {
  const activeDays = new Set(dateStrings.map(toDayNumber))
  const restDays = new Set(restDayStrings.map(toDayNumber))
  const days = Array.from(new Set([...activeDays, ...restDays])).sort((a, b) => a - b)
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
