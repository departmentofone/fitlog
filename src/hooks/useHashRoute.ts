import { useCallback, useEffect, useRef, useState } from 'react'
import type { Tab } from '../types'

/**
 * Where the app is: one of the main tabs, or the full-screen Settings view. Mirrored into the URL
 * hash (`#/meals`, `#/settings`) with a real history entry per change, so the Android back button /
 * iOS back swipe step back through screens instead of closing the app, and a reload lands where
 * you were. Hash routing needs no server rewrites, so Vercel and the service worker are unaffected.
 */
export type Route = Tab | 'settings'

// A Record rather than a list so TypeScript flags a new tab that's missing here. Foods and
// Community were missed once, so a reload or the back button dropped you on Workouts.
const ROUTE_KEYS: Record<Route, true> = {
  workouts: true,
  meals: true,
  scanner: true,
  diet: true,
  fasting: true,
  goals: true,
  history: true,
  achievements: true,
  programs: true,
  foods: true,
  community: true,
  calculator: true,
  plates: true,
  whatsnew: true,
  about: true,
  feedback: true,
  tips: true,
  settings: true,
}
const ROUTES = Object.keys(ROUTE_KEYS) as Route[]

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
 * Opens a screen from code that has no `navigate` to hand (a sheet, a deeply nested form). Same
 * history rules as navigate: a new entry, or the open layer's entry reused so back returns in one
 * step. The popstate it sends is what the router (and any open layer, which then closes) listen to.
 */
export function openRoute(next: Route) {
  if (parseRoute(window.location.hash) === next) return
  const state = { fitlogRoute: true }
  if (history.state?.fitlogLayer) history.replaceState(state, '', `#/${next}`)
  else history.pushState(state, '', `#/${next}`)
  window.dispatchEvent(new PopStateEvent('popstate', { state }))
}

/**
 * Lets the system back gesture close a transient layer (drawer, search sheet) instead of leaving
 * the screen under it. Pushes a same-URL history entry while `open`; closing by any other means
 * pops that entry again so history never accumulates dead steps. Escape closes it too, for a
 * keyboard on the web. With layers stacked, only the top one closes per back press or Escape.
 */
export function useBackToClose(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const layerId = Math.random().toString(36).slice(2)
    history.pushState({ fitlogLayer: layerId }, '', window.location.href)
    let poppedByUser = false
    const onPop = () => {
      // Back closed a layer opened on top of this one: this one is on top again and stays open.
      if (history.state?.fitlogLayer === layerId) return
      poppedByUser = true
      onCloseRef.current()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || history.state?.fitlogLayer !== layerId) return
      e.preventDefault()
      history.back()
    }
    window.addEventListener('popstate', onPop)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('keydown', onKey)
      if (poppedByUser) return
      // Deferred, and only if our own entry is still on top: a synchronous back() here would land
      // after an immediate re-open (React StrictMode re-runs effects) pushed a new entry, and close it.
      setTimeout(() => {
        if (history.state?.fitlogLayer === layerId) history.back()
      }, 0)
    }
  }, [open])
}
