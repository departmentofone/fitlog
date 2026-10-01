/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { OPEN_ROUTE_MESSAGE } from './lib/openRoute'
import { REST_ACTIONS, REST_NOTIFICATION_TAG, REST_OFF_HINT, REST_TIMER_MESSAGE, type RichNotificationOptions } from './lib/restNotificationShared'

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
  /** 'rest': the rest timer's "Rest over", sent by api/rest-alert.ts at the end of rest. */
  kind?: string
  /** For 'rest': when rest ended (ms since epoch). */
  endsAt?: number
}

/** Later than this, "Rest over" no longer alerts: the phone was asleep and the moment has passed. */
const REST_LATE_MS = 60 * 1000

/** The "Rest over" alert: replaces the "Resting" notification, with sound, vibration and a popup. */
function restOverOptions(body: string): RichNotificationOptions {
  return {
    tag: REST_NOTIFICATION_TAG,
    body: `${body}\n${REST_OFF_HINT}`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    renotify: true,
    silent: false,
    vibrate: [200, 100, 200, 100, 300],
    actions: REST_ACTIONS,
    data: { url: '/#/workouts' },
  }
}

// Every push must end in a shown notification, even with FitLog on screen: Safari counts a push
// that shows nothing as "silent" and, after three (ever), drops every push subscription FitLog has
// on that device. So no early returns, and a failure falls back to a plain notification.
self.addEventListener('push', (event) => {
  let payload: PushPayload
  try {
    payload = event.data?.json() ?? { title: 'FitLog', body: '' }
  } catch {
    payload = { title: 'FitLog', body: event.data?.text() ?? '' }
  }

  let shown: Promise<void>
  if (payload.kind === 'rest') {
    // The server alert arrived, so the stand-in timer below must not alert as well. When FitLog is
    // on screen, the page cancels the server alert just before rest ends instead.
    restGeneration++
    const late = typeof payload.endsAt === 'number' && Date.now() - payload.endsAt > REST_LATE_MS
    if (late) {
      const at = new Date(payload.endsAt!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      const quiet: RichNotificationOptions = { ...restOverOptions(payload.body), renotify: false, silent: true, vibrate: undefined }
      shown = self.registration.showNotification(`Rest ended at ${at}`, quiet)
    } else {
      shown = self.registration.showNotification(payload.title || 'Rest over', restOverOptions(payload.body))
    }
  } else {
    shown = self.registration.showNotification(payload.title || 'FitLog', {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: payload.url ?? '/' },
    })
  }
  event.waitUntil(shown.catch(() => self.registration.showNotification('FitLog', { icon: '/icon-192.png' }).catch(() => undefined)))
})

// Rest timer stand-in, for devices that can't receive the server's push (see restNotification.ts):
// the page posts { type, endsAt } when rest starts or changes, and endsAt: null to cancel. Only the
// latest message counts. At endsAt, the "Rest over" alert replaces the countdown unless FitLog is
// on screen, where the page shows its own "Rest over". waitUntil keeps the worker alive through
// the wait while the browser lets it; Chrome allows up to 5 minutes per event, and the page
// re-posts while it counts.
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
      await self.registration.showNotification('Rest over', restOverOptions('Time for your next set.'))
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
