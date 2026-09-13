import { useState } from 'react'
import { AuthScreen } from './components/Auth'
import { Layout, type Tab } from './components/Layout'
import { MealsTab } from './features/meals/MealsTab'
import { ProgressTab } from './features/progress/ProgressTab'
import { SettingsTab } from './features/settings/SettingsTab'
import { WorkoutsTab } from './features/workouts/WorkoutsTab'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('workouts')

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

  return (
    <Layout active={tab} onChange={setTab}>
      {tab === 'workouts' && <WorkoutsTab />}
      {tab === 'meals' && <MealsTab />}
      {tab === 'progress' && <ProgressTab />}
      {tab === 'settings' && <SettingsTab />}
    </Layout>
  )
}

export default App
