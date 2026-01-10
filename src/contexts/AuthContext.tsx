import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'

type AuthContextType = {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  /** Sign up using full name + username + password (email is handled internally). */
  signUp: (
    password: string,
    username: string,
    fullName: string,
  ) => Promise<{ ok: boolean; error?: string }>
  /** Sign in using username (or email) + password. */
  signIn: (identifier: string, password: string) => Promise<{ ok: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    if (!user) return
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      setProfile((data as any) || null)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (!newSession) setProfile(null)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) return
    refreshProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const signUp = async (password: string, username: string, fullName: string) => {
    const cleanUsername = (username || '').trim().replace(/^@+/, '').toLowerCase()
    if (!cleanUsername || cleanUsername.length < 3 || !/^[a-z0-9_]+$/.test(cleanUsername)) {
      return { ok: false, error: 'Username must be at least 3 characters and contain only letters, numbers, or _' }
    }

    // Ensure username is free (best-effort)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle()
    if (existing?.id) return { ok: false, error: 'That username is already taken.' }

    // Supabase Auth still needs an email. We generate a hidden one.
    const email = `${cleanUsername}@users.frenvio.local`

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: cleanUsername, full_name: fullName },
      },
    })
    if (error) return { ok: false, error: error.message }

    // If your Supabase project has email confirmation ON, signUp may not create a session.
    // Try to sign-in immediately so we can create/update the profile in the same flow.
    const uid = data.user?.id
    const session = data.session

    if (!session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (!signInError) {
        // Now we are authenticated; upsert profile so username login works immediately.
        const authedUid = signInData.user?.id
        if (authedUid) {
          await supabase.from('profiles').upsert(
            {
              id: authedUid,
              email,
              username: cleanUsername,
              display_name: fullName || null,
            },
            { onConflict: 'id' },
          )
        }
        return { ok: true }
      }

      // If sign-in is blocked due to email confirmation settings, still report success but tell user to log in.
      // (Auth.tsx will handle this and switch to login view.)
      if (uid) {
        return { ok: true, error: 'Account created. Please log in to continue.' }
      }
      return { ok: false, error: signInError?.message || 'Account created but could not start a session.' }
    }

    // If we already have a session, we can upsert the profile now.
    if (uid) {
      await supabase.from('profiles').upsert(
        {
          id: uid,
          email,
          username: cleanUsername,
          display_name: fullName || null,
        },
        { onConflict: 'id' },
      )
    }

    return { ok: true }
  }

  const signIn = async (identifier: string, password: string) => {
    const id = (identifier || '').trim()
    let email = id

    // Login with username (look up email from profiles)
    if (!id.includes('@')) {
      const uname = id.replace(/^@+/, '').toLowerCase()
      const { data, error } = await supabase.from('profiles').select('email').eq('username', uname).maybeSingle()
      if (error) return { ok: false, error: 'Username not found or not accessible yet.' }
      if (!data?.email) return { ok: false, error: 'No account found for that username.' }
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

  // Presence heartbeat (best-effort)
  React.useEffect(() => {
    if (!user) return
    const ping = async () => {
      try {
        await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)
      } catch {
        // ignore
      }
    }
    ping()
    const t = setInterval(ping, 60_000)
    return () => clearInterval(t)
  }, [user?.id])

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
