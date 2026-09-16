import { lazy, Suspense, useState } from 'react'
import { AuthScreen } from './components/Auth'
import { Layout, type Tab } from './components/Layout'
import { OnboardingTour } from './components/OnboardingTour'
import { useApplyTheme } from './hooks/useApplyTheme'
import { useAuth } from './hooks/useAuth'

const WorkoutsTab = lazy(() => import('./features/workouts/WorkoutsTab').then((m) => ({ default: m.WorkoutsTab })))
const MealsTab = lazy(() => import('./features/meals/MealsTab').then((m) => ({ default: m.MealsTab })))
const ScannerTab = lazy(() => import('./features/scanner/ScannerTab').then((m) => ({ default: m.ScannerTab })))
const DietTab = lazy(() => import('./features/diet/DietTab').then((m) => ({ default: m.DietTab })))
const FastingTab = lazy(() => import('./features/fasting/FastingTab').then((m) => ({ default: m.FastingTab })))
const GoalsTab = lazy(() => import('./features/goals/GoalsTab').then((m) => ({ default: m.GoalsTab })))
const AchievementsTab = lazy(() => import('./features/achievements/AchievementsTab').then((m) => ({ default: m.AchievementsTab })))
const ProgramsTab = lazy(() => import('./features/programs/ProgramsTab').then((m) => ({ default: m.ProgramsTab })))
const MaintenanceCalculatorTab = lazy(() =>
  import('./features/calculator/MaintenanceCalculatorTab').then((m) => ({ default: m.MaintenanceCalculatorTab })),
)
const AboutTab = lazy(() => import('./features/about/AboutTab').then((m) => ({ default: m.AboutTab })))
const HistoryView = lazy(() => import('./features/history/HistoryView').then((m) => ({ default: m.HistoryView })))
const SettingsTab = lazy(() => import('./features/settings/SettingsTab').then((m) => ({ default: m.SettingsTab })))

type Overlay = 'settings' | 'history' | null

function TabFallback() {
  return <p className="p-4 text-slate-400">Loading…</p>
}

function App() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('workouts')
  const [overlay, setOverlay] = useState<Overlay>(null)
  useApplyTheme()

  if (loading) {
    return (
      <div className="flex h-[var(--app-height)] items-center justify-center bg-slate-950">
        <p className="text-slate-400">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  function handleTabChange(next: Tab) {
    setOverlay(null)
    setTab(next)
  }

  return (
    <>
      <Layout active={tab} onChange={handleTabChange} onOpenSettings={() => setOverlay('settings')}>
        <Suspense fallback={<TabFallback />}>
          {overlay === 'settings' && <SettingsTab onBack={() => setOverlay(null)} />}
          {overlay === 'history' && <HistoryView onBack={() => setOverlay(null)} />}
          {!overlay && tab === 'workouts' && <WorkoutsTab onOpenHistory={() => setOverlay('history')} />}
          {!overlay && tab === 'meals' && <MealsTab />}
          {!overlay && tab === 'scanner' && <ScannerTab />}
          {!overlay && tab === 'diet' && <DietTab />}
          {!overlay && tab === 'fasting' && <FastingTab />}
          {!overlay && tab === 'goals' && <GoalsTab />}
          {!overlay && tab === 'achievements' && <AchievementsTab />}
          {!overlay && tab === 'programs' && <ProgramsTab />}
          {!overlay && tab === 'calculator' && <MaintenanceCalculatorTab />}
          {!overlay && tab === 'about' && <AboutTab />}
        </Suspense>
      </Layout>
      <OnboardingTour />
    </>
  )
}

export default App
