import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'

type AuthContextType = {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    username: string,
    fullName: string,
  ) => Promise<{ ok: boolean; error?: string }>
  signIn: (identifier: string, password: string) => Promise<{ ok: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (uid: string | null) => {
    if (!uid) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    if (error) {
      // If RLS blocks reads, you'll see it in console; app still works without profile details.
      console.warn('fetchProfile error', error.message)
      setProfile(null)
      return
    }
    setProfile((data as Profile) ?? null)
  }

  const refreshProfile = async () => {
    await fetchProfile(user?.id ?? null)
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
      fetchProfile(data.session?.user?.id ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      fetchProfile(newSession?.user?.id ?? null)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    // Basic normalization
    const cleanUsername = (username || '').trim().replace(/^@+/, '').toLowerCase()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: cleanUsername, full_name: fullName },
      },
    })

    if (error) return { ok: false, error: error.message }

    // Create/Upsert profile row (if we already have the user id).
    const uid = data.user?.id
    if (uid) {
      const { error: upsertErr } = await supabase.from('profiles').upsert({
        id: uid,
        email,
        username: cleanUsername,
        display_name: fullName || null,
        verified: false,
      })
      if (upsertErr) console.warn('profile upsert error', upsertErr.message)
    }

    return { ok: true }
  }

  const signIn = async (identifier: string, password: string) => {
    const id = (identifier || '').trim()
    let email = id

    // Allow login with username: look up email from profiles
    if (!id.includes('@')) {
      const uname = id.replace(/^@+/, '').toLowerCase()
      const { data, error } = await supabase.from('profiles').select('email').eq('username', uname).maybeSingle()
      if (error) return { ok: false, error: 'Username not found or not accessible yet.' }
      if (!data?.email) return { ok: false, error: 'No email found for that username.' }
      email = data.email
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const value = useMemo(
    () => ({ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }),
    [user, session, profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider')
  return context
}
