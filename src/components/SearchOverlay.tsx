import { useState } from 'react'
import { useBackToClose } from '../hooks/useHashRoute'
import { useExercises } from '../hooks/useExercises'
import { useFoodSearch } from '../hooks/useFoods'
import { MUSCLE_GROUPS, type Exercise } from '../types'
import { ExerciseDetailModal } from '../features/workouts/ExerciseDetailModal'

const MUSCLE_LABELS = Object.fromEntries(MUSCLE_GROUPS.map((m) => [m.value, m.label]))

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  // Back/swipe closes search instead of changing the tab underneath it.
  useBackToClose(true, onClose)
  const [query, setQuery] = useState('')
  const { data: exercises = [] } = useExercises()
  const { data: foods = [] } = useFoodSearch(query)
  const [openExercise, setOpenExercise] = useState<Exercise | null>(null)

  const trimmed = query.trim().toLowerCase()
  const matchedExercises = trimmed ? exercises.filter((e) => e.name.toLowerCase().includes(trimmed)).slice(0, 8) : []
  const matchedFoods = trimmed ? foods.slice(0, 8) : []
  const hasResults = matchedExercises.length > 0 || matchedFoods.length > 0

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises & foods…"
          className="flex-1 bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
        />
        <button onClick={onClose} className="text-sm font-medium text-slate-400 hover:text-slate-200">
          Cancel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!trimmed && (
          <p className="mt-8 text-center text-sm text-slate-500">Start typing to search your exercises and foods.</p>
        )}
        {trimmed && !hasResults && (
          <p className="mt-8 text-center text-sm text-slate-500">No matches for "{query}".</p>
        )}

        {matchedExercises.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Exercises</p>
            <div className="space-y-1.5">
              {matchedExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setOpenExercise(ex)}
                  className="flex w-full items-center justify-between rounded-xl bg-slate-800/60 px-3 py-2.5 text-left"
                >
                  <span className="text-sm font-medium text-white">{ex.name}</span>
                  <span className="text-xs text-slate-500">{MUSCLE_LABELS[ex.muscle_group] ?? ex.muscle_group}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {matchedFoods.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Foods</p>
            <div className="space-y-1.5">
              {matchedFoods.map((food) => (
                <div key={food.id} className="rounded-xl bg-slate-800/60 px-3 py-2.5">
                  <p className="text-sm font-medium text-white">{food.name}</p>
                  <p className="text-xs text-slate-500">
                    {Math.round(food.calories_per_100g)} kcal · P{Math.round(food.protein_per_100g)}g · C
                    {Math.round(food.carbs_per_100g)}g · F{Math.round(food.fat_per_100g)}g{' '}
                    <span className="text-slate-600">/ 100g</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {openExercise && <ExerciseDetailModal exercise={openExercise} onClose={() => setOpenExercise(null)} />}
    </div>
  )
}
