/** Epley formula: a widely-used estimate, accurate-ish up to ~10 reps. */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight
  return weight * (1 + reps / 30)
}
