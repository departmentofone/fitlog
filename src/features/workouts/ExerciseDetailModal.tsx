import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { SkeletonLine } from '../../components/Skeleton'
import { useExerciseNote, useSetExerciseNote } from '../../hooks/useExerciseNotes'
import { useExerciseHistory } from '../../hooks/useWorkouts'
import { estimate1RM } from '../../lib/oneRepMax'
import type { Exercise } from '../../types'

export function ExerciseDetailModal({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const { data: history = [], isLoading } = useExerciseHistory(exercise.id)
  const { data: savedNote } = useExerciseNote(exercise.id)
  const setNote = useSetExerciseNote()

  const [editingNote, setEditingNote] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')

  const working = history.filter((h) => !h.is_warmup)

  const chartData = useMemo(() => {
    const byDate = new Map<string, number>()
    for (const h of working) {
      const oneRm = estimate1RM(h.weight, h.reps)
      byDate.set(h.date, Math.max(byDate.get(h.date) ?? 0, oneRm))
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, oneRm]) => ({
        label: new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        oneRm: Math.round(oneRm),
      }))
  }, [working])

  const bestWeight = working.reduce((max, h) => Math.max(max, h.weight), 0)
  const bestOneRm = working.reduce((max, h) => Math.max(max, estimate1RM(h.weight, h.reps)), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-xl shadow-[var(--glow-shadow)] ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-white">{exercise.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            ×
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2.5">
            <SkeletonLine className="h-16 w-full rounded-2xl" />
            <SkeletonLine className="h-32 w-full rounded-2xl" />
          </div>
        ) : working.length === 0 ? (
          <p className="text-sm text-slate-500">No sets logged yet for this exercise.</p>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-slate-800/60 p-3 text-center">
                <p className="text-lg font-semibold text-white">{bestWeight}kg</p>
                <p className="text-xs text-slate-500">Heaviest set</p>
              </div>
              <div className="rounded-2xl bg-slate-800/60 p-3 text-center">
                <p className="text-lg font-semibold text-white">{Math.round(bestOneRm)}kg</p>
                <p className="text-xs text-slate-500">Est. 1RM</p>
              </div>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#334155' }} tickLine={false} interval={Math.ceil(chartData.length / 5)} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={36} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                    formatter={(value) => [`${value} kg`, 'Est. 1RM']}
                  />
                  <Line type="monotone" dataKey="oneRm" stroke="#34d399" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 mb-3 text-center text-xs text-slate-500">Estimated 1-rep max over time (Epley formula)</p>
          </>
        )}

        <div className="border-t border-white/5 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</p>
            {!editingNote && (
              <button
                onClick={() => {
                  setNoteDraft(savedNote ?? '')
                  setEditingNote(true)
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                {savedNote ? 'Edit' : '+ Add note'}
              </button>
            )}
          </div>
          {editingNote ? (
            <div>
              <textarea
                autoFocus
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Seat height, grip width, cues…"
                rows={3}
                className="mb-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button onClick={() => setEditingNote(false)} className="flex-1 rounded-xl bg-slate-800 py-1.5 text-sm text-slate-300 hover:bg-slate-700">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setNote.mutate({ exerciseId: exercise.id, notes: noteDraft.trim() })
                    setEditingNote(false)
                  }}
                  className="flex-1 rounded-xl bg-emerald-600 py-1.5 text-sm font-medium text-on-accent hover:brightness-90"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">{savedNote || 'No notes yet.'}</p>
          )}
        </div>
      </div>
    </div>
  )
}
