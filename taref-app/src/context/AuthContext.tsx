/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../utils/supabaseClient'
import type { Database } from '../types/database'
import type { UserRole } from '../types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  userRole: UserRole | null
  hasRole: (required: UserRole) => boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const ROLE_RANK: Record<UserRole, number> = { user: 1, admin: 2, super_admin: 3 }

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) {
        console.error('[AuthContext] Erro ao buscar perfil:', error)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('[AuthContext] Exceção ao buscar perfil:', err)
      setProfile(null)
    }
  }

  useEffect(() => {
    const safetyTimer = setTimeout(() => setIsLoading(false), 2500)

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      clearTimeout(safetyTimer)
      setSession(s)
      setUser(s?.user ?? null)
      setIsLoading(false)
      if (s?.user) fetchProfile(s.user.id)
    }).catch(() => {
      clearTimeout(safetyTimer)
      setIsLoading(false)
    })

    // IMPORTANT: never `await` Supabase calls inside this callback — it holds
    // the auth lock and any query would deadlock. Defer with setTimeout(0).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        const userId = s.user.id
        setTimeout(() => { fetchProfile(userId) }, 0)
      } else {
        setProfile(null)
      }
    })

    return () => {
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signOut = async (): Promise<void> => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('sb-'))
      .forEach(k => localStorage.removeItem(k))
    setUser(null)
    setSession(null)
    setProfile(null)
    try {
      await supabase.auth.signOut()
    } catch {
      // state and storage already cleared above
    }
  }

  const userRole = (profile?.role as UserRole) ?? null
  const isAdmin = userRole === 'admin' || userRole === 'super_admin'
  const isSuperAdmin = userRole === 'super_admin'
  const hasRole = (required: UserRole): boolean =>
    (ROLE_RANK[userRole ?? 'user'] ?? 0) >= ROLE_RANK[required]

  return (
    <AuthContext.Provider value={{ user, profile, session, isLoading, isAdmin, isSuperAdmin, userRole, hasRole, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
