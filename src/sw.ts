/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

declare let self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()

// index.html is deliberately excluded from the precache manifest (see injectManifest's
// globPatterns in vite.config.ts) so navigations go through this network-first route instead
// of precacheAndRoute's default cache-first handling. A big part of why the iOS bottom-gap fix
// took this many rounds to actually reach the phone: cache-first on the HTML shell meant a
// stale service worker could keep serving its own old bundle indefinitely, even across a real
// cold process restart, since only a genuinely new deploy check (which nothing was forcing)
// could ever replace it. Network-first means every normal launch/reload picks up the latest
// deploy when a connection is available, falling back to the last cached shell only when
// offline - exactly the tradeoff a workout logger should make.
registerRoute(new NavigationRoute(new NetworkFirst({ cacheName: 'pages' })))

precacheAndRoute(self.__WB_MANIFEST)

interface PushPayload {
  title: string
  body: string
  url?: string
}

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload: PushPayload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'FitLog', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: payload.url ?? '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow(url)
    }),
  )
})
