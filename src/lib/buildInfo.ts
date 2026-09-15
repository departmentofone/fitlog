declare const __BUILD_TIME__: string

export const BUILD_TIME = __BUILD_TIME__

/** Short, human-glanceable form for display in the UI - e.g. "9/15, 22:47". */
export function formatBuildTime() {
  const d = new Date(BUILD_TIME)
  return d.toLocaleString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
