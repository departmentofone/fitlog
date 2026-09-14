import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'

/**
 * DRAFT / NOT ENABLED. See PUSH_NOTIFICATIONS.md.
 *
 * This is not wired into a Vercel Cron schedule yet (no `crons` entry in vercel.json), so it
 * only runs if something calls it directly - and even then, push_subscriptions doesn't exist
 * in the database yet, so it has nothing to send to.
 *
 * What's still missing before this is real:
 *  - Run supabase/migration_v9_draft_DO_NOT_RUN_YET.sql (rename it once it's actually ready).
 *  - Set these as *server* env vars in Vercel (never VITE_-prefixed): SUPABASE_SERVICE_ROLE_KEY,
 *    VAPID_PRIVATE_KEY, CRON_SECRET (any random string - Vercel sends it back as a bearer token
 *    when it invokes a scheduled function, which is what the check below verifies).
 *  - Port the real digest computation from src/hooks/useWeeklyDigest.ts to run here per-user
 *    with the service-role client (it currently only runs client-side, scoped to the signed-in
 *    user via RLS). Right now this sends a generic placeholder notification, not real numbers.
 *  - Add a `crons` entry to vercel.json once the above is done, e.g.:
 *      { "crons": [{ "path": "/api/cron/weekly-digest", "schedule": "0 9 * * 0" }] }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
    return res.status(500).json({ error: 'Push notifications are not configured yet.' })
  }

  webpush.setVapidDetails('mailto:msolarovsocial@gmail.com', vapidPublicKey, vapidPrivateKey)

  // service_role bypasses RLS - safe here because this only ever runs server-side in Vercel,
  // never in a browser, and the key is a server-only env var.
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: subscriptions, error } = await supabase.from('push_subscriptions').select('*')
  if (error) return res.status(500).json({ error: error.message })

  const payload = JSON.stringify({
    title: 'Your weekly digest is ready',
    body: "Tap to see this week's progress.",
    url: '/',
  })

  const results = await Promise.allSettled(
    (subscriptions ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          // Subscription is dead (user revoked permission, uninstalled, etc.) - clean it up.
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
        throw err
      }
    }),
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return res.status(200).json({ sent, failed: results.length - sent })
}
