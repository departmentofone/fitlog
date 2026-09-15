/**
 * iOS's WebKit reserves space for a hideable browser toolbar in its "dynamic viewport" height
 * (window.innerHeight, visualViewport.height, and CSS dvh/svh all agree on this shrunk value)
 * even in standalone/home-screen mode, where no such toolbar exists or can ever appear. On-device
 * measurement confirmed this directly: in standalone mode, innerHeight/visualViewport.height/dvh
 * all under-report by exactly the gap's size, while window.screen.height and the CSS lvh/vh units
 * agree on the true full height - so anything sized off the dynamic-viewport value is left short,
 * leaving a gap of the page's own background below it (e.g. the bottom nav).
 *
 * In a regular browser tab this reservation is correct and wanted (it's what stops content from
 * getting hidden behind the browser's own address bar as it shows/hides), so only bypass it in
 * standalone mode specifically, where screen.height is the right source of truth instead.
 */
function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function measure() {
  const height = isStandalone() ? window.screen.height : (window.visualViewport?.height ?? window.innerHeight)
  document.documentElement.style.setProperty('--app-height', `${height}px`)
}

measure()
window.addEventListener('resize', measure)
window.addEventListener('orientationchange', measure)
window.addEventListener('pageshow', measure)
window.visualViewport?.addEventListener('resize', measure)

// Catch any late-settling height on cold launch.
requestAnimationFrame(() => requestAnimationFrame(measure))
setTimeout(measure, 300)
setTimeout(measure, 1000)
