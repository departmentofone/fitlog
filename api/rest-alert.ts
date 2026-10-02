import { randomUUID } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { waitUntil } from '@vercel/functions'
import webpush from 'web-push'
import { allowApp } from './_cors.js'
import type { VercelRequest, VercelResponse } from './_vercel.js'

/**
 * Sends the rest timer's "Rest over" alert as a Web Push, so it arrives when the phone is locked
 * or FitLog is in the background. The page can't do this itself: iOS suspends a backgrounded web
 * app's page and service worker within seconds, and Android freezes them, so a timer running on
 * the device never fires.
 *
 * POST, `Authorization: Bearer <the user's access token>`, body:
 *   { inMs: number, subscription: PushSubscriptionJSON }  arm: alert in `inMs` milliseconds
 *   { inMs: null,   subscription: PushSubscriptionJSON }  cancel this device's pending alert
 * The delay is relative so the phone's clock doesn't have to match the server's.
 *
 * The pending alert lives in rest_alerts (migration_v33), one row per device, with a fresh token
 * on every arm. A waiter that finds a different token (re-armed) or no row (cancelled) stops.
 * One invocation waits at most SEGMENT_MS, which covers every normal rest. A longer one (a 5-minute
 * rest) hands the rest of the wait to one fresh invocation of itself, authorised with CRON_SECRET.
 * Keep hand-overs rare: Vercel stops a function that keeps calling itself (508 loop detected).
 * Every +15s tap re-arms from the page, which starts a new invocation with a full time budget.
 *
 * Env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
 * VITE_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET (all already used by other functions).
 */

/** Longest wait one arm may ask for: a 5-minute rest plus many +15s taps, with one hand-over. */
const MAX_DELAY_MS = 9 * 60 * 1000
/** How long one invocation waits before handing over. maxDuration is 300 s (vercel.json). */
const SEGMENT_MS = 270 * 1000
/** Re-check the row this often, so a cancelled or replaced wait ends soon. */
const POLL_MS = 10 * 1000
/** A "Rest over" that arrives a minute late is still worth showing; one from 5 minutes ago isn't. */
const PUSH_TTL_SECONDS = 120
/** Devices one account can have waiting at once. A phone and a tablet is two; this is plenty. */
const MAX_PENDING_PER_USER = 5

/**
 * The push services browsers subscribe through: Chrome/Android/Samsung (FCM), Safari/iOS (Apple),
 * Firefox (Mozilla) and Edge (Windows). Anything else isn't a real subscription, and sending to it
 * would have this server post to an address of the caller's choosing.
 */
function isPushServiceHost(hostname: string): boolean {
  return (
    hostname === 'fcm.googleapis.com' ||
    hostname.endsWith('.push.apple.com') ||
    hostname.endsWith('.push.services.mozilla.com') ||
    hostname.endsWith('.notify.windows.com')
  )
}

type Row = { endpoint: string; p256dh: string; auth: string; ends_at: string; token: string }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)))

function parseSubscription(value: unknown): { endpoint: string; p256dh: string; auth: string } | null {
  const sub = value as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null
  const endpoint = sub?.endpoint
  const p256dh = sub?.keys?.p256dh
  const auth = sub?.keys?.auth
  if (typeof endpoint !== 'string' || typeof p256dh !== 'string' || typeof auth !== 'string') return null
  if (endpoint.length > 1024 || p256dh.length > 256 || auth.length > 256) return null
  try {
    const url = new URL(endpoint)
    if (url.protocol !== 'https:' || !isPushServiceHost(url.hostname)) return null
  } catch {
    return null
  }
  return { endpoint, p256dh, auth }
}

function body(req: VercelRequest): Record<string, unknown> {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return (req.body as Record<string, unknown> | null) ?? {}
}

/**
 * Where to send the hand-over. In production, the production domain, which deployment protection
 * leaves open (the deployment's own URL is behind it). Elsewhere, this deployment, with the
 * protection bypass when the project has one.
 */
function handOverTarget(req: VercelRequest): { url: string; headers: Record<string, string> } {
  if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return { url: `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/api/rest-alert`, headers: {} }
  }
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  return { url: `https://${req.headers.host}/api/rest-alert`, headers: bypass ? { 'x-vercel-protection-bypass': bypass } : {} }
}

/**
 * Whether work can go on after the response. waitUntil quietly does nothing without Vercel's
 * request context, and then an armed alert would never be sent; better to say no, so the page
 * falls back to its own timer.
 */
function canWaitAfterResponse(): boolean {
  const context = (globalThis as Record<symbol, { get?: () => { waitUntil?: unknown } } | undefined>)[
    Symbol.for('@vercel/request-context')
  ]?.get?.()
  return typeof context?.waitUntil === 'function'
}

async function sendRestOver(admin: SupabaseClient, row: Row) {
  const payload = JSON.stringify({
    kind: 'rest',
    title: 'Rest over',
    body: 'Time for your next set.',
    url: '/#/workouts',
    // A phone in deep sleep can get this minutes late; the service worker then says so quietly.
    endsAt: new Date(row.ends_at).getTime(),
  })
  try {
    await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, payload, {
      TTL: PUSH_TTL_SECONDS,
      urgency: 'high',
      topic: 'rest-timer',
      // Without one, a push service that never answers holds this function to its time limit.
      timeout: 10_000,
    })
    console.log('rest alert sent')
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode
    console.error('rest alert push failed', statusCode, err)
    // The device unsubscribed or the subscription expired: the weekly pushes can't reach it either.
    if (statusCode === 404 || statusCode === 410) {
      await admin.from('push_subscriptions').delete().eq('endpoint', row.endpoint)
    }
  }
}

/**
 * Waits for one armed alert. Returns when it was sent, cancelled or replaced, or after handing
 * the rest of the wait to a new invocation.
 */
async function watch(admin: SupabaseClient, endpoint: string, token: string, handOver: () => Promise<void>) {
  const segmentEnds = Date.now() + SEGMENT_MS
  for (;;) {
    const { data, error } = await admin.from('rest_alerts').select('*').eq('endpoint', endpoint).maybeSingle<Row>()
    if (error) {
      // One failed read shouldn't lose the alert; try again shortly while there's time.
      if (Date.now() + 2_000 >= segmentEnds) throw error
      await sleep(2_000)
      continue
    }
    if (!data || data.token !== token) return

    const due = new Date(data.ends_at).getTime()
    const now = Date.now()
    if (due <= now) {
      // Claim it: only the waiter whose delete removes the row sends, so it goes out once.
      const { data: claimed, error: claimError } = await admin
        .from('rest_alerts')
        .delete()
        .eq('endpoint', endpoint)
        .eq('token', token)
        .select()
      if (claimError) throw claimError
      if (claimed?.length) await sendRestOver(admin, data)
      return
    }
    if (due > segmentEnds) {
      if (now + POLL_MS < segmentEnds) {
        await sleep(POLL_MS)
        continue
      }
      await handOver()
      return
    }
    await sleep(Math.min(due - now, POLL_MS))
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (allowApp(req, res)) return
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const secret = process.env.CRON_SECRET
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey || !secret) {
    return res.status(503).json({ error: 'Rest alerts are not configured.' })
  }
  webpush.setVapidDetails('mailto:departmentofone.app@gmail.com', vapidPublicKey, vapidPrivateKey)
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  const input = body(req)

  const handOverFor = (endpoint: string, token: string) => async () => {
    const target = handOverTarget(req)
    const response = await fetch(target.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Rest-Alert-Secret': secret, ...target.headers },
      body: JSON.stringify({ continue: { endpoint, token } }),
    })
    // 508 means Vercel took the hand-overs for a loop.
    if (!response.ok) console.error('rest alert hand-over failed', response.status, await response.text())
  }

  // A hand-over from an earlier invocation of this function.
  if (input.continue) {
    if (req.headers['x-rest-alert-secret'] !== secret) return res.status(401).json({ error: 'Unauthorized' })
    const { endpoint, token } = input.continue as { endpoint?: unknown; token?: unknown }
    if (typeof endpoint !== 'string' || typeof token !== 'string') return res.status(400).json({ error: 'Invalid request.' })
    if (!canWaitAfterResponse()) return res.status(503).json({ error: 'Rest alerts are not available here.' })
    waitUntil(watch(admin, endpoint, token, handOverFor(endpoint, token)).catch((err) => console.error('rest alert wait failed', err)))
    return res.status(202).json({ ok: true })
  }

  const accessToken = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1]
  if (!accessToken) return res.status(401).json({ error: 'Please sign in again.' })
  const anon = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } })
  const { data: userData, error: userError } = await anon.auth.getUser(accessToken)
  const userId = userData.user?.id
  if (userError || !userId) return res.status(401).json({ error: 'Please sign in again.' })

  const sub = parseSubscription(input.subscription)
  if (!sub) return res.status(400).json({ error: 'Invalid push subscription.' })

  if (input.inMs === null) {
    const { error } = await admin.from('rest_alerts').delete().eq('endpoint', sub.endpoint).eq('user_id', userId)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  const inMs = input.inMs
  if (typeof inMs !== 'number' || !Number.isFinite(inMs) || inMs < 0 || inMs > MAX_DELAY_MS) {
    return res.status(400).json({ error: 'Invalid rest length.' })
  }
  if (!canWaitAfterResponse()) return res.status(503).json({ error: 'Rest alerts are not available here.' })

  const { data: others, error: countError } = await admin
    .from('rest_alerts')
    .select('endpoint')
    .eq('user_id', userId)
    .neq('endpoint', sub.endpoint)
  if (countError) return res.status(500).json({ error: countError.message })
  if ((others?.length ?? 0) >= MAX_PENDING_PER_USER) return res.status(429).json({ error: 'Too many rest timers running.' })

  const token = randomUUID()
  const { error } = await admin.from('rest_alerts').upsert(
    {
      endpoint: sub.endpoint,
      user_id: userId,
      p256dh: sub.p256dh,
      auth: sub.auth,
      ends_at: new Date(Date.now() + inMs).toISOString(),
      token,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  )
  if (error) return res.status(500).json({ error: error.message })

  console.log('rest alert armed', Math.round(inMs / 1000), 's')
  waitUntil(watch(admin, sub.endpoint, token, handOverFor(sub.endpoint, token)).catch((err) => console.error('rest alert wait failed', err)))
  return res.status(202).json({ ok: true })
}
