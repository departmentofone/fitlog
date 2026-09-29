import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from './_vercel.js'

/**
 * Share links: `/s/<kind>/<id>` (rewritten here by vercel.json). Answers with a small page whose
 * meta tags give chat apps and social posts a proper preview (the item's name and description, and
 * the FitLog image), then forwards to the app at `/?open=<kind>:<id>#/community`, which opens the
 * item after sign-in (src/lib/shareLink.ts). Only items shared to Community are described; anything
 * else gets a generic FitLog preview, so a link never reveals a private item.
 *
 * Requires server env vars: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (to read a shared item
 * without a signed-in user).
 */
const TABLES = {
  workout: { table: 'workout_presets', label: 'workout' },
  meal: { table: 'meal_presets', label: 'meal' },
  recipe: { table: 'recipes', label: 'recipe' },
  program: { table: 'programs', label: 'program' },
  plan: { table: 'meal_plans', label: 'meal plan' },
  diet: { table: 'diets', label: 'diet' },
} as const
type Kind = keyof typeof TABLES

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

async function sharedItem(kind: Kind, id: string): Promise<{ name: string; description: string | null } | null> {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  const admin = createClient(url, key, { auth: { persistSession: false } })
  const { data } = await admin.from(TABLES[kind].table).select('name, description').eq('id', id).eq('is_shared', true).maybeSingle()
  return data ? { name: String(data.name), description: data.description ? String(data.description) : null } : null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const kind = String(req.query.kind ?? '')
  const id = String(req.query.id ?? '')
  const valid = kind in TABLES && UUID.test(id)
  const item = valid ? await sharedItem(kind as Kind, id).catch(() => null) : null

  const origin = `https://${req.headers['x-forwarded-host'] ?? req.headers.host}`
  const target = valid ? `/?open=${kind}:${id}#/community` : '/#/community'
  const label = valid ? TABLES[kind as Kind].label : 'item'
  const title = item ? `${item.name} · FitLog` : 'FitLog'
  const description = item
    ? (item.description?.trim() || `A ${label} shared on FitLog. Open it to see what's inside and save your own copy.`).slice(0, 200)
    : 'Workout log, meal and macro tracker, with a Community where people share their routines, recipes and diets.'
  const heading = item ? `Opening ${item.name} in FitLog…` : 'Opening FitLog…'
  // This page's only script is the forward below; the policy allows exactly that script.
  const nonce = randomBytes(16).toString('base64')

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta name="theme-color" content="#0b0f1e" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="FitLog" />
<meta property="og:title" content="${escapeHtml(item ? item.name : 'FitLog')}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(`${origin}/s/${kind}/${id}`)}" />
<meta property="og:image" content="${origin}/og-image.png" />
<meta property="og:image:width" content="1024" />
<meta property="og:image:height" content="500" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(item ? item.name : 'FitLog')}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${origin}/og-image.png" />
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0f1e;color:#e2e8f0;font:16px/1.5 system-ui,sans-serif;text-align:center;padding:24px}a{color:#34d399}</style>
</head>
<body>
<main>
<p>${escapeHtml(heading)}</p>
<p><a id="open" href="${escapeHtml(target)}">Continue to FitLog</a></p>
</main>
<script nonce="${nonce}">
// The Play app marks its own launches (src/lib/platform.ts); pass that on, since this page is the
// one that received the android-app:// referrer.
var target = ${JSON.stringify(target)};
if (document.referrer.indexOf('android-app://') === 0) target = target.replace('?', '?source=play&');
document.getElementById('open').href = target;
location.replace(target);
</script>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
  )
  // Short: stopping sharing should stop describing the item soon after.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300')
  res.status(200).send(html)
}
