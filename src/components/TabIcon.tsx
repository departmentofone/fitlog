import type { ReactNode } from 'react'
import type { Tab } from '../types'

/**
 * One consistent stroke-icon set for every navigation destination (24px grid, 2px stroke, round
 * caps - same as the header/quick-add icons). Replaces platform emoji, which rendered differently
 * on iOS vs Android and clashed with the app's own line icons.
 */
const PATHS: Record<Tab | 'progress', ReactNode> = {
  workouts: (
    <>
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
    </>
  ),
  meals: <path d="M4 3v7a2 2 0 0 0 4 0V3M6 12v9M17 3c-1.7 0-3 2.2-3 5s1.3 5 3 5v8" />,
  scanner: (
    <>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M8 9v6M11 9v6M14 9v6M17 9v6" />
    </>
  ),
  diet: (
    <>
      <path d="M12 21a8 8 0 0 0 8-8H4a8 8 0 0 0 8 8z" />
      <path d="M12 13c0-4 2-7 6-8-1 3-2.5 5.5-6 8zM12 13c-.5-2.5-2-4.5-5-5 .5 2.5 2 4 5 5z" />
    </>
  ),
  fasting: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5M10 2h4" />
    </>
  ),
  goals: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  history: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  achievements: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
      <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9.5 17h5" />
    </>
  ),
  programs: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  foods: (
    <>
      <path d="M12 7.5c-1.4-1-3-1.5-4.6-1C4.8 7.3 3.6 10.3 4.4 14c.8 3.7 3.2 7 5.6 7 .8 0 1.3-.4 2-.4s1.2.4 2 .4c2.4 0 4.8-3.3 5.6-7 .8-3.7-.4-6.7-3-7.5-1.6-.5-3.2 0-4.6 1z" />
      <path d="M12 7.5c0-2 1-3.8 3-4.5" />
    </>
  ),
  community: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
    </>
  ),
  calculator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
    </>
  ),
  plates: (
    <>
      <path d="M2 12h20" />
      <rect x="5" y="6" width="3" height="12" rx="1" />
      <rect x="16" y="6" width="3" height="12" rx="1" />
    </>
  ),
  progress: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  whatsnew: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
  feedback: <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5zM8.5 9h7M8.5 12h4.5" />,
  about: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
}

export function TabIcon({ tab, className = 'h-6 w-6' }: { tab: Tab | 'progress'; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[tab]}
    </svg>
  )
}
