import { useState, type ReactNode } from 'react'
import { GuidelinesSheet } from '../features/community/GuidelinesSheet'
import { useUpdateSettings, useUserSettings } from './useUserSettings'

/**
 * Wraps a "Share to Community" toggle: the first time an account shares anything, it has to agree
 * to the Community guidelines first. Turning sharing off never asks. Render `sheet` somewhere in
 * the component.
 *
 *   onChange={(e) => gate.request(e.target.checked, (on) => setShared.mutate({ id, isShared: on }))}
 */
export function useShareGate(): { request: (on: boolean, apply: (on: boolean) => void) => void; sheet: ReactNode } {
  const { data: settings } = useUserSettings()
  const update = useUpdateSettings()
  const [pending, setPending] = useState<(() => void) | null>(null)

  function request(on: boolean, apply: (on: boolean) => void) {
    if (!on || settings?.community_guidelines_accepted_at) return apply(on)
    setPending(() => () => apply(true))
  }

  const sheet = pending ? (
    <GuidelinesSheet
      agreeing={update.isPending}
      onClose={() => setPending(null)}
      onAgree={() => {
        update.mutate({ community_guidelines_accepted_at: new Date().toISOString() })
        pending()
        setPending(null)
      }}
    />
  ) : null

  return { request, sheet }
}
