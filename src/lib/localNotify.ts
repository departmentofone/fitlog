/**
 * Fires a local (non-push) notification via the installed service worker, for moments that
 * happen while the app is open but backgrounded/locked - no server, no VAPID subscription
 * required, just the browser's own Notification permission. Silently does nothing if permission
 * was never granted, the SW isn't ready, or the tab is currently focused (no point interrupting
 * someone who's already looking at the screen).
 */
export async function localNotify(title: string, options?: NotificationOptions) {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    if (document.visibilityState === 'visible') return
    if (!('serviceWorker' in navigator)) return
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(title, { icon: '/icon-192.png', badge: '/icon-192.png', ...options })
  } catch {
    // Never let a notification failure break the feature it's attached to.
  }
}
