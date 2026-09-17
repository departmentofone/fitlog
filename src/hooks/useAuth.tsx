import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  /** True after arriving via a password-reset email link, until the new password is saved. */
  recoveringPassword: boolean
  finishPasswordRecovery: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  recoveringPassword: false,
  finishPasswordRecovery: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [recoveringPassword, setRecoveringPassword] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (event === 'PASSWORD_RECOVERY') setRecoveringPassword(true)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{
        user: session?.user ?? null,
        session,
        loading,
        recoveringPassword,
        finishPasswordRecovery: () => setRecoveringPassword(false),
      }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
