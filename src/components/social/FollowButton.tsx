import React, { useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function FollowButton({ targetUserId, size = 'sm' }: { targetUserId: string, size?: 'sm' | 'md' }) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [following, setFollowing] = useState<boolean | null>(null)

  const classes = useMemo(() => {
    const base = 'rounded-full font-semibold transition disabled:opacity-60'
    const pad = size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'
    if (following) return `${base} ${pad} border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800`
    return `${base} ${pad} bg-blue-600 hover:bg-blue-700 text-white`
  }, [following, size])

  React.useEffect(() => {
    let ignore = false
    async function load() {
      if (!user || !targetUserId || user.id === targetUserId) return
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle()
      if (ignore) return
      if (error) {
        setFollowing(null)
        return
      }
      setFollowing(!!data)
    }
    load()
    return () => { ignore = true }
  }, [user, targetUserId])

  if (!user || user.id === targetUserId) return null

  const toggle = async () => {
    if (following === null) return
    setBusy(true)
    try {
      if (following) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetUserId)
        setFollowing(false)
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId })
        setFollowing(true)
        if (user.id !== targetUserId) {
          try { await supabase.from('notifications').insert({ user_id: targetUserId, actor_id: user.id, type: 'follow' }) } catch {}
        }
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button className={classes} disabled={busy} onClick={toggle}>
      {following === null ? 'Follow' : following ? 'Following' : 'Follow'}
    </button>
  )
}
