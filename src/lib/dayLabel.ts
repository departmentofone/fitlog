import { formatDayLabel } from '../components/DateNav'
import { localISO } from './localDate'

/** "today", "yesterday", "tomorrow", or "Thu 1 Oct", to sit inside a sentence. */
export function dayPhrase(date: string, today = localISO(new Date())): string {
  const label = formatDayLabel(date, today)
  return ['Today', 'Yesterday', 'Tomorrow'].includes(label) ? label.toLowerCase() : label
}

/** "yesterday" or "on Thu 1 Oct": a day as the end of "Nothing logged ...". */
export function onDayPhrase(date: string, today = localISO(new Date())): string {
  const phrase = dayPhrase(date, today)
  return /^(today|yesterday|tomorrow)$/.test(phrase) ? phrase : `on ${phrase}`
}
