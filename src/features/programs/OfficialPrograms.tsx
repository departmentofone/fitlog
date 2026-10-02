import { useState } from 'react'
import { SkeletonRow } from '../../components/Skeleton'
import { useToast } from '../../components/ToastProvider'
import { usePresets } from '../../hooks/usePresets'
import { useImportProgram, useOfficialPrograms } from '../../hooks/usePrograms'
import { haptics } from '../../lib/haptics'
import type { Program, ProgramWorkout } from '../../types'

/** "Barbell Back Squat · 3 × 5", one line per exercise, in the order the workout lists them. */
function exerciseLines(workout: ProgramWorkout): { name: string; detail: string }[] {
  const byName = new Map<string, number[]>()
  for (const item of workout.items) byName.set(item.exerciseName, [...(byName.get(item.exerciseName) ?? []), item.reps])
  return [...byName.entries()].map(([name, reps]) => ({
    name,
    detail: reps.every((r) => r === reps[0]) ? `${reps.length} × ${reps[0]}` : reps.join(', '),
  }))
}

function joinNames(names: string[]): string {
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

function OfficialProgramCard({ program, presetNames }: { program: Program; presetNames: Set<string> }) {
  const [open, setOpen] = useState(false)
  const importProgram = useImportProgram()
  const { show } = useToast()
  const names = program.workouts.map((w) => w.name)
  // Already added: every workout in it is in your presets by name (the import copies them as presets).
  const added = names.length > 0 && names.every((n) => presetNames.has(n))

  function add() {
    importProgram.mutate(
      { program, applyGoals: false },
      {
        onSuccess: () => {
          haptics.success()
          show(`Added ${joinNames(names)} to your presets. Start them from Train, under Log.`, { duration: 6000 })
        },
        onError: () => show(`Couldn't add ${program.name}. Try again.`),
      },
    )
  }

  return (
    <div className="inset p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug text-white">{program.name}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {program.workouts.length} {program.workouts.length === 1 ? 'workout' : 'workouts'}: {names.join(', ')}
          </p>
        </div>
        <span className="chip chip-accent shrink-0">Official</span>
      </div>
      {program.description && <p className="mt-2 text-sm leading-relaxed text-slate-300">{program.description}</p>}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="-ml-1 mt-1 flex min-h-11 items-center gap-1 px-1 text-sm font-medium text-slate-300"
      >
        {open ? 'Hide the workouts' : 'See the workouts'}
        <svg viewBox="0 0 24 24" className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="fade-in mb-2 space-y-3">
          {program.workouts.map((w) => (
            <div key={w.name}>
              <p className="mb-1 text-xs font-semibold text-slate-400">{w.name}</p>
              <ul className="divide-y divide-white/5 rounded-xl bg-slate-800/60">
                {exerciseLines(w).map((line) => (
                  <li key={line.name} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="min-w-0 text-slate-200">{line.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-slate-400">{line.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs text-slate-500">Sets × reps. Weights start from what you last logged for each exercise.</p>
        </div>
      )}

      {added ? (
        <p className="mt-1 flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 text-sm font-medium text-emerald-400">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          In your presets
        </p>
      ) : (
        <button onClick={add} disabled={importProgram.isPending} className="btn btn-primary mt-1 w-full text-sm">
          {importProgram.isPending ? 'Adding…' : `Add ${program.workouts.length === 1 ? 'the workout' : `all ${program.workouts.length} workouts`} to my presets`}
        </button>
      )}
    </div>
  )
}

/** Train > Programs: FitLog's ready-made programs, each a set of workouts you can add in one tap. */
export function OfficialPrograms() {
  const { data: programs = [], isLoading } = useOfficialPrograms()
  const { data: presets = [] } = usePresets()
  const presetNames = new Set(presets.map((p) => p.name))

  if (!isLoading && programs.length === 0) return null

  return (
    <section className="card p-4">
      <h2 className="card-title">Ready-made programs</h2>
      <p className="mb-3 mt-1 text-sm text-slate-400">
        Pick one and its workouts become presets you start from Train in one tap.
      </p>
      {isLoading ? (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map((program) => (
            <OfficialProgramCard key={program.id} program={program} presetNames={presetNames} />
          ))}
        </div>
      )}
    </section>
  )
}
