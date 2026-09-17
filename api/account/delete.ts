import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Permanently deletes the calling user's account and all of its data. Used by both the in-app
 * Settings flow and the public /delete-account page (Google Play account-deletion requirement).
 *
 * Auth: `Authorization: Bearer <the user's own access token>`. The user id is always derived from
 * that verified token - never from the request body - so nobody can delete someone else's account.
 *
 * Requires server env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
 * and migration_v19 (the prepare_account_deletion function). See DELETE_ACCOUNT_PLAN.md.
 */
const PHOTO_BUCKETS = ['progress-photos', 'meal-photos']

async function removeUserFolder(admin: SupabaseClient, bucket: string, userId: string) {
  // Photos live at <userId>/<file>; storage objects aren't reached by Postgres cascades.
  for (;;) {
    const { data, error } = await admin.storage.from(bucket).list(userId, { limit: 100 })
    if (error) throw new Error(`Listing ${bucket}: ${error.message}`)
    if (!data || data.length === 0) return
    const { error: removeError } = await admin.storage.from(bucket).remove(data.map((f) => `${userId}/${f.name}`))
    if (removeError) throw new Error(`Removing from ${bucket}: ${removeError.message}`)
    if (data.length < 100) return
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return res.status(503).json({ error: 'Account deletion is not configured yet. Please email msolarovsocial@gmail.com.' })
  }

  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1]
  if (!token) return res.status(401).json({ error: 'Please sign in again.' })

  // Verify the token with the anon client - this proves it belongs to a real, current user.
  const anon = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } })
  const { data: userData, error: userError } = await anon.auth.getUser(token)
  const userId = userData.user?.id
  if (userError || !userId) return res.status(401).json({ error: 'Your session has expired. Please sign in again.' })

  // service_role bypasses RLS - server-only, never shipped to a browser.
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

  try {
    for (const bucket of PHOTO_BUCKETS) await removeUserFolder(admin, bucket, userId)

    const { error: prepError } = await admin.rpc('prepare_account_deletion', { target: userId })
    if (prepError) throw new Error(`Preparing deletion: ${prepError.message}`)

    // Cascades through every table that references auth.users.
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
    if (deleteError) throw new Error(`Deleting account: ${deleteError.message}`)
  } catch (err) {
    console.error('account deletion failed', userId, err)
    return res
      .status(500)
      .json({ error: "We couldn't finish deleting your account. Please try again, or email msolarovsocial@gmail.com and we'll do it for you." })
  }

  return res.status(200).json({ deleted: true })
}
