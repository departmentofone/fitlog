import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { SITE_URL } from '../lib/platform'
import { Incoming } from './incoming'

/**
 * Links in the app, both ways.
 *
 * Into the app: Android App Links (AndroidManifest.xml) open the website's share links
 * (/s/<kind>/<id>) and its home page, which is where password reset emails land, in the app when
 * it's installed. Each is turned into the address the web app already understands, which the app
 * loads: /?open=<kind>:<id> for a shared item, and the reset link's #access_token=... for a new
 * password (supabase-js reads it and starts the reset).
 *
 * Also into the app: the long-press shortcuts on its icon (fitlog://quick/<action>, the same
 * ?quick= starts the website's install has), and text shared from another app's share sheet
 * (the same ?share-text= the website's share_target uses).
 *
 * Out of the app: the app's own pages come from https://localhost, so a link to one of the
 * website's pages (the privacy policy) would load inside the app. Those, and any outside link,
 * open in the browser instead.
 */
const HANDLED_KEY = 'fitlog-handled-launch-url'
const site = new URL(SITE_URL)

const QUICK_TABS: Record<string, string> = { set: 'workouts', meal: 'meals', fast: 'fasting' }

/** The in-app address for a link into the app, or null if it's not one the app handles. */
export function inAppPath(url: string): string | null {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  if (u.protocol === 'fitlog:') {
    // fitlog://quick/set parses with host "quick" and path "/set".
    const action = u.pathname.replace(/^\/+/, '')
    return u.host === 'quick' && QUICK_TABS[action] ? `/?quick=${action}#/${QUICK_TABS[action]}` : null
  }
  if (u.host !== site.host) return null
  const share = u.pathname.match(/^\/s\/([a-z]+)\/([0-9a-f-]{36})\/?$/i)
  if (share) return `/?open=${share[1]}:${share[2]}#/community`
  if (u.pathname === '/' || u.pathname === '') return `/${u.search}${u.hash}`
  return null
}

function open(url: string) {
  const path = inAppPath(url)
  if (!path) return
  // A full load of the local app, so the same startup code that handles these on the web runs.
  window.location.replace(path)
}

export async function startLinks() {
  // The link that launched the app, once per launch (the reload above would otherwise repeat it).
  try {
    const launch = await App.getLaunchUrl()
    if (launch?.url && sessionStorage.getItem(HANDLED_KEY) !== launch.url) {
      sessionStorage.setItem(HANDLED_KEY, launch.url)
      if (inAppPath(launch.url)) {
        open(launch.url)
        return true
      }
    }
  } catch {
    // No launch URL.
  }
  // Links opened while the app is already running.
  void App.addListener('appUrlOpen', ({ url }) => {
    sessionStorage.setItem(HANDLED_KEY, url)
    open(url)
  })

  // Text shared in from another app: at launch, or while running.
  const shared = (text: string) => window.location.replace(`/?share-text=${encodeURIComponent(text)}#/meals`)
  try {
    const { text } = await Incoming.takeSharedText()
    if (text) {
      shared(text)
      return true
    }
  } catch {
    // Nothing shared.
  }
  void Incoming.addListener('shared', ({ text }) => {
    void Incoming.takeSharedText()
    shared(text)
  })

  // Website pages and outside links open in the browser, never inside the app.
  document.addEventListener(
    'click',
    (event) => {
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href') ?? ''
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      const url = new URL(anchor.href, window.location.href)
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return
      const target = url.origin === window.location.origin ? `${SITE_URL}${url.pathname}${url.search}${url.hash}` : url.href
      event.preventDefault()
      void Browser.open({ url: target })
    },
    true,
  )
  return false
}
