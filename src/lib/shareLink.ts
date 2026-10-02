import { siteOrigin } from './platform'

/**
 * Share links for Community items: `/s/<kind>/<id>`. The server (api/share.ts, via a vercel.json
 * rewrite) answers with a small page that has a proper link preview (name, description, image) for
 * chat apps and social posts, then forwards to `/?open=<kind>:<id>#/community`. The app keeps that
 * request until the person is signed in, then opens the item in Community as "Shared with you".
 * Links only work for items shared to Community.
 */
export const SHARE_KINDS = ['workout', 'meal', 'recipe', 'program', 'plan', 'diet'] as const
export type ShareKind = (typeof SHARE_KINDS)[number]

export interface SharedRef {
  kind: ShareKind
  id: string
}

/** "Someone shared a workout with you" - the item's type with its article. */
export const SHARE_KIND_PHRASE: Record<ShareKind, string> = {
  workout: 'a workout',
  meal: 'a meal',
  recipe: 'a recipe',
  program: 'a program',
  plan: 'a meal plan',
  diet: 'a diet',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PENDING_KEY = 'fitlog-pending-shared'
// Long enough to cover signing up and confirming an email, short enough not to surprise anyone.
const PENDING_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export function isShareKind(value: string): value is ShareKind {
  return (SHARE_KINDS as readonly string[]).includes(value)
}

export function shareUrl(ref: SharedRef, origin: string = siteOrigin()): string {
  return `${origin}/s/${ref.kind}/${ref.id}`
}

/** Reads `?open=<kind>:<id>` from a URL's search string; null if it's missing or malformed. */
export function parseOpenParam(search: string): SharedRef | null {
  const raw = new URLSearchParams(search).get('open')
  if (!raw) return null
  const [kind, id] = raw.split(':')
  return kind && id && isShareKind(kind) && UUID.test(id) ? { kind, id } : null
}

export function storePendingShared(ref: SharedRef, now = Date.now()) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ ...ref, at: now }))
  } catch {
    // Storage unavailable: the link still opens if the person is already signed in.
  }
}

export function peekPendingShared(now = Date.now()): SharedRef | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SharedRef> & { at?: number }
    if (!parsed.kind || !isShareKind(parsed.kind) || !parsed.id || !UUID.test(parsed.id)) return null
    if (typeof parsed.at !== 'number' || now - parsed.at > PENDING_MAX_AGE_MS) return null
    return { kind: parsed.kind, id: parsed.id }
  } catch {
    return null
  }
}

export function clearPendingShared() {
  try {
    localStorage.removeItem(PENDING_KEY)
  } catch {
    // Nothing to clear.
  }
}
