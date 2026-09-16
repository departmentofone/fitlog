import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  /** The number to animate to. Re-rendering with a new value re-animates from the current display. */
  value: number
  /** Animation length in ms. Defaults to a snappy ~600ms. */
  durationMs?: number
  /** Custom formatter, applied to the (possibly fractional, mid-animation) displayed value. Takes precedence over decimals/suffix. */
  format?: (n: number) => string
  /** Decimal places to show when no `format` is given. Defaults to 0. */
  decimals?: number
  /** Text appended after the number when no `format` is given, e.g. "g" or "kg". */
  suffix?: string
  className?: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/**
 * Animates a number counting up (or down) to `value` over ~600ms with an ease-out curve,
 * using requestAnimationFrame. Starts from 0 on first mount, and from whatever is currently
 * displayed if `value` changes again mid-flight. Snaps instantly for prefers-reduced-motion.
 */
export function CountUp({ value, durationMs = 600, format, decimals = 0, suffix = '', className }: CountUpProps) {
  const [display, setDisplay] = useState(0)
  const displayRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)

    const from = displayRef.current
    const to = value

    if (from === to || prefersReducedMotion()) {
      displayRef.current = to
      setDisplay(to)
      return
    }

    let start: number | null = null
    const tick = (now: number) => {
      if (start === null) start = now
      const t = Math.min(1, (now - start) / durationMs)
      const eased = easeOutCubic(t)
      const current = from + (to - from) * eased
      displayRef.current = current
      setDisplay(current)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [value, durationMs])

  const formatted = format ? format(display) : `${display.toFixed(decimals)}${suffix}`

  return <span className={className}>{formatted}</span>
}
