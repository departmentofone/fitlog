import { useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useSignedPhotoUrl } from '../../hooks/useProgressEntries'
import { useUserSettings } from '../../hooks/useUserSettings'
import { formatWeight } from '../../lib/units'
import type { ProgressEntry, UnitSystem } from '../../types'

function formatCaption(entry: ProgressEntry | undefined, unit: UnitSystem | undefined) {
  if (!entry) return ''
  const date = new Date(entry.date + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return entry.weight != null ? `${date} · ${formatWeight(entry.weight, unit, '')}` : date
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value))
}

function BeforeAfterSlider({ before, after }: { before: ProgressEntry | undefined; after: ProgressEntry | undefined }) {
  const { data: beforeUrl } = useSignedPhotoUrl(before?.photo_path)
  const { data: afterUrl } = useSignedPhotoUrl(after?.photo_path)
  const { data: settings } = useUserSettings()
  const [percent, setPercent] = useState(50)
  const [dragging, setDragging] = useState(false)

  const updateFromClientX = (target: HTMLDivElement, clientX: number) => {
    const rect = target.getBoundingClientRect()
    if (rect.width === 0) return
    setPercent(clampPercent(((clientX - rect.left) / rect.width) * 100))
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    updateFromClientX(e.currentTarget, e.clientX)
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    updateFromClientX(e.currentTarget, e.clientX)
  }

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    setDragging(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  return (
    <div>
      <div
        className="relative aspect-[3/4] w-full touch-none select-none overflow-hidden rounded-xl bg-slate-800"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={(e) => dragging && endDrag(e)}
      >
        {/* Before: full-width base layer */}
        {beforeUrl ? (
          <img src={beforeUrl} alt="Before" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="absolute inset-0 bg-slate-800" />
        )}

        {/* After: clipped to reveal only up to the divider */}
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}>
          {afterUrl ? (
            <img src={afterUrl} alt="After" className="h-full w-full object-cover" draggable={false} />
          ) : (
            <div className="h-full w-full bg-slate-800" />
          )}
        </div>

        <span className="absolute left-2 top-2 rounded-full bg-slate-900/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          Before
        </span>
        <span className="absolute right-2 top-2 rounded-full bg-slate-900/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          After
        </span>

        {/* Divider + drag handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/90"
          style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg">
            <span className="text-xs leading-none">↔</span>
          </div>
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
        <span>{formatCaption(before, settings?.unit_system)}</span>
        <span>{formatCaption(after, settings?.unit_system)}</span>
      </div>
    </div>
  )
}

export function PhotoCompare({ entries, onBack }: { entries: ProgressEntry[]; onBack: () => void }) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const [leftId, setLeftId] = useState(sorted[0]?.id)
  const [rightId, setRightId] = useState(sorted[sorted.length - 1]?.id)

  const left = sorted.find((e) => e.id === leftId)
  const right = sorted.find((e) => e.id === rightId)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-white">Compare photos</h3>
        <button onClick={onBack} className="text-xs text-slate-400 hover:text-slate-200">
          Back
        </button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <select
          value={leftId}
          onChange={(e) => setLeftId(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-800 px-2 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
        >
          {sorted.map((e) => (
            <option key={e.id} value={e.id}>
              {e.date}
            </option>
          ))}
        </select>
        <select
          value={rightId}
          onChange={(e) => setRightId(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-800 px-2 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
        >
          {sorted.map((e) => (
            <option key={e.id} value={e.id}>
              {e.date}
            </option>
          ))}
        </select>
      </div>

      <BeforeAfterSlider before={left} after={right} />
    </div>
  )
}
