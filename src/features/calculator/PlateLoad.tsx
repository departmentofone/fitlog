import { calculatePlates, formatPlate, IMPERIAL_BAR, IMPERIAL_PLATES, METRIC_BAR, METRIC_PLATES, type PlateResult } from './plateMath'

/**
 * Plate colours as gyms paint them (the competition colours for kg bumpers: 25 red, 20 blue,
 * 15 yellow, 10 green, 5 white), and how tall each plate stands next to the biggest one. These are
 * the real-world colours lifters look for on the rack, so they stay the same in both themes.
 */
const PLATE_LOOK: Record<'kg' | 'lb', Record<number, { color: string; height: number; width: number }>> = {
  kg: {
    25: { color: '#dc2626', height: 100, width: 15 },
    20: { color: '#2563eb', height: 100, width: 13 },
    15: { color: '#eab308', height: 88, width: 11 },
    10: { color: '#16a34a', height: 76, width: 10 },
    5: { color: '#e5e7eb', height: 58, width: 8 },
    2.5: { color: '#dc2626', height: 46, width: 7 },
    1.25: { color: '#9ca3af', height: 38, width: 6 },
  },
  lb: {
    45: { color: '#2563eb', height: 100, width: 15 },
    35: { color: '#eab308', height: 90, width: 13 },
    25: { color: '#16a34a', height: 78, width: 11 },
    10: { color: '#e5e7eb', height: 60, width: 9 },
    5: { color: '#64748b', height: 48, width: 7 },
    2.5: { color: '#9ca3af', height: 40, width: 6 },
  },
}

/** One sleeve of the bar, collar on the left, plates loaded inside-out as you'd slide them on. */
export function BarSleeve({ perSide, unit }: { perSide: number[]; unit: 'kg' | 'lb' }) {
  const looks = PLATE_LOOK[unit]
  return (
    <div className="flex h-20 items-center" aria-hidden="true">
      {/* the bar's grip end and collar */}
      <div className="h-2.5 w-10 rounded-l-full bg-slate-500" />
      <div className="h-6 w-2.5 rounded-sm bg-slate-400" />
      {perSide.map((p, i) => {
        const look = looks[p] ?? { color: '#9ca3af', height: 50, width: 8 }
        return (
          <div
            key={i}
            className="ml-px rounded-[3px] ring-1 ring-black/20"
            style={{ height: `${look.height}%`, width: `${look.width}px`, background: look.color }}
          />
        )
      })}
      {/* the rest of the sleeve */}
      <div className="h-3.5 min-w-6 flex-1 rounded-r-sm bg-slate-500" />
    </div>
  )
}

/** The loading for a total weight: the sleeve drawing plus "20 + 20 + 2.5 kg per side". */
export function PlateLoad({ total, unit, bar }: { total: number; unit: 'kg' | 'lb'; bar?: number }) {
  const barWeight = bar ?? (unit === 'lb' ? IMPERIAL_BAR : METRIC_BAR)
  const result: PlateResult = calculatePlates(total, barWeight, unit === 'lb' ? IMPERIAL_PLATES : METRIC_PLATES)
  const exact = Math.abs(result.achievedTotal - result.target) < 0.01
  if (total <= barWeight) {
    return <p className="text-sm text-slate-400">Just the bar ({formatPlate(barWeight)} {unit}).</p>
  }
  return (
    <div>
      <BarSleeve perSide={result.perSide} unit={unit} />
      <p className="mt-1 text-sm text-slate-300">
        {result.perSide.map(formatPlate).join(' + ')} {unit} <span className="text-slate-500">each side, on a {formatPlate(barWeight)} {unit} bar</span>
      </p>
      {!exact && (
        <p className="mt-0.5 text-xs text-amber-400">
          Closest you can load is {formatPlate(result.achievedTotal)} {unit}.
        </p>
      )}
    </div>
  )
}
