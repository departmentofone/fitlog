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
      <div className="tile p-3">
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
          className="w-full resize-none field px-3 py-2 text-sm"
        />
        <div className="mt-2 flex gap-2">
          <button onClick={() => setEditing(false)} className="btn btn-secondary flex-1 text-sm">
            Cancel
          </button>
          <button onClick={save} className="btn btn-primary flex-1 text-sm">
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
      className="w-full tile px-3 py-2.5 text-left"
    >
      <span className="mb-0.5 block text-xs font-medium text-slate-400">Workout note</span>
      <span className="block whitespace-pre-wrap text-sm text-slate-200">{session.notes}</span>
    </button>
  )
}
