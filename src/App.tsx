import { lazy, Suspense, useState } from 'react'
import { AuthScreen } from './components/Auth'
import { Layout, type QuickAddAction, type Tab } from './components/Layout'
import { OnboardingTour } from './components/OnboardingTour'
import { SkeletonCard } from './components/Skeleton'
import { useApplyTheme } from './hooks/useApplyTheme'
import { useAuth } from './hooks/useAuth'
import { useCelebrateUnlocks } from './hooks/useCelebrateUnlocks'

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
const WhatsNewTab = lazy(() => import('./features/about/WhatsNewTab').then((m) => ({ default: m.WhatsNewTab })))
const HistoryView = lazy(() => import('./features/history/HistoryView').then((m) => ({ default: m.HistoryView })))
const SettingsTab = lazy(() => import('./features/settings/SettingsTab').then((m) => ({ default: m.SettingsTab })))

type Overlay = 'settings' | null

const QUICK_ADD_ICONS = {
  set: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M6.5 6.5l11 11" />
      <path d="M2 5l3 3" />
      <path d="M16 19l3 3" />
      <path d="M14.5 2.5l7 7" />
      <path d="M2.5 14.5l7 7" />
    </svg>
  ),
  meal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M3 2v7c0 1.1.9 2 2 2s2-.9 2-2V2M5 11v11M15 2c-1.7 0-3 2.2-3 5s1.3 5 3 5v9" />
    </svg>
  ),
  fast: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  ),
}

function TabFallback() {
  return (
    <div className="space-y-4 p-4">
      <SkeletonCard />
      <SkeletonCard lines={2} />
    </div>
  )
}

function App() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('workouts')
  const [overlay, setOverlay] = useState<Overlay>(null)
  useApplyTheme()
  useCelebrateUnlocks()

  if (loading) {
    return (
      <div className="flex h-[var(--app-height)] items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-sm space-y-4">
          <SkeletonCard />
        </div>
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

  const quickAddActions: QuickAddAction[] = overlay
    ? []
    : [
        { key: 'fast', label: 'Start a fast', icon: QUICK_ADD_ICONS.fast, onSelect: () => handleTabChange('fasting') },
        { key: 'meal', label: 'Log a meal', icon: QUICK_ADD_ICONS.meal, onSelect: () => handleTabChange('meals') },
        { key: 'set', label: 'Log a set', icon: QUICK_ADD_ICONS.set, onSelect: () => handleTabChange('workouts') },
      ]

  return (
    <>
      <Layout
        active={tab}
        onChange={handleTabChange}
        onOpenSettings={() => setOverlay('settings')}
        quickAddActions={quickAddActions}
      >
        <Suspense fallback={<TabFallback />}>
          {overlay === 'settings' && <SettingsTab onBack={() => setOverlay(null)} />}
          {!overlay && tab === 'workouts' && <WorkoutsTab onOpenHistory={() => handleTabChange('history')} />}
          {!overlay && tab === 'meals' && <MealsTab />}
          {!overlay && tab === 'scanner' && <ScannerTab />}
          {!overlay && tab === 'diet' && <DietTab />}
          {!overlay && tab === 'fasting' && <FastingTab />}
          {!overlay && tab === 'goals' && <GoalsTab />}
          {!overlay && tab === 'history' && <HistoryView />}
          {!overlay && tab === 'achievements' && <AchievementsTab />}
          {!overlay && tab === 'programs' && <ProgramsTab />}
          {!overlay && tab === 'calculator' && <MaintenanceCalculatorTab />}
          {!overlay && tab === 'whatsnew' && <WhatsNewTab />}
          {!overlay && tab === 'about' && <AboutTab />}
        </Suspense>
      </Layout>
      <OnboardingTour />
    </>
  )
}

export default App
