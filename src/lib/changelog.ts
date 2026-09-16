export interface ChangelogEntry {
  date: string
  title: string
  changes: string[]
}

// Newest first. Add a new entry here whenever a real batch of changes ships - this is what
// "What's new" reads from, and it's the only place that content lives (no other data source).
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-09-16',
    title: 'Rest days, a real micro dashboard, and more',
    changes: [
      'Log a rest day so 1-2 days off in a row no longer breaks your workout streak',
      'A real always-visible micronutrient dashboard on the Diet tab, not just buried in a modal',
      'A rest timer that counts down between sets, with a notification when it hits zero',
      "A \"last time\" hint while logging a set, so you're not guessing your previous numbers",
      'Weekly nutrition adherence score - how many of the last 7 logged days hit your goal',
      "This What's New tab",
    ],
  },
  {
    date: '2026-09-16',
    title: 'Aurora Glass redesign',
    changes: [
      'Switched the whole app from a flat black canvas to a glassmorphism look - translucent cards, ambient glow, deep navy background',
      'Grouped the menu into Track / Progress / Tools instead of one long list',
      'History promoted to a real tab; added unified search and a floating quick-add button',
      'Illustrated empty states, skeleton loaders, swipe-to-delete, and a lot of small polish across every screen',
    ],
  },
]
