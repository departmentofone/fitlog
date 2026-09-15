/**
 * iOS standalone-PWA mode has a known WebKit bug where 100dvh (and historically 100vh) doesn't
 * reliably equal the real usable screen height - it can under-report by a small amount, leaving
 * a gap of the page's own background color below anything sized to it (e.g. a bottom nav bar).
 * This measures the actual visible height in JS and exposes it as --app-height, which every
 * full-height container uses instead of the dvh unit.
 *
 * Two iOS-specific wrinkles beyond "just measure window.innerHeight":
 * 1. `visualViewport.height` is the more reliable source in standalone mode - window.innerHeight
 *    can settle to a slightly different value a frame or two after launch, and plain `resize` on
 *    `window` doesn't reliably fire when that settling happens (no address bar to trigger it, so
 *    nothing tells the page to re-measure). `visualViewport`'s own resize event does fire for it.
 * 2. Even with that listener, the first measurement on cold launch can be taken before WebKit has
 *    finished laying out the safe-area/home-indicator strip. A couple of rAF passes plus a short
 *    delayed re-check catch that late settle without needing to poll indefinitely.
 */
function measure() {
  // Deliberately using the full physical screen height here, not visualViewport/innerHeight
  // (both of which already matched document.documentElement.clientHeight exactly in on-device
  // diagnostics - that's WebKit's own independently-computed usable height, not something our
  // CSS influences, so it was very unlikely to be the gap's cause). Trying screen.height anyway
  // since it's cheap to test and to rule out: the nav bar is pinned with its own `position:
  // fixed; bottom: 0` regardless of this value, so worst case this just leaves some inert empty
  // space at the very end of the scrollable area rather than reintroducing the gap.
  const height = window.screen.height
  document.documentElement.style.setProperty('--app-height', `${height}px`)
}

measure()
window.addEventListener('resize', measure)
window.addEventListener('orientationchange', measure)
window.addEventListener('pageshow', measure)
window.visualViewport?.addEventListener('resize', measure)

// Catch the late-settling height on cold launch (see wrinkle 2 above).
requestAnimationFrame(() => requestAnimationFrame(measure))
setTimeout(measure, 300)
setTimeout(measure, 1000)
