import { useEffect, useState } from 'react'

const STORAGE_KEY = 'fitlog-debug-viewport'

function readFlag() {
  const params = new URLSearchParams(window.location.search)
  const debugParam = params.get('debug')
  if (debugParam === 'viewport') {
    localStorage.setItem(STORAGE_KEY, '1')
  } else if (debugParam === 'off') {
    localStorage.removeItem(STORAGE_KEY)
  }
  return localStorage.getItem(STORAGE_KEY) === '1'
}

function measure() {
  const html = document.documentElement
  const style = getComputedStyle(html)
  return {
    innerHeight: window.innerHeight,
    innerWidth: window.innerWidth,
    visualViewportHeight: window.visualViewport?.height ?? null,
    visualViewportOffsetTop: window.visualViewport?.offsetTop ?? null,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio,
    appHeightVar: style.getPropertyValue('--app-height').trim(),
    safeAreaBottom: getComputedStyle(document.body).paddingBottom || 'n/a',
    standalone: (window.navigator as Navigator & { standalone?: boolean }).standalone ?? 'n/a',
    displayModeStandalone: window.matchMedia('(display-mode: standalone)').matches,
    htmlClientHeight: html.clientHeight,
    docElementScrollHeight: html.scrollHeight,
  }
}

/**
 * Temporary on-screen diagnostic for the iOS-standalone bottom-gap bug. Guarded behind a
 * localStorage flag (armed by visiting once with ?debug=viewport) so it never shows for anyone
 * who hasn't explicitly turned it on, and survives being launched from the home-screen icon
 * afterward without needing the query string baked into the icon's launch URL.
 */
export function ViewportDebugOverlay() {
  const [enabled] = useState(readFlag)
  const [data, setData] = useState(measure)

  useEffect(() => {
    if (!enabled) return
    const update = () => setData(measure())
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    window.visualViewport?.addEventListener('resize', update)
    const interval = setInterval(update, 1000)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      window.visualViewport?.removeEventListener('resize', update)
      clearInterval(interval)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        background: '#fbbf24',
        color: '#000',
        fontFamily: 'monospace',
        fontSize: 10,
        lineHeight: 1.4,
        padding: '4px 6px',
        pointerEvents: 'none',
        whiteSpace: 'pre-wrap',
      }}
    >
      {Object.entries(data)
        .map(([k, v]) => `${k}: ${v}`)
        .join('  |  ')}
    </div>
  )
}
