import { useLayoutEffect, type ReactNode } from 'react'

export type FitLogThemeMode = 'dark' | 'light'
export type FitLogAccent = 'emerald' | 'violet' | 'cyan' | 'rose' | 'amber'

export interface FitLogThemeProps {
  /** Dark is FitLog's default look. */
  theme?: FitLogThemeMode
  /** The user-selectable accent. Every `emerald-*` utility repaints to this colour. */
  accent?: FitLogAccent
  children?: ReactNode
}

/**
 * Root wrapper for anything built with FitLog's components. Applies the theme and accent the same
 * way the app does (`data-theme` / `data-palette` on <html>, which re-tint the Tailwind slate and
 * emerald scales), and paints the app background with Sora as the body font. Wrap a whole screen
 * in it once.
 */
export function FitLogTheme({ theme = 'dark', accent = 'emerald', children }: FitLogThemeProps) {
  useLayoutEffect(() => {
    const root = document.documentElement
    if (theme === 'light') root.setAttribute('data-theme', 'light')
    else root.removeAttribute('data-theme')
    if (accent !== 'emerald') root.setAttribute('data-palette', accent)
    else root.removeAttribute('data-palette')
  }, [theme, accent])

  return <div className="min-h-full bg-slate-950 font-[family-name:var(--font-body)] text-slate-200 antialiased">{children}</div>
}
