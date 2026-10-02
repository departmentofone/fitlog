/**
 * Whether the app is in the foreground, from Android's own lifecycle (src/native/init.ts keeps it
 * current). The page's visibility isn't reliable inside the app: it can stay "visible" while the
 * app is in the background. Always true on the web.
 */
let active = true

export function setAppActive(value: boolean) {
  active = value
}

export function isAppActive(): boolean {
  return active
}
