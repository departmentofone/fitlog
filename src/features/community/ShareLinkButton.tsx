import { useToast } from '../../components/ToastProvider'
import { shareUrl, type ShareKind } from '../../lib/shareLink'

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

/**
 * Shares a link to a Community item: the phone's share sheet where there is one, otherwise the link
 * is copied. Only render it for items that are shared to Community - the link opens nothing else.
 */
export function ShareLinkButton({ kind, id, name, variant = 'text' }: { kind: ShareKind; id: string; name: string; variant?: 'text' | 'icon' }) {
  const { show } = useToast()

  async function share() {
    const url = shareUrl({ kind, id })
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: name, text: `${name} on FitLog`, url })
        return
      } catch (err) {
        // Closing the share sheet isn't an error; anything else falls back to copying.
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      show('Link copied')
    } catch {
      window.prompt('Copy this link', url)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={() => void share()}
        aria-label={`Share a link to ${name}`}
        title="Share link"
        className="-my-1.5 -mr-1.5 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition active:bg-white/10"
      >
        <ShareIcon />
      </button>
    )
  }

  return (
    <button type="button" onClick={() => void share()} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 text-xs font-medium text-emerald-400">
      <ShareIcon />
      Share link
    </button>
  )
}
