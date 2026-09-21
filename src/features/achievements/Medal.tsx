import type { AwardCategory, AwardTier } from '../../lib/awards'

/** Metal colours for earned medals - fixed on purpose (bronze is bronze whatever your accent is). */
const METAL: Record<AwardTier, [string, string, string]> = {
  //          light      dark       rim
  bronze: ['#e3a574', '#9c5a2c', '#6e3d1b'],
  silver: ['#eef1f6', '#9aa3b2', '#6b7386'],
  gold: ['#fbe08a', '#d4a21f', '#96700f'],
  platinum: ['#e6fbff', '#8fd3e8', '#4d9db5'],
}

/** Category glyphs on a 24-unit grid, drawn in the medal's centre. */
const GLYPH: Record<AwardCategory, string> = {
  consistency: 'M12 3c1.5 3 5 5 5 9.5a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.7 1.2 2.6 2.3 2.8C11 8.3 11 5.7 12 3z',
  strength: 'M6.5 8v8M17.5 8v8M4 10v4M20 10v4M6.5 12h11',
  nutrition: 'M12 20a7 7 0 0 0 7-7H5a7 7 0 0 0 7 7zM12 13c0-3.5 1.8-6 5.2-6.8-.8 2.6-2.2 4.8-5.2 6.8z',
  fasting: 'M12 20a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM12 9.5V13l2.2 2.2M10 3h4',
}

/**
 * A medal: earned ones are solid metal by tier; locked ones are a dim disc with a progress ring,
 * so the collection also shows how close each one is.
 */
export function Medal({
  tier,
  category,
  unlocked,
  progress,
  size = 56,
}: {
  tier: AwardTier
  category: AwardCategory
  unlocked: boolean
  /** 0..1, drawn as a ring on locked medals. */
  progress: number
  size?: number
}) {
  const [light, dark, rim] = METAL[tier]
  const gradientId = `medal-${tier}`
  const r = 21
  const circumference = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(1, progress))

  return (
    <svg viewBox="0 0 56 56" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      {unlocked ? (
        <>
          <circle cx="28" cy="28" r="25" fill={rim} />
          <circle cx="28" cy="28" r="22.5" fill={`url(#${gradientId})`} />
          <circle cx="28" cy="28" r="18" fill="none" stroke={rim} strokeOpacity="0.35" strokeWidth="1" />
          <g transform="translate(16 16)" fill="none" stroke={rim} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d={GLYPH[category]} />
          </g>
        </>
      ) : (
        <>
          <circle cx="28" cy="28" r="25" fill="var(--color-slate-800)" />
          <circle cx="28" cy="28" r={r} fill="none" stroke="var(--color-slate-700)" strokeWidth="3" />
          {clamped > 0 && (
            <circle
              cx="28"
              cy="28"
              r={r}
              fill="none"
              stroke="var(--color-emerald-400)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - clamped)}
              transform="rotate(-90 28 28)"
            />
          )}
          <g
            transform="translate(16 16)"
            fill="none"
            stroke="var(--color-slate-500)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={GLYPH[category]} />
          </g>
        </>
      )}
    </svg>
  )
}
