import { parseDecimal } from '../../lib/number'
import { useMemo, useState } from 'react'
import { MonthCalendar } from '../../components/MonthCalendar'
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
import { PhotoCompare } from './PhotoCompare'

function PhotoThumb({ path, onClick }: { path: string; onClick?: () => void }) {
  const { data: url } = useSignedPhotoUrl(path)
  if (!url) return <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-slate-800" />
  return (
    <img
      src={url}
      onClick={onClick}
      className="h-20 w-20 shrink-0 rounded-xl object-cover"
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
    const parsed = parseDecimal(weight)
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
    <div className="rounded-2xl bg-slate-800/60 p-3">
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
          <img src={photoUrl} alt="Progress" className="h-20 w-20 rounded-xl object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-800" />
        )}
        <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-slate-600 px-3 py-2 text-center text-xs font-medium text-slate-300 hover:border-emerald-500 hover:text-emerald-400">
          {uploading ? 'Uploading…' : entry?.photo_path ? 'Replace photo' : 'Add photo'}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      </div>

      <input
        type="text"
        inputMode="decimal"
        placeholder={`Weight (${unit})`}
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="mb-2 w-full field px-3 py-2"
      />
      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="mb-3 w-full resize-none field px-3 py-2"
      />

      <div className="flex gap-2">
        {entry && (
          <button
            onClick={() => {
              deleteEntry.mutate(entry)
              onClose()
            }}
            className="rounded-xl bg-red-600/20 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-600/30"
          >
            Delete
          </button>
        )}
        <button onClick={save} className="btn btn-primary flex-1 py-2 text-sm">
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
  const [comparing, setComparing] = useState(false)

  const entryByDate = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries])
  const photoEntries = useMemo(() => entries.filter((e) => e.photo_path), [entries])
  const markedDates = useMemo(() => new Set(entries.map((e) => e.date)), [entries])

  if (comparing) {
    return <PhotoCompare entries={photoEntries} onBack={() => setComparing(false)} />
  }

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-white">Progress log</h3>
        {photoEntries.length >= 2 && (
          <button onClick={() => setComparing(true)} className="text-xs font-medium text-emerald-400 hover:text-emerald-300">
            Compare photos
          </button>
        )}
      </div>

      <MonthCalendar
        month={month}
        onMonthChange={setMonth}
        markedDates={markedDates}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {selectedDate && (
        <div className="mt-3 mb-3">
          <EntryEditor date={selectedDate} entry={entryByDate.get(selectedDate)} onClose={() => setSelectedDate(null)} />
        </div>
      )}

      {photoEntries.length > 0 && (
        <div className="mt-3">
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
