import { useEffect } from 'react'
import { useUserSettings } from './useUserSettings'

// Must match html/body's actual background in index.css (light theme override vs. the
// dark default) - iOS paints the safe-area strips outside the page's own content (status
// bar, home indicator) using this meta tag's color, not anything in the DOM. Any mismatch
// here shows up as a visible seam in standalone mode, however exactly the page is sized.
const THEME_COLOR = { dark: '#020617', light: '#f1f5f9' }

export function useApplyTheme() {
  const { data: settings } = useUserSettings()
  const theme = settings?.theme ?? 'system'
  const palette = settings?.color_palette ?? 'emerald'

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const meta = document.querySelector('meta[name="theme-color"]')

    function resolve() {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
      if (resolved === 'light') root.setAttribute('data-theme', 'light')
      else root.removeAttribute('data-theme')
      meta?.setAttribute('content', THEME_COLOR[resolved])
    }

    resolve()
    if (theme === 'system') {
      media.addEventListener('change', resolve)
      return () => media.removeEventListener('change', resolve)
    }
  }, [theme])

  useEffect(() => {
    if (palette && palette !== 'emerald') document.documentElement.setAttribute('data-palette', palette)
    else document.documentElement.removeAttribute('data-palette')
  }, [palette])
}
