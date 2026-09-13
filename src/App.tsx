import { useState } from 'react'
import { AuthScreen } from './components/Auth'
import { Layout, type Tab } from './components/Layout'
import { AchievementsView } from './features/achievements/AchievementsView'
import { DietTab } from './features/diet/DietTab'
import { GoalsTab } from './features/goals/GoalsTab'
import { MealsTab } from './features/meals/MealsTab'
import { SettingsTab } from './features/settings/SettingsTab'
import { WorkoutsTab } from './features/workouts/WorkoutsTab'
import { useAuth } from './hooks/useAuth'

type Overlay = 'settings' | 'achievements' | null

function App() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('workouts')
  const [overlay, setOverlay] = useState<Overlay>(null)

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-950">
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
      {overlay === 'settings' && <SettingsTab onBack={() => setOverlay(null)} />}
      {overlay === 'achievements' && <AchievementsView onBack={() => setOverlay(null)} />}
      {!overlay && tab === 'workouts' && <WorkoutsTab onOpenAchievements={() => setOverlay('achievements')} />}
      {!overlay && tab === 'meals' && <MealsTab />}
      {!overlay && tab === 'diet' && <DietTab />}
      {!overlay && tab === 'goals' && <GoalsTab />}
    </Layout>
  )
}

export default App
