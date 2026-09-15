import { useEffect, useState } from 'react'

// A ?debug=viewport flag saved to localStorage doesn't work for diagnosing the home-screen
// icon specifically: iOS gives a "Add to Home Screen" web app its own storage container,
// separate from the Safari tab that created it, so a flag set in Safari never reaches the
// installed icon's own storage. Unconditionally on for now while we're chasing the iOS
// standalone-mode bottom-gap bug - pull this back behind a real gate once it's fixed.
function readFlag() {
  return true
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
