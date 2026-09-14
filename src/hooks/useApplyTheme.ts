import { useEffect } from 'react'
import { useUserSettings } from './useUserSettings'

export function useApplyTheme() {
  const { data: settings } = useUserSettings()
  const theme = settings?.theme ?? 'system'
  const palette = settings?.color_palette ?? 'emerald'

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    function resolve() {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
      if (resolved === 'light') root.setAttribute('data-theme', 'light')
      else root.removeAttribute('data-theme')
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
