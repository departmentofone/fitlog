/**
 * iOS standalone-PWA mode has a known WebKit bug where 100dvh (and historically 100vh) doesn't
 * reliably equal the real usable screen height - it can under-report by a small amount, leaving
 * a gap of the page's own background color below anything sized to it (e.g. a bottom nav bar).
 * This measures the actual visible height in JS and exposes it as --app-height, which every
 * full-height container uses instead of the dvh unit. Recomputed on resize/orientation change
 * (covers rotation and the keyboard showing/hiding).
 */
function setAppHeight() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
}

setAppHeight()
window.addEventListener('resize', setAppHeight)
window.addEventListener('orientationchange', setAppHeight)
