import { useState } from 'react'
import { per100gLine } from '../lib/nutrition'
import { openRoute, useBackToClose, type Route } from '../hooks/useHashRoute'
import { useExercises } from '../hooks/useExercises'
import { useFoodSearch } from '../hooks/useFoods'
import { matchesExercise } from '../lib/exerciseSearch'
import { land } from '../lib/landing'
import { muscleLabel, MUSCLE_GROUPS, type Exercise } from '../types'
import { ExerciseDetailModal } from '../features/workouts/ExerciseDetailModal'

const MUSCLE_LABELS = Object.fromEntries(MUSCLE_GROUPS.map((m) => [m.value, muscleLabel(m.value)]))

/** Every screen, with the words someone might search for to find it. */
const SCREENS: { route: Route; title: string; where: string; words: string }[] = [
  { route: 'workouts', title: 'Log', where: 'Train', words: 'workout sets reps today gym' },
  { route: 'programs', title: 'Programs', where: 'Train', words: 'routine plan push pull legs full body upper lower' },
  { route: 'history', title: 'History', where: 'Train', words: 'past workouts calendar week streak' },
  { route: 'meals', title: 'Meals', where: 'Eat', words: 'food breakfast lunch dinner snack water' },
  { route: 'diet', title: 'Diet', where: 'Eat', words: 'calorie goal target micronutrients projection alcohol' },
  { route: 'fasting', title: 'Fasting', where: 'Eat', words: 'fast intermittent 16:8 omad' },
  { route: 'foods', title: 'Foods', where: 'Eat', words: 'library presets plans diets' },
  { route: 'goals', title: 'Body', where: 'Progress', words: 'weight weigh-in measurements photos goals' },
  { route: 'achievements', title: 'Awards', where: 'Progress', words: 'medals records pr personal best challenge' },
  { route: 'community', title: 'Community', where: 'Community', words: 'shared official diets workouts' },
  { route: 'scanner', title: 'Scan a barcode', where: 'Eat', words: 'barcode scan packaged' },
  { route: 'calculator', title: 'Calorie calculator', where: 'Eat', words: 'maintenance tdee bmr calories' },
  { route: 'plates', title: 'Plate calculator', where: 'Train', words: 'plates barbell loading' },
  { route: 'settings', title: 'Settings', where: 'FitLog', words: 'theme dark light units metric imperial notifications haptics rest timer export password account' },
  { route: 'whatsnew', title: "What's new", where: 'FitLog', words: 'changelog updates' },
  { route: 'feedback', title: 'Feedback & support', where: 'FitLog', words: 'help bug contact support' },
  { route: 'about', title: 'About FitLog', where: 'FitLog', words: 'privacy version' },
]

function matchesScreen(screen: (typeof SCREENS)[number], query: string): boolean {
  const haystack = `${screen.title} ${screen.where} ${screen.words}`.toLowerCase()
  return query.split(/\s+/).every((word) => haystack.includes(word))
}

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  // Back/swipe closes search instead of changing the tab underneath it.
  useBackToClose(true, onClose)
  const [query, setQuery] = useState('')
  const { data: exercises = [] } = useExercises()
  const { data: foods = [] } = useFoodSearch(query)
  const [openExercise, setOpenExercise] = useState<Exercise | null>(null)

  const trimmed = query.trim().toLowerCase()
  const matchedScreens = trimmed ? SCREENS.filter((screen) => matchesScreen(screen, trimmed)).slice(0, 4) : []
  const matchedExercises = trimmed ? exercises.filter((e) => matchesExercise(e.name, trimmed)).slice(0, 8) : []
  const matchedFoods = trimmed ? foods.slice(0, 8) : []
  const hasResults = matchedScreens.length > 0 || matchedExercises.length > 0 || matchedFoods.length > 0

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 pt-[max(0.75rem,var(--safe-area-inset-top,env(safe-area-inset-top)))]">
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search"
          aria-label="Search"
          placeholder="Exercises, foods and screens…"
          className="min-w-0 flex-1 bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
        />
        <button onClick={onClose} className="-mr-2 min-h-11 px-2 text-sm font-medium text-slate-400 hover:text-slate-200">
          Cancel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!trimmed && (
          <p className="mt-8 text-center text-sm text-slate-500">Search your exercises and foods, or type where you want to go.</p>
        )}
        {trimmed && !hasResults && (
          <p className="mt-8 text-center text-sm text-slate-500">No matches for "{query}".</p>
        )}

        {matchedScreens.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 eyebrow">Screens</p>
            <div className="space-y-1.5">
              {matchedScreens.map((screen) => (
                <button
                  key={screen.route}
                  onClick={() => openRoute(screen.route)}
                  className="flex min-h-11 w-full items-center justify-between rounded-xl bg-slate-800/60 px-3 py-2.5 text-left"
                >
                  <span className="text-sm font-medium text-white">{screen.title}</span>
                  <span className="text-xs text-slate-500">{screen.where}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {matchedExercises.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 eyebrow">Exercises</p>
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
            <p className="mb-1.5 eyebrow">Foods</p>
            <div className="space-y-1.5">
              {matchedFoods.map((food) => (
                // Opens the Foods library on it, where it can be edited, labelled or added to a preset.
                <button
                  key={food.id}
                  onClick={() => {
                    land('foodSearch', food.name)
                    openRoute('foods')
                  }}
                  className="block w-full rounded-xl bg-slate-800/60 px-3 py-2.5 text-left"
                >
                  <span className="block text-sm font-medium text-white">{food.name}</span>
                  <span className="block text-xs text-slate-500">{per100gLine(food)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {openExercise && <ExerciseDetailModal exercise={openExercise} onClose={() => setOpenExercise(null)} />}
    </div>
  )
}
