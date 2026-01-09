import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function FollowButton({
  targetUserId,
  size = 'sm',
  compact = false,
}: {
  targetUserId: string
  size?: 'sm' | 'md'
  compact?: boolean
}) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [following, setFollowing] = useState<boolean | null>(null)

  const classes = useMemo(() => {
    const base = 'rounded-full font-semibold transition disabled:opacity-60'
    const pad = compact ? 'px-3 py-1.5 text-xs' : size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'
    if (following) {
      return `${base} ${pad} border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800`
    }
    return `${base} ${pad} bg-blue-600 hover:bg-blue-700 text-white`
  }, [following, size, compact])

    useEffect(() => {
    let active = true
    async function loadFollowing() {
      if (!user) return
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle()
      if (!active) return
      if (error) {
        setFollowing(false)
        return
      }
      setFollowing(!!data)
    }
    loadFollowing()
    return () => {
      active = false
    }
  }, [user?.id, targetUserId])

  const toggle = async () => {
    if (!user || !targetUserId || user.id === targetUserId) return
    setBusy(true)
    try {
      if (following) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
        if (!error) setFollowing(false)
      } else {
        const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId })
        if (!error) {
          setFollowing(true)
          // notify target
          try {
            await supabase.from('notifications').insert({ user_id: targetUserId, actor_id: user.id, type: 'follow' })
          } catch {}
        }
      }
    } finally {
      setBusy(false)
    }
  }

  if (!user || user.id === targetUserId) return null
  // In compact contexts (e.g., post header), hide the button once following
  if (compact && following) return null

  return (
    <button className={classes} disabled={busy} onClick={toggle}>
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
