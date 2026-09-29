import { useEffect, useRef, useState } from 'react'

/**
 * Cloudflare Turnstile, the bot check on sign-in, sign-up, password reset and feedback. The site
 * key is public. Supabase checks the token once CAPTCHA protection is on in its dashboard (the
 * secret key lives there, and in the Department of One contact endpoint for feedback).
 * VITE_TURNSTILE_SITE_KEY overrides it, e.g. with Cloudflare's test key for local testing.
 */
const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || '0x4AAAAAAFJNfo4pofObKvVn'

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile did not load')))
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Turnstile did not load'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

/**
 * Renders the check (usually invisible: it only shows when Cloudflare wants an interaction) and
 * reports each token. Tokens work once, so bump `resetKey` after every attempt to get a new one.
 * If the check can't load, the form still works; the server decides whether a token is required.
 */
export function Turnstile({ onToken, resetKey = 0, action }: { onToken: (token: string | null) => void; resetKey?: number; action?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const onTokenRef = useRef(onToken)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    let cancelled = false
    loadTurnstile()
      .then((api) => {
        if (cancelled || !ref.current) return
        widgetId.current = api.render(ref.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          theme: 'auto',
          size: 'flexible',
          appearance: 'interaction-only',
          'refresh-expired': 'auto',
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => {
            onTokenRef.current(null)
            return true
          },
        })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current)
      widgetId.current = null
    }
  }, [action])

  useEffect(() => {
    if (resetKey === 0 || !widgetId.current || !window.turnstile) return
    onTokenRef.current(null)
    window.turnstile.reset(widgetId.current)
  }, [resetKey])

  return (
    <div>
      <div ref={ref} />
      {failed && <p className="text-xs text-slate-500">The bot check couldn't load. If sending fails, turn off content blockers for this site and try again.</p>}
    </div>
  )
}
