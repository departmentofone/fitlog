import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'
import { computeDayStreaks, todayDayNumber, toDayNumber } from '../../src/lib/streaks.js'

/**
 * Runs once daily in the evening (see vercel.json). For each subscribed user with an active
 * workout streak of 2+ days who hasn't logged a workout OR a rest day yet today, sends a
 * "your streak ends at midnight" push. Same env-var requirements as weekly-digest.ts.
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

  webpush.setVapidDetails('mailto:departmentofone.app@gmail.com', vapidPublicKey, vapidPrivateKey)
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: subscriptions, error } = await supabase.from('push_subscriptions').select('*')
  if (error) return res.status(500).json({ error: error.message })

  const userIds = Array.from(new Set((subscriptions ?? []).map((s) => s.user_id as string)))
  const today = todayDayNumber()

  async function isAtRisk(userId: string): Promise<number | null> {
    const [sessionsRes, restDaysRes] = await Promise.all([
      supabase.from('workout_sessions').select('date, workout_sets!inner(id)').eq('user_id', userId),
      supabase.from('rest_days').select('date').eq('user_id', userId),
    ])
    if (sessionsRes.error) throw sessionsRes.error
    const dates = (sessionsRes.data ?? []).map((s) => s.date as string)
    const restDays = restDaysRes.error ? [] : (restDaysRes.data ?? []).map((r) => r.date as string)

    const { current } = computeDayStreaks(dates, restDays)
    if (current < 2) return null // not worth a nudge for a 0-1 day streak

    const loggedToday = [...dates, ...restDays].some((d) => toDayNumber(d) === today)
    if (loggedToday) return null

    return current
  }

  const results = await Promise.allSettled(
    (subscriptions ?? []).map(async (sub) => {
      const streak = await isAtRisk(sub.user_id)
      if (streak == null) return 'not-at-risk' as const

      const payload = JSON.stringify({
        title: `${streak}-day streak ends at midnight`,
        body: 'Log a workout or a rest day to keep it going.',
        url: '/',
      })
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
        return 'sent' as const
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
        throw err
      }
    }),
  )

  const sent = results.filter((r) => r.status === 'fulfilled' && r.value === 'sent').length
  const failed = results.filter((r) => r.status === 'rejected').length
  return res.status(200).json({ users: userIds.length, sent, failed })
}
