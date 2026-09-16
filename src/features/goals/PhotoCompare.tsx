import { useState } from 'react'
import { useSignedPhotoUrl } from '../../hooks/useProgressEntries'
import type { ProgressEntry } from '../../types'

function Slot({ entry, label }: { entry: ProgressEntry | undefined; label: string }) {
  const { data: url } = useSignedPhotoUrl(entry?.photo_path)
  return (
    <div className="flex-1">
      <p className="mb-1 text-center text-xs text-slate-500">{label}</p>
      {url ? (
        <img src={url} alt={label} className="aspect-[3/4] w-full rounded-xl object-cover" />
      ) : (
        <div className="flex aspect-[3/4] w-full items-center justify-center rounded-xl bg-slate-800" />
      )}
      {entry && (
        <p className="mt-1 text-center text-xs text-slate-400">
          {new Date(entry.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          {entry.weight != null && ` · ${entry.weight}kg`}
        </p>
      )}
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

      <div className="flex gap-3">
        <Slot entry={left} label="Before" />
        <Slot entry={right} label="After" />
      </div>
    </div>
  )
}
