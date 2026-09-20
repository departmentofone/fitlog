import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  /** Remounting on route change clears the error when the user navigates elsewhere. */
  route: string
  children: ReactNode
}

interface State {
  error: Error | null
}

/** A failed dynamic import after a deploy replaced the old chunks - recoverable by reloading. */
function isStaleChunkError(error: Error): boolean {
  return /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(
    `${error.message} ${error.name}`,
  )
}

/**
 * Without this, one throw inside a lazily-loaded tab unmounts the whole app and leaves a blank
 * screen with no way back. That is a routine PWA situation: the service worker takes over
 * immediately on update (skipWaiting + clientsClaim), so a tab left open across a deploy can try
 * to import a chunk the server no longer has.
 */
export class TabErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.route !== this.props.route && this.state.error) this.setState({ error: null })
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Goes to the same place as uncaught errors (errorLogger's window listener doesn't see these).
    console.error('Tab crashed', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const stale = isStaleChunkError(error)
    return (
      <div className="p-4">
        <div className="rounded-3xl border-t border-white/10 bg-slate-900 p-5 text-center shadow-lg shadow-black/20 ring-1 ring-white/5">
          <h2 className="text-lg font-semibold text-white">
            {stale ? 'A new version is ready' : 'This screen hit a problem'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {stale
              ? 'FitLog updated while you had it open. Reload to pick up the new version — nothing you logged is affected.'
              : "Sorry — something went wrong loading this screen. Your logged data is safe. Try again, or reload the app."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 min-h-12 w-full rounded-xl bg-emerald-600 font-semibold text-on-accent transition hover:brightness-90"
          >
            Reload FitLog
          </button>
          {!stale && (
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="mt-2 min-h-11 w-full rounded-xl text-sm font-medium text-slate-400"
            >
              Try this screen again
            </button>
          )}
        </div>
      </div>
    )
  }
}
