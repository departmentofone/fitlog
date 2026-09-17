const TONE_COLORS: Record<string, string> = {
  good: 'var(--color-success)',
  warn: '#f87171',
  neutral: '#60a5fa',
}

export function CircularProgress({
  percent,
  tone = 'good',
  size = 76,
  strokeWidth = 8,
  label,
}: {
  percent: number
  tone?: 'good' | 'warn' | 'neutral'
  size?: number
  strokeWidth?: number
  label?: string
}) {
  const clamped = Math.max(0, Math.min(100, percent))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)
  const color = TONE_COLORS[tone]

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-slate-700)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-white">{Math.round(clamped)}%</span>
        {label && <span className="text-[11px] text-slate-500">{label}</span>}
      </div>
    </div>
  )
}
