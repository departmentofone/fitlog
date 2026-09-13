import { useMemo, useState } from 'react'
import {
  useDeleteProgressEntry,
  useProgressEntries,
  useSignedPhotoUrl,
  useUploadProgressPhoto,
  useUpsertProgressEntry,
} from '../../hooks/useProgressEntries'
import { useUserSettings } from '../../hooks/useUserSettings'
import { displayWeightValue, weightUnitLabel } from '../../lib/units'
import type { ProgressEntry } from '../../types'

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function PhotoThumb({ path, onClick }: { path: string; onClick?: () => void }) {
  const { data: url } = useSignedPhotoUrl(path)
  if (!url) return <div className="h-20 w-20 shrink-0 animate-pulse rounded-lg bg-slate-800" />
  return (
    <img
      src={url}
      onClick={onClick}
      className="h-20 w-20 shrink-0 rounded-lg object-cover"
      alt="Progress"
    />
  )
}

function EntryEditor({
  date,
  entry,
  onClose,
}: {
  date: string
  entry: ProgressEntry | undefined
  onClose: () => void
}) {
  const { data: settings } = useUserSettings()
  const upsert = useUpsertProgressEntry()
  const uploadPhoto = useUploadProgressPhoto()
  const deleteEntry = useDeleteProgressEntry()
  const { data: photoUrl } = useSignedPhotoUrl(entry?.photo_path)

  const unit = weightUnitLabel(settings?.unit_system)
  const [weight, setWeight] = useState(
    entry?.weight != null ? String(displayWeightValue(entry.weight, settings?.unit_system)) : '',
  )
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [uploading, setUploading] = useState(false)

  function save() {
    const parsed = parseFloat(weight)
    const kg = weight ? (settings?.unit_system === 'imperial' ? parsed * 0.45359237 : parsed) : null
    upsert.mutate({ date, weight: kg, notes: notes.trim() || null })
    onClose()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadPhoto.mutateAsync({ date, file, previousPath: entry?.photo_path })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-xl bg-slate-800/60 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">
          {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </h4>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-200">
          Close
        </button>
      </div>

      <div className="mb-3 flex items-center gap-3">
        {photoUrl ? (
          <img src={photoUrl} alt="Progress" className="h-20 w-20 rounded-lg object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-800 text-2xl">📷</div>
        )}
        <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-slate-600 px-3 py-2 text-center text-xs font-medium text-slate-300 hover:border-emerald-500 hover:text-emerald-400">
          {uploading ? 'Uploading…' : entry?.photo_path ? 'Replace photo' : 'Add photo'}
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      </div>

      <input
        type="number"
        inputMode="decimal"
        placeholder={`Weight (${unit})`}
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
      />
      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="mb-3 w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
      />

      <div className="flex gap-2">
        {entry && (
          <button
            onClick={() => {
              deleteEntry.mutate(entry)
              onClose()
            }}
            className="rounded-lg bg-red-600/20 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-600/30"
          >
            Delete
          </button>
        )}
        <button onClick={save} className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500">
          Save
        </button>
      </div>
    </div>
  )
}

export function ProgressCalendar() {
  const { data: entries = [] } = useProgressEntries()
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const entryByDate = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries])
  const photoEntries = useMemo(() => entries.filter((e) => e.photo_path), [entries])

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const startOffset = first.getDay()
    const numDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const result: (Date | null)[] = Array(startOffset).fill(null)
    for (let d = 1; d <= numDays; d++) result.push(new Date(month.getFullYear(), month.getMonth(), d))
    return result
  }, [month])

  const todayISO = toISODate(new Date())

  return (
    <div className="rounded-2xl bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-white">Progress log</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="h-7 w-7 rounded-full text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            ‹
          </button>
          <span className="w-28 text-center text-sm text-slate-300">
            {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="h-7 w-7 rounded-full text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-xs text-slate-500">
        {WEEKDAY_LABELS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mb-3 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />
          const iso = toISODate(date)
          const hasEntry = entryByDate.has(iso)
          const isToday = iso === todayISO
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(iso)}
              className={`relative aspect-square rounded-lg text-xs font-medium transition ${
                selectedDate === iso
                  ? 'bg-emerald-600 text-white'
                  : isToday
                    ? 'bg-slate-800 text-emerald-400 ring-1 ring-emerald-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {date.getDate()}
              {hasEntry && selectedDate !== iso && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-400" />
              )}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <div className="mb-3">
          <EntryEditor date={selectedDate} entry={entryByDate.get(selectedDate)} onClose={() => setSelectedDate(null)} />
        </div>
      )}

      {photoEntries.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-slate-500">Recent photos</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photoEntries.map((e) => (
              <PhotoThumb key={e.id} path={e.photo_path!} onClick={() => setSelectedDate(e.date)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
