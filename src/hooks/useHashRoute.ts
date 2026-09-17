import { useCallback, useEffect, useRef, useState } from 'react'
import type { Tab } from '../types'

/**
 * Where the app is: one of the main tabs, or the full-screen Settings view. Mirrored into the URL
 * hash (`#/meals`, `#/settings`) with a real history entry per change, so the Android back button /
 * iOS back swipe step back through screens instead of closing the app, and a reload lands where
 * you were. Hash routing needs no server rewrites, so Vercel and the service worker are unaffected.
 */
export type Route = Tab | 'settings'

const ROUTES: Route[] = [
  'workouts',
  'meals',
  'scanner',
  'diet',
  'fasting',
  'goals',
  'history',
  'achievements',
  'programs',
  'calculator',
  'whatsnew',
  'about',
  'settings',
]

const DEFAULT_ROUTE: Route = 'workouts'

export function parseRoute(hash: string): Route {
  const key = hash.replace(/^#\/?/, '').split(/[/?]/)[0]
  return (ROUTES as string[]).includes(key) ? (key as Route) : DEFAULT_ROUTE
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))

  useEffect(() => {
    // Normalize a bare or unknown URL without adding a history entry - except an auth callback
    // (`#access_token=…&type=recovery`, `#error=…`), which Supabase still needs to read.
    const canonical = `#/${parseRoute(window.location.hash)}`
    const isAuthCallback = window.location.hash.includes('=')
    if (!isAuthCallback && window.location.hash !== canonical) history.replaceState(history.state, '', canonical)

    const sync = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const navigate = useCallback((next: Route) => {
    if (parseRoute(window.location.hash) === next) return
    // Picking a destination from an open layer (the menu drawer) reuses that layer's history entry,
    // so back from the new screen returns to the old one in a single step.
    if (history.state?.fitlogLayer) history.replaceState({ fitlogRoute: true }, '', `#/${next}`)
    else history.pushState({ fitlogRoute: true }, '', `#/${next}`)
    setRoute(next)
  }, [])

  /** Leave the current screen: a real history step back when we pushed one, otherwise go home. */
  const goBack = useCallback(() => {
    if (history.state?.fitlogRoute) history.back()
    else {
      history.replaceState(null, '', `#/${DEFAULT_ROUTE}`)
      setRoute(DEFAULT_ROUTE)
    }
  }, [])

  return { route, navigate, goBack }
}

/**
 * Lets the system back gesture close a transient layer (drawer, search sheet) instead of leaving
 * the screen under it. Pushes a same-URL history entry while `open`; closing by any other means
 * pops that entry again so history never accumulates dead steps.
 */
export function useBackToClose(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const layerId = Math.random().toString(36).slice(2)
    history.pushState({ fitlogLayer: layerId }, '', window.location.href)
    let poppedByUser = false
    const onPop = () => {
      poppedByUser = true
      onCloseRef.current()
    }
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      if (poppedByUser) return
      // Deferred, and only if our own entry is still on top: a synchronous back() here would land
      // after an immediate re-open (React StrictMode re-runs effects) pushed a new entry, and close it.
      setTimeout(() => {
        if (history.state?.fitlogLayer === layerId) history.back()
      }, 0)
    }
  }, [open])
}
