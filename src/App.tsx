import { lazy, Suspense, useEffect, useState } from 'react'
import { AuthScreen, SetNewPasswordScreen } from './components/Auth'
import { Layout, type QuickAddAction } from './components/Layout'
import { OnboardingTour } from './components/OnboardingTour'
import { SkeletonCard } from './components/Skeleton'
import { useApplyTheme } from './hooks/useApplyTheme'
import { useAuth } from './hooks/useAuth'
import { useCelebrateUnlocks } from './hooks/useCelebrateUnlocks'
import { useHashRoute } from './hooks/useHashRoute'
import type { Tab } from './types'

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
  const { user, loading, recoveringPassword, finishPasswordRecovery } = useAuth()
  const { route, navigate, goBack } = useHashRoute()
  // A quick-add request for the tab it navigates to: the tab performs the action (open the
  // exercise picker, add a meal, jump to the fast picker) whenever the nonce changes.
  const [quickAction, setQuickAction] = useState<{ tab: Tab; nonce: number } | null>(null)
  // Drop the request once the user leaves that tab, so coming back later doesn't replay it.
  useEffect(() => {
    if (quickAction && route !== quickAction.tab) setQuickAction(null)
  }, [route, quickAction])
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

  if (recoveringPassword) {
    return <SetNewPasswordScreen onDone={finishPasswordRecovery} />
  }

  const tab: Tab | null = route === 'settings' ? null : route
  const onSettings = route === 'settings'

  function quickAdd(target: Tab) {
    setQuickAction({ tab: target, nonce: Date.now() })
    navigate(target)
  }
  const nonceFor = (target: Tab) => (quickAction?.tab === target ? quickAction.nonce : undefined)

  const quickAddActions: QuickAddAction[] = onSettings
    ? []
    : [
        { key: 'fast', label: 'Start a fast', icon: QUICK_ADD_ICONS.fast, onSelect: () => quickAdd('fasting') },
        { key: 'meal', label: 'Log a meal', icon: QUICK_ADD_ICONS.meal, onSelect: () => quickAdd('meals') },
        { key: 'set', label: 'Log a set', icon: QUICK_ADD_ICONS.set, onSelect: () => quickAdd('workouts') },
      ]

  return (
    <>
      <Layout
        active={tab}
        onChange={navigate}
        onOpenSettings={() => navigate('settings')}
        quickAddActions={quickAddActions}
      >
        <Suspense fallback={<TabFallback />}>
          {onSettings && <SettingsTab onBack={goBack} />}
          {tab === 'workouts' && <WorkoutsTab onOpenHistory={() => navigate('history')} quickAction={nonceFor('workouts')} />}
          {tab === 'meals' && <MealsTab quickAction={nonceFor('meals')} />}
          {tab === 'scanner' && <ScannerTab />}
          {tab === 'diet' && <DietTab />}
          {tab === 'fasting' && <FastingTab quickAction={nonceFor('fasting')} />}
          {tab === 'goals' && <GoalsTab />}
          {tab === 'history' && <HistoryView />}
          {tab === 'achievements' && <AchievementsTab />}
          {tab === 'programs' && <ProgramsTab />}
          {tab === 'calculator' && <MaintenanceCalculatorTab />}
          {tab === 'whatsnew' && <WhatsNewTab />}
          {tab === 'about' && <AboutTab />}
        </Suspense>
      </Layout>
      <OnboardingTour />
    </>
  )
}

export default App
