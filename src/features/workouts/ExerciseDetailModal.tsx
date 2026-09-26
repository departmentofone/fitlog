import { CHART_FONT, useThemeChartColors } from '../../lib/useChartColors'
import { useBackToClose } from '../../hooks/useHashRoute'
import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { SkeletonLine } from '../../components/Skeleton'
import { useExerciseNote, useSetExerciseNote } from '../../hooks/useExerciseNotes'
import { useUserSettings } from '../../hooks/useUserSettings'
import { useExerciseHistory } from '../../hooks/useWorkouts'
import { estimate1RM } from '../../lib/oneRepMax'
import { formatWeight, toDisplayTotal, weightUnitLabel } from '../../lib/units'
import type { Exercise } from '../../types'

export function ExerciseDetailModal({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  useBackToClose(true, onClose)
  const colors = useThemeChartColors()
  const { data: history = [], isLoading } = useExerciseHistory(exercise.id)
  const { data: savedNote } = useExerciseNote(exercise.id)
  const setNote = useSetExerciseNote()
  const { data: settings } = useUserSettings()
  const unit = settings?.unit_system

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
        oneRm: Math.round(toDisplayTotal(oneRm, unit)),
      }))
  }, [working, unit])

  const bestWeight = working.reduce((max, h) => Math.max(max, h.weight), 0)
  const bestOneRm = working.reduce((max, h) => Math.max(max, estimate1RM(h.weight, h.reps)), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center" onClick={onClose}>
      <div
        className="max-h-[calc(var(--app-height)-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-sm overflow-y-auto overscroll-contain rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-xl shadow-[var(--glow-shadow)] ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="card-title">{exercise.name}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-my-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 active:bg-white/10"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
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
                <p className="text-lg font-semibold text-white">{formatWeight(bestWeight, unit, '')}</p>
                <p className="text-xs text-slate-500">Heaviest set</p>
              </div>
              <div className="rounded-2xl bg-slate-800/60 p-3 text-center">
                <p className="text-lg font-semibold text-white">{Math.round(toDisplayTotal(bestOneRm, unit))}{weightUnitLabel(unit)}</p>
                <p className="text-xs text-slate-500">Est. 1RM</p>
              </div>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="label" tick={{ fill: colors.tick, fontSize: 10, fontFamily: CHART_FONT }} axisLine={{ stroke: colors.axis }} tickLine={false} interval={Math.ceil(chartData.length / 5)} />
                  <YAxis tick={{ fill: colors.tick, fontSize: 11, fontFamily: CHART_FONT }} axisLine={false} tickLine={false} width={36} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip
                    contentStyle={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: 8, fontFamily: CHART_FONT }}
                    labelStyle={{ color: colors.tooltipText }}
                    formatter={(value) => [`${value} ${weightUnitLabel(unit)}`, 'Est. 1RM']}
                  />
                  <Line type="monotone" dataKey="oneRm" stroke={colors.accent} strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 mb-3 text-center text-xs text-slate-500">Estimated 1-rep max over time (Epley formula)</p>
          </>
        )}

        <div className="border-t border-white/5 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="eyebrow">Notes</p>
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
                className="mb-2 w-full resize-none field px-3 py-2 text-sm"
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
                  className="btn btn-primary flex-1 py-1.5 text-sm"
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
