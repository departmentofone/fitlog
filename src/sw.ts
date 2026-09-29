/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { OPEN_ROUTE_MESSAGE } from './lib/openRoute'
import { REST_ACTIONS, REST_NOTIFICATION_TAG, REST_OFF_HINT, REST_TIMER_MESSAGE, type RichNotificationOptions } from './lib/restNotification'

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
// ignoreSearch: the shell is the same page whatever the query says, so the Play build's
// `/?source=play` launch can use a shell cached from `/` when offline, and the reverse.
registerRoute(new NavigationRoute(new NetworkFirst({ cacheName: 'pages', matchOptions: { ignoreSearch: true } })))

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

// Rest timer: the page posts { type, endsAt } when rest starts or changes, and endsAt: null to
// cancel. Only the latest message counts. At endsAt, the countdown notification is replaced by a
// "Rest over" alert (sound/vibration and a heads-up popup) unless FitLog is on screen, where the
// page shows its own "Rest over". waitUntil keeps the worker alive through the wait; Chrome
// allows up to 5 minutes per event, and the page re-posts while it counts.
let restGeneration = 0

self.addEventListener('message', (event) => {
  const msg = event.data as { type?: string; endsAt?: number | null } | null
  if (msg?.type !== REST_TIMER_MESSAGE) return
  const generation = ++restGeneration
  if (msg.endsAt == null) return
  const endsAt = msg.endsAt
  event.waitUntil(
    new Promise((resolve) => setTimeout(resolve, Math.max(0, endsAt - Date.now()))).then(async () => {
      if (generation !== restGeneration) return
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      if (windows.some((w) => w.visibilityState === 'visible')) return
      const options: RichNotificationOptions = {
        tag: REST_NOTIFICATION_TAG,
        body: `Time for your next set.\n${REST_OFF_HINT}`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        renotify: true,
        silent: false,
        vibrate: [200, 100, 200, 100, 300],
        actions: REST_ACTIONS,
        data: { url: '/#/workouts' },
      }
      await self.registration.showNotification('Rest over', options)
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // The rest timer's "Settings" button opens Settings; everything else opens its own URL.
  const route = event.action === 'settings' ? 'settings' : null
  const url = route ? `/#/${route}` : ((event.notification.data as { url?: string } | undefined)?.url ?? '/')

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          const focused = await client.focus()
          if (route) focused.postMessage({ type: OPEN_ROUTE_MESSAGE, route })
          return focused
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
