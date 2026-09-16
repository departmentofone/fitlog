import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'

/**
 * Sends each subscribed user their real weekly digest numbers (not a generic placeholder).
 * Requires: migration_v9_push_subscriptions.sql run, and SUPABASE_SERVICE_ROLE_KEY /
 * VAPID_PRIVATE_KEY / VITE_VAPID_PUBLIC_KEY / CRON_SECRET set as *server* env vars in Vercel
 * (never VITE_-prefixed beyond the one that's meant to be public) - see PUSH_NOTIFICATIONS.md.
 * Wire it to a schedule via vercel.json's `crons` entry once those are in place.
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

  const userIds = Array.from(new Set((subscriptions ?? []).map((s) => s.user_id as string)))

  function iso(d: Date) {
    return d.toISOString().slice(0, 10)
  }

  async function digestFor(userId: string) {
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - 6)

    const [sessions, meals] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('id, workout_sets!inner(id)')
        .eq('user_id', userId)
        .gte('date', iso(start))
        .lte('date', iso(today)),
      supabase
        .from('meals')
        .select('meal_items(grams, food:foods(calories_per_100g))')
        .eq('user_id', userId)
        .gte('date', iso(start))
        .lte('date', iso(today)),
    ])

    const workouts = sessions.data?.length ?? 0
    type MealRow = { meal_items: { grams: number; food: { calories_per_100g: number } | null }[] }
    let totalCalories = 0
    for (const meal of (meals.data as unknown as MealRow[]) ?? []) {
      for (const item of meal.meal_items) {
        if (!item.food) continue
        totalCalories += (item.food.calories_per_100g * item.grams) / 100
      }
    }
    const avgCalories = Math.round(totalCalories / 7)

    return { workouts, avgCalories }
  }

  const results = await Promise.allSettled(
    (subscriptions ?? []).map(async (sub) => {
      const digest = await digestFor(sub.user_id)
      const payload = JSON.stringify({
        title: 'Your weekly digest',
        body: `${digest.workouts} workout${digest.workouts === 1 ? '' : 's'} this week, ~${digest.avgCalories} kcal/day average. Tap to see more.`,
        url: '/',
      })
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
  return res.status(200).json({ users: userIds.length, sent, failed: results.length - sent })
}
