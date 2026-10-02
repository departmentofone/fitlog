import { isStoreBuild } from '../../lib/platform'

/** The Buy Me a Coffee page. Set to null to fall back to the disabled "Coming soon" placeholder. */
export const DONATE_URL: string | null = 'https://buymeacoffee.com/department.of.one'

/**
 * Google Play's Payments policy doesn't allow in-app buttons or links to a payment method other than
 * Play billing, so the Play build never shows the coffee link or asks for one (see
 * DONATIONS_PLAN.md). The native app takes tips through its store instead (tipJar.ts).
 */
export function canAskForCoffee(): boolean {
  return !isStoreBuild()
}

export function CoffeeIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V8z" />
      <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17M8 2.5v2.5M12 2.5v2.5" />
    </svg>
  )
}
