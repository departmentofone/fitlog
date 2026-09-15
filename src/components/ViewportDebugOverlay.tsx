import { useEffect, useState } from 'react'

// A ?debug=viewport flag saved to localStorage doesn't work for diagnosing the home-screen
// icon specifically: iOS gives a "Add to Home Screen" web app its own storage container,
// separate from the Safari tab that created it, so a flag set in Safari never reaches the
// installed icon's own storage. Unconditionally on for now while we're chasing the iOS
// standalone-mode bottom-gap bug - pull this back behind a real gate once it's fixed.
function readFlag() {
  return true
}

// Reads what a raw CSS unit resolves to, independent of anything window.innerHeight or
// visualViewport.height report - those two could plausibly be downstream of the same
// (possibly buggy) internal viewport value, so agreeing with each other doesn't actually
// prove either is correct. A probe element sized with the unit is the only way to see what
// the CSS layout engine itself resolves it to.
function probeUnit(unit: string): number {
  const el = document.createElement('div')
  el.style.cssText = `position:absolute;visibility:hidden;width:0;height:100${unit};`
  document.body.appendChild(el)
  const height = el.offsetHeight
  document.body.removeChild(el)
  return height
}

function measure() {
  const html = document.documentElement
  const style = getComputedStyle(html)
  const nav = document.querySelector('nav')
  const navRect = nav?.getBoundingClientRect()
  return {
    innerHeight: window.innerHeight,
    visualViewportHeight: window.visualViewport?.height ?? null,
    screenHeight: window.screen.height,
    appHeightVar: style.getPropertyValue('--app-height').trim(),
    cssDvh: probeUnit('dvh'),
    cssSvh: probeUnit('svh'),
    cssLvh: probeUnit('lvh'),
    cssVh: probeUnit('vh'),
    cssPercent: probeUnit('%'),
    navBottom: navRect?.bottom ?? 'no nav',
    navTop: navRect?.top ?? 'no nav',
    navHeight: navRect?.height ?? 'no nav',
    htmlClientHeight: html.clientHeight,
    standalone: (window.navigator as Navigator & { standalone?: boolean }).standalone ?? 'n/a',
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
