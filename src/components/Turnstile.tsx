import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Cloudflare Turnstile, the bot check on sign-in, sign-up, password reset, account deletion and
 * feedback. The site key is public. Supabase checks the token once CAPTCHA protection is on in its
 * dashboard (the secret key lives there, and in the Department of One contact endpoint for
 * feedback). VITE_TURNSTILE_SITE_KEY overrides it, e.g. with Cloudflare's test key.
 */
const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || '0x4AAAAAAFJNfo4pofObKvVn'

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
// A password manager can submit within a second of the page opening, before the check is done.
const WAIT_FOR_TOKEN_MS = 8000

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

function TurnstileWidget({
  action,
  resetKey,
  onToken,
  onInteractive,
}: {
  action: string
  resetKey: number
  onToken: (token: string | null) => void
  onInteractive: (interactive: boolean) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const [failed, setFailed] = useState(false)

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
          callback: (token: string) => {
            onInteractive(false)
            onToken(token)
          },
          'expired-callback': () => onToken(null),
          'error-callback': () => {
            onToken(null)
            return true
          },
          // Managed mode: Cloudflare wants a tick on "Verify you are human" before it gives a token.
          'before-interactive-callback': () => onInteractive(true),
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
  }, [action, onToken, onInteractive])

  useEffect(() => {
    if (resetKey === 0 || !widgetId.current || !window.turnstile) return
    window.turnstile.reset(widgetId.current)
  }, [resetKey])

  return (
    <div>
      <div ref={ref} />
      {failed && <p className="text-xs text-slate-500">The bot check couldn't load. If sending fails, turn off content blockers for this site and try again.</p>}
    </div>
  )
}

export const TICK_THE_BOX = 'Tick "Verify you are human" above, then try again.'

/**
 * The check for one form. Render `widget` in the form; on submit, `await getToken()`: it waits
 * for the check to finish (a password manager can submit before it has), and returns null if it
 * can't finish, either because Cloudflare wants a tick (`needsTick`) or because the check never
 * loaded. Tokens work once, so call `used()` after every attempt that sent one.
 */
export function useTurnstile(action: string): {
  widget: ReactNode
  getToken: () => Promise<string | null>
  needsTick: () => boolean
  used: () => void
} {
  const tokenRef = useRef<string | null>(null)
  const interactiveRef = useRef(false)
  const [resetKey, setResetKey] = useState(0)

  const onToken = useCallback((token: string | null) => {
    tokenRef.current = token
  }, [])
  const onInteractive = useCallback((interactive: boolean) => {
    interactiveRef.current = interactive
  }, [])

  const getToken = useCallback(async () => {
    const start = Date.now()
    while (!tokenRef.current && !interactiveRef.current && Date.now() - start < WAIT_FOR_TOKEN_MS) {
      await new Promise((r) => setTimeout(r, 150))
    }
    return tokenRef.current
  }, [])

  const used = useCallback(() => {
    tokenRef.current = null
    setResetKey((k) => k + 1)
  }, [])

  const needsTick = useCallback(() => interactiveRef.current && !tokenRef.current, [])

  return {
    widget: <TurnstileWidget action={action} resetKey={resetKey} onToken={onToken} onInteractive={onInteractive} />,
    getToken,
    needsTick,
    used,
  }
}
