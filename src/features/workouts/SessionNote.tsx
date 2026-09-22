import { useState } from 'react'
import { useSetSessionNote } from '../../hooks/useWorkouts'
import type { WorkoutSession } from '../../types'

const MAX_LENGTH = 1000

/**
 * One note per workout (Strong's "workout note"): how the session went, what you changed, anything
 * worth remembering next time. Per-exercise reminders that carry over between sessions already live
 * in each exercise's detail view. Stays a single quiet line until it's used.
 */
export function SessionNote({ session }: { session: WorkoutSession }) {
  const setNote = useSetSessionNote()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  function startEditing() {
    setDraft(session.notes ?? '')
    setEditing(true)
  }

  function save() {
    if (draft.trim() !== (session.notes ?? '')) setNote.mutate({ sessionId: session.id, notes: draft })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-2xl border-t border-white/10 bg-slate-900 p-3 ring-1 ring-white/5">
        <label htmlFor="session-note" className="mb-1.5 block text-xs font-medium text-slate-400">
          Workout note
        </label>
        <textarea
          id="session-note"
          autoFocus
          rows={3}
          maxLength={MAX_LENGTH}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="How did it go? Anything to remember next time?"
          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <div className="mt-2 flex gap-2">
          <button onClick={() => setEditing(false)} className="min-h-11 flex-1 rounded-xl bg-slate-800 text-sm text-slate-300">
            Cancel
          </button>
          <button onClick={save} className="min-h-11 flex-1 rounded-xl bg-emerald-600 text-sm font-semibold text-on-accent">
            Save note
          </button>
        </div>
      </div>
    )
  }

  if (!session.notes) {
    return (
      <button onClick={startEditing} className="min-h-11 w-full rounded-xl text-left text-sm text-slate-500 active:text-slate-300">
        + Add a note to this workout
      </button>
    )
  }

  return (
    <button
      onClick={startEditing}
      aria-label="Edit workout note"
      className="w-full rounded-2xl border-t border-white/10 bg-slate-900 px-3 py-2.5 text-left ring-1 ring-white/5"
    >
      <span className="mb-0.5 block text-xs font-medium text-slate-400">Workout note</span>
      <span className="block whitespace-pre-wrap text-sm text-slate-200">{session.notes}</span>
    </button>
  )
}
