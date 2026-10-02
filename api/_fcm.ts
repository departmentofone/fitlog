import { createSign } from 'node:crypto'

/**
 * Sends a push to the app through Firebase Cloud Messaging (HTTP v1). The app can't use Web Push,
 * so the crons send app devices their notifications this way (native_push_tokens, migration v34).
 *
 * Env: FIREBASE_SERVICE_ACCOUNT, the service account JSON from Firebase (Project settings >
 * Service accounts > Generate new private key), pasted whole. Without it, nothing is sent.
 * The access token is signed here with Node's crypto, so there's no Google SDK to depend on.
 */
interface ServiceAccount {
  project_id: string
  client_email: string
  private_key: string
}

export interface AppPush {
  title: string
  body: string
  /** Where tapping it should open, e.g. "/". */
  url?: string
}

/** "sent", or "gone" when the token no longer works and should be deleted. */
export type FcmResult = 'sent' | 'gone'

let cached: { token: string; expires: number } | null = null

export function fcmConfigured(): boolean {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT
}

function account(): ServiceAccount {
  return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? '') as ServiceAccount
}

async function accessToken(sa: ServiceAccount): Promise<string> {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token
  const now = Math.floor(Date.now() / 1000)
  const encode = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url')
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
  })
  if (!res.ok) throw new Error(`Google token request failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { access_token: string; expires_in: number }
  cached = { token: data.access_token, expires: Date.now() + data.expires_in * 1000 }
  return data.access_token
}

export async function sendFcm(token: string, push: AppPush): Promise<FcmResult> {
  const sa = account()
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken(sa)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: push.title, body: push.body },
        data: { url: push.url ?? '/' },
        android: { notification: { icon: 'ic_stat_fitlog', channel_id: 'reminders' } },
      },
    }),
  })
  if (res.ok) return 'sent'
  const text = await res.text()
  // UNREGISTERED: the app was uninstalled or the token replaced. INVALID_ARGUMENT on the token: same.
  if (res.status === 404 || (res.status === 400 && text.includes('registration token'))) return 'gone'
  throw new Error(`FCM send failed: ${res.status} ${text}`)
}
