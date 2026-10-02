import type { VercelRequest, VercelResponse } from './_vercel.js'

/**
 * The FitLog app's pages come from its own local origin (Capacitor serves them from
 * https://localhost on Android and capacitor://localhost on iOS), so its calls to these endpoints
 * are cross-origin. The website itself is same-origin and needs nothing.
 */
const APP_ORIGINS = new Set(['https://localhost', 'capacitor://localhost'])

/** Sets CORS headers for the app. Returns true when the request was a preflight, already answered. */
export function allowApp(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin
  if (origin && APP_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    res.setHeader('Access-Control-Max-Age', '86400')
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}
