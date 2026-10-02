/**
 * A Date as 'YYYY-MM-DD' in the phone's own time zone, the way meals, workouts and every other
 * log store their `date`. `toISOString().slice(0, 10)` gives the UTC date instead: east of UTC that
 * is yesterday for the first hours after midnight, west of UTC it is tomorrow all evening, so
 * ranges built with it dropped today's entries or filed them under the wrong day.
 */
export function localISO(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
