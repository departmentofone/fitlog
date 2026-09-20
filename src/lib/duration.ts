/** Clock-style duration, e.g. "8:05" or "1:02:05". Used by the live timer and workout history. */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

/** Compact, readable length for summaries, e.g. "48 min" or "1 h 12 min". */
export function formatDurationLabel(totalSeconds: number): string {
  const minutes = Math.round(Math.max(0, totalSeconds) / 60)
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}
