import { lazy, Suspense, useState } from 'react'
import { AuthScreen } from './components/Auth'
import { Layout, type Tab } from './components/Layout'
import { useApplyTheme } from './hooks/useApplyTheme'
import { useAuth } from './hooks/useAuth'

const WorkoutsTab = lazy(() => import('./features/workouts/WorkoutsTab').then((m) => ({ default: m.WorkoutsTab })))
const MealsTab = lazy(() => import('./features/meals/MealsTab').then((m) => ({ default: m.MealsTab })))
const DietTab = lazy(() => import('./features/diet/DietTab').then((m) => ({ default: m.DietTab })))
const GoalsTab = lazy(() => import('./features/goals/GoalsTab').then((m) => ({ default: m.GoalsTab })))
const MiscTab = lazy(() => import('./features/misc/MiscTab').then((m) => ({ default: m.MiscTab })))
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
      <div className="flex h-full items-center justify-center bg-slate-950">
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
    <Layout active={tab} onChange={handleTabChange} onOpenSettings={() => setOverlay('settings')}>
      <Suspense fallback={<TabFallback />}>
        {overlay === 'settings' && <SettingsTab onBack={() => setOverlay(null)} />}
        {overlay === 'history' && <HistoryView onBack={() => setOverlay(null)} />}
        {!overlay && tab === 'workouts' && <WorkoutsTab onOpenHistory={() => setOverlay('history')} />}
        {!overlay && tab === 'meals' && <MealsTab />}
        {!overlay && tab === 'diet' && <DietTab />}
        {!overlay && tab === 'goals' && <GoalsTab />}
        {!overlay && tab === 'misc' && <MiscTab />}
      </Suspense>
    </Layout>
  )
}

export default App
