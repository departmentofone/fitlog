// FitLog's design system: the self-contained UI pieces from the app (no data hooks, no login),
// plus FitLogTheme, the root wrapper. Built by design-system/vite.config.ts for Claude Design.
import './ds.css'

export { FitLogTheme } from './FitLogTheme'
export type { FitLogAccent, FitLogThemeMode, FitLogThemeProps } from './FitLogTheme'

export { CircularProgress } from '../src/components/CircularProgress'
export { CountUp } from '../src/components/CountUp'
export { DateNav } from '../src/components/DateNav'
export { EmptyState } from '../src/components/EmptyState'
export { ExplainerCard } from '../src/components/ExplainerCard'
export { FireStreak } from '../src/components/FireStreak'
export { MacroLine } from '../src/components/MacroLine'
export { MonthCalendar } from '../src/components/MonthCalendar'
export { SkeletonCard, SkeletonLine, SkeletonRow } from '../src/components/Skeleton'
export { TabIcon } from '../src/components/TabIcon'
export { Toggle } from '../src/components/Toggle'
export { Medal } from '../src/features/achievements/Medal'
export { RestDayCard } from '../src/features/workouts/RestDayCard'
