import type { Route } from '../hooks/useHashRoute'
import type { Tab } from '../types'

/**
 * The app's map. Four areas on the bottom bar, each with its own sections shown as tabs under the
 * header. Everything else is a detail page: opened from inside a screen or Settings, shown with a
 * back arrow, and never in a menu of its own. This replaced a 15-item "More" grid where the same
 * things (diets, presets, calculators) showed up in two or three places.
 */
export type Area = 'train' | 'eat' | 'progress' | 'community'

export interface Section {
  route: Tab
  label: string
}

export const AREAS: { key: Area; label: string; sections: Section[] }[] = [
  {
    key: 'train',
    label: 'Train',
    sections: [
      { route: 'workouts', label: 'Log' },
      { route: 'programs', label: 'Programs' },
      { route: 'history', label: 'History' },
    ],
  },
  {
    key: 'eat',
    label: 'Eat',
    sections: [
      { route: 'meals', label: 'Meals' },
      { route: 'diet', label: 'Diet' },
      { route: 'fasting', label: 'Fasting' },
      { route: 'foods', label: 'Foods' },
    ],
  },
  {
    key: 'progress',
    label: 'Progress',
    sections: [
      { route: 'goals', label: 'Body' },
      { route: 'achievements', label: 'Awards' },
    ],
  },
  { key: 'community', label: 'Community', sections: [{ route: 'community', label: 'Community' }] },
]

/**
 * Detail pages: a title for the header and the area they belong to (which stays lit on the bottom
 * bar), or null for the ones reached from Settings.
 */
const DETAIL_PAGES: Partial<Record<Route, { title: string; area: Area | null }>> = {
  scanner: { title: 'Scan a barcode', area: 'eat' },
  calculator: { title: 'Calorie calculator', area: 'eat' },
  plates: { title: 'Plate calculator', area: 'train' },
  settings: { title: 'Settings', area: null },
  whatsnew: { title: "What's new", area: null },
  feedback: { title: 'Feedback & support', area: null },
  about: { title: 'About FitLog', area: null },
}

export function isDetailPage(route: Route): boolean {
  return route in DETAIL_PAGES
}

export function areaOf(route: Route): Area | null {
  const detail = DETAIL_PAGES[route]
  if (detail) return detail.area
  return AREAS.find((a) => a.sections.some((s) => s.route === route))?.key ?? null
}

export function titleOf(route: Route): string {
  const detail = DETAIL_PAGES[route]
  if (detail) return detail.title
  return AREAS.find((a) => a.key === areaOf(route))?.label ?? 'FitLog'
}
