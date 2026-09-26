import { parseDecimal } from '../../lib/number'
import { useState } from 'react'
import { useUserSettings } from '../../hooks/useUserSettings'
import { calculatePlates } from './plateMath'

const fieldClass =
  'field px-3 py-2 '

// Standard plate sets. Imperial follows the common lb equivalents rather than a literal kg->lb
// conversion, matching how gyms actually stock plates.
const METRIC_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]
const IMPERIAL_PLATES = [45, 35, 25, 10, 5, 2.5]

function formatWeight(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

export function PlateCalculator() {
  const { data: settings } = useUserSettings()
  const imperial = settings?.unit_system === 'imperial'
  const unit = imperial ? 'lb' : 'kg'
  const availablePlates = imperial ? IMPERIAL_PLATES : METRIC_PLATES

  const [target, setTarget] = useState('')
  const [barWeight, setBarWeight] = useState(imperial ? '45' : '20')

  const targetNum = target ? parseDecimal(target) : null
  const barNum = barWeight ? parseDecimal(barWeight) : null

  const result =
    targetNum != null && !isNaN(targetNum) && targetNum > 0 && barNum != null && !isNaN(barNum) && barNum > 0
      ? calculatePlates(targetNum, barNum, availablePlates)
      : null

  const exact = result != null && Math.abs(result.achievedTotal - result.target) < 0.01

  return (
    <>
      <div className="card card-glow p-4">
        <h3 className="mb-1 card-title">Plate calculator</h3>
        <p className="mb-3 text-sm text-slate-400">
          Work out which plates to load on each side of the bar to hit a target total weight.
        </p>

        {/* Visible labels: the bar field starts filled in (20 / 45), so a placeholder alone left a
            bare number with nothing saying what it was. */}
        <div className="grid grid-cols-2 gap-2.5">
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs text-slate-400">Target ({unit})</span>
            <input
              placeholder={imperial ? 'e.g. 225' : 'e.g. 100'}
              type="text"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className={`${fieldClass} w-full min-w-0`}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs text-slate-400">Bar ({unit})</span>
            <input
              type="text"
              inputMode="decimal"
              value={barWeight}
              onChange={(e) => setBarWeight(e.target.value)}
              className={`${fieldClass} w-full min-w-0`}
            />
          </label>
        </div>
        <p className="mt-2.5 text-xs text-slate-500">
          Available plates: {availablePlates.map(formatWeight).join(', ')} {unit}
        </p>
      </div>

      <div className="card p-4">
        <h3 className="mb-3 card-title">Result</h3>
        {result == null ? (
          <p className="text-sm text-slate-500">Enter a target weight and bar weight above to see the loading.</p>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs text-slate-500">Per side (load the same on both sides)</p>
              {result.perSide.length === 0 ? (
                <p className="text-sm text-slate-400">No plates needed — bar only</p>
              ) : (
                <div className="flex flex-wrap items-end gap-1.5">
                  {result.perSide.map((p, i) => {
                    const size = 34 + Math.min(p, 25) * 1.4
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-center rounded-lg bg-emerald-600/90 font-semibold text-white ring-1 ring-white/10"
                        style={{ width: `${size}px`, height: `${size}px`, fontSize: p >= 10 ? '0.8rem' : '0.7rem' }}
                      >
                        {formatWeight(p)}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-slate-800/60 p-3 text-center">
              <p className="text-2xl font-semibold text-white">
                {formatWeight(result.achievedTotal)} {unit}
              </p>
              <p className="text-xs text-slate-500">
                {exact ? 'Exact match' : `Closest possible (target was ${formatWeight(result.target)} ${unit})`}
              </p>
            </div>

            <p className="text-xs text-slate-500">
              Bar ({formatWeight(result.barWeight)} {unit})
              {result.perSide.length > 0 && ` + ${result.perSide.map(formatWeight).join(' + ')} ${unit} per side × 2`}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
