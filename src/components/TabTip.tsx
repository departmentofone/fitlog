import { useEffect, useState } from 'react'
import { TAB_TIPS } from '../lib/explainers'
import { ONBOARDING_REPLAY_EVENT, readDismissedTips, writeDismissedTips } from '../lib/onboarding'
import type { Tab } from '../types'
import { ExplainerCard } from './ExplainerCard'

/**
 * The first time someone opens a tab, a short tip says what it's for. Closing it is remembered on
 * this device; Settings → "Show welcome and tips again" brings them all back.
 */
export function TabTip({ tab }: { tab: Tab | null }) {
  const [dismissed, setDismissed] = useState(readDismissedTips)

  useEffect(() => {
    const reset = () => setDismissed(readDismissedTips())
    window.addEventListener(ONBOARDING_REPLAY_EVENT, reset)
    return () => window.removeEventListener(ONBOARDING_REPLAY_EVENT, reset)
  }, [])

  const tip = tab ? TAB_TIPS[tab] : undefined
  if (!tab || !tip || dismissed.includes(tab)) return null

  function close() {
    const next = [...dismissed, tab!]
    setDismissed(next)
    writeDismissedTips(next)
  }

  return (
    <div className="px-4 pt-4">
      <ExplainerCard explainer={tip} onClose={close} />
    </div>
  )
}
