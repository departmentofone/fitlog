import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useToast } from '../../components/ToastProvider'
import { deleteAccount } from '../../lib/deleteAccount'
import { supabase } from '../../lib/supabase'

const CONFIRM_WORD = 'DELETE'

/**
 * Irreversible, so a higher bar than the app's usual tap-to-confirm + undo: an explicit panel that
 * spells out the consequences, offers an export first, and requires typing DELETE.
 */
export function DeleteAccountCard({ onExport, exporting }: { onExport: () => void; exporting: boolean }) {
  const qc = useQueryClient()
  const { show } = useToast()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await deleteAccount(supabase)
      qc.clear()
      show('Your account and all of its data have been deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't delete your account. Please try again.")
      setDeleting(false)
    }
  }

  // Collapsed it's one quiet row; the full red panel only appears once you ask for it.
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 w-full rounded-2xl px-4 text-left text-sm font-medium text-red-400 active:bg-red-500/10"
      >
        Delete account…
      </button>
    )
  }

  return (
    <div className="rounded-3xl border border-red-500/25 bg-red-500/5 p-4">
      <h3 className="font-medium text-white">Delete account</h3>
        <div className="mt-2 space-y-3 text-sm text-slate-300">
          <p>
            This permanently deletes your account and <b>all</b> of your workouts, meals, goals, fasting and body logs,
            presets, recipes, programs, and photos. <b>It can't be undone.</b>
          </p>
          <p className="text-slate-400">
            If someone else saved a meal or workout using a custom food or exercise you created, that single entry stays
            in the shared library (without your name) so their log keeps working.
          </p>
          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className="min-h-11 w-full rounded-xl bg-slate-800 text-sm font-medium text-slate-200 disabled:opacity-50"
          >
            {exporting ? 'Preparing export…' : 'Export my data first'}
          </button>
          <label className="block text-xs font-medium text-slate-400">
            Type <span className="font-semibold text-slate-200">{CONFIRM_WORD}</span> to confirm
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-base text-white focus:border-red-400 focus:outline-none"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setTyped('')
                setError(null)
              }}
              disabled={deleting}
              className="min-h-11 flex-1 rounded-xl bg-slate-800 text-sm text-slate-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={typed.trim().toUpperCase() !== CONFIRM_WORD || deleting}
              className="min-h-11 flex-1 rounded-xl bg-red-600 text-sm font-semibold text-on-accent disabled:opacity-40"
            >
              {deleting ? 'Deleting…' : 'Delete forever'}
            </button>
          </div>
        </div>
    </div>
  )
}
