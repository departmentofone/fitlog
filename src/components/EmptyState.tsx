import type { ReactNode } from 'react'

export type EmptyStateVariant = 'folder' | 'list' | 'trophy' | 'calendar' | 'dumbbell'

const ICONS: Record<EmptyStateVariant, ReactNode> = {
  folder: (
    <path
      d="M4 7.5A2 2 0 0 1 6 5.5h3.4l1.5 2H18a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  list: (
    <>
      <rect x="6" y="3.5" width="12" height="17" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 3.5V3a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 3v.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="8.5" y1="10" x2="15.5" y2="10" strokeLinecap="round" />
      <line x1="8.5" y1="13.5" x2="15.5" y2="13.5" strokeLinecap="round" />
      <line x1="8.5" y1="17" x2="12.5" y2="17" strokeLinecap="round" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v4.5a4 4 0 0 1-8 0V4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 5.5H5.5a2 2 0 0 0 0 4H7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 5.5h2.5a2 2 0 0 1 0 4H17" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12.5v2.5" strokeLinecap="round" />
      <path d="M9.5 19h5" strokeLinecap="round" />
      <path d="M10.3 15h3.4l.7 4h-4.8l.7-4Z" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 9.5h16" strokeLinecap="round" />
      <path d="M8 3v3.5" strokeLinecap="round" />
      <path d="M16 3v3.5" strokeLinecap="round" />
    </>
  ),
  dumbbell: (
    <>
      <rect x="2.5" y="9" width="3" height="6" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="18.5" y="9" width="3" height="6" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="5.5" y1="12" x2="18.5" y2="12" strokeLinecap="round" />
      <line x1="8" y1="9.5" x2="8" y2="14.5" strokeLinecap="round" />
      <line x1="16" y1="9.5" x2="16" y2="14.5" strokeLinecap="round" />
    </>
  ),
}

/**
 * One quiet line for "nothing here yet": a small icon and a message that says what will appear and
 * how. It used to be a 48px icon tile over centred text (~100px), which across the many empty
 * sections of a new account made whole screens feel like placeholders.
 */
export function EmptyState({
  variant,
  message,
  className = '',
}: {
  variant: EmptyStateVariant
  message: string
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2.5 py-1 ${className}`}>
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 shrink-0 text-slate-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        {ICONS[variant]}
      </svg>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}
