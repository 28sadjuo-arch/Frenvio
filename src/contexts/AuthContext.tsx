import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, Profile } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, username: string) => Promise<{ ok: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (uid?: string | null) => {
    const id = uid ?? user?.id
    if (!id) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
    if (!error) setProfile(data as Profile)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
      fetchProfile(data.session?.user?.id ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      fetchProfile(newSession?.user?.id ?? null)
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshProfile = async () => {
    await fetchProfile(user?.id ?? null)
  }

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // If your Supabase Auth email confirmation is ON, the user may need to confirm first.
        emailRedirectTo: window.location.origin + '/dashboard',
        data: { username },
      },
    })

    if (error) return { ok: false, error: error.message }

    // Create profile row right away if we already have the user id.
    const uid = data.user?.id
    if (uid) {
      await supabase.from('profiles').upsert({
        id: uid,
        username,
        verified: false,
        followers_count: 0,
        following_count: 0,
      })
      await fetchProfile(uid)
    }

    // Welcome email via Edge Function (works only after you deploy the function + set secrets).
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: 'Welcome to Frenvio!',
          body: 'Thanks for joining Frenvio. Where friends share, chat, and connect.',
        },
      })
    } catch {
      // Ignore silently; the app should still work even if email function isn't deployed.
    }

    return { ok: true }
  }

  const signIn = async (email: string, password: string) => {
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
