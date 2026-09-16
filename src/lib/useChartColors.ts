import { useEffect, useState } from 'react'
import { useUserSettings } from '../hooks/useUserSettings'

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

export interface ChartColors {
  /** The user's chosen accent (follows the Settings palette picker and light/dark theme). */
  accent: string
  grid: string
  axis: string
  tick: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
}

/**
 * Recharts renders to raw SVG/inline styles, so it can't pick up CSS custom properties the way
 * Tailwind classes do - these would otherwise stay hardcoded to one dark palette regardless of
 * the user's theme or accent color choice. Re-reads the live custom properties whenever theme or
 * palette settings change, so charts stay in sync with the rest of the (Aurora Glass) UI.
 */
export function useThemeChartColors(): ChartColors {
  const { data: settings } = useUserSettings()
  const [colors, setColors] = useState<ChartColors>({
    accent: '#34d399',
    grid: 'rgba(255,255,255,.14)',
    axis: 'rgba(255,255,255,.14)',
    tick: '#a8b0c4',
    tooltipBg: '#111318',
    tooltipBorder: 'rgba(255,255,255,.14)',
    tooltipText: '#f4f6fb',
  })

  useEffect(() => {
    setColors({
      accent: cssVar('--color-emerald-400', '#34d399'),
      grid: cssVar('--color-slate-700', 'rgba(255,255,255,.14)'),
      axis: cssVar('--color-slate-700', 'rgba(255,255,255,.14)'),
      tick: cssVar('--color-slate-400', '#a8b0c4'),
      tooltipBg: cssVar('--color-slate-900', '#111318'),
      tooltipBorder: cssVar('--color-slate-700', 'rgba(255,255,255,.14)'),
      tooltipText: cssVar('--color-white', '#f4f6fb'),
    })
  }, [settings?.theme, settings?.color_palette])

  return colors
}

export const CHART_FONT = "'Sora', ui-sans-serif, system-ui, sans-serif"
