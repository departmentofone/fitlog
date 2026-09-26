import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

/**
 * Lets a focused editor (the set form, exercise picker, food search) hide the floating + button
 * while it's open - the button sat right on top of "Add set" and the food list. A count rather
 * than a flag, so two editors open at once don't un-hide each other.
 */
const Context = createContext<{ hidden: boolean; change: (delta: number) => void }>({ hidden: false, change: () => {} })

export function QuickAddVisibilityProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0)
  const change = useCallback((delta: number) => setCount((c) => c + delta), [])
  const value = useMemo(() => ({ hidden: count > 0, change }), [count, change])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useQuickAddHidden() {
  return useContext(Context).hidden
}

/** Call from an editor component: the + button stays hidden for as long as it's mounted. */
export function useHideQuickAdd() {
  const { change } = useContext(Context)
  useEffect(() => {
    change(1)
    return () => change(-1)
  }, [change])
}
