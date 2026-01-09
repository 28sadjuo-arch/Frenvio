import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)

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
    const onFollowUpdated = () => loadFollowing()
    window.addEventListener('follow-updated', onFollowUpdated)
    loadFollowing()
    return () => {
      window.removeEventListener('follow-updated', onFollowUpdated)
      active = false
    }
  }, [user?.id, targetUserId])

  const doFollow = async () => {
    if (!user || !targetUserId || user.id === targetUserId) return
    setBusy(true)
    try {
      const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId })
      if (!error) {
        setFollowing(true)
        window.dispatchEvent(new Event('follow-updated'))
        // notify target
        try {
          await supabase.from('notifications').insert({ user_id: targetUserId, actor_id: user.id, type: 'follow' })
        } catch {}
      }
    } finally {
      setBusy(false)
    }
  }

  const doUnfollow = async () => {
    if (!user || !targetUserId || user.id === targetUserId) return
    setBusy(true)
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
      if (!error) {
        setFollowing(false)
        window.dispatchEvent(new Event('follow-updated'))
      }
    } finally {
      setBusy(false)
      setMenuOpen(false)
    }
  }

  // Close menu on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuOpen) return
      const t = e.target as any
      if (btnRef.current && btnRef.current.contains(t)) return
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  if (!user || user.id === targetUserId) return null
  // In compact contexts (e.g., post header), hide button once following
  if (compact && following) return null

  return (
    <div className="relative inline-block">
      {!following ? (
        <button className={classes} disabled={busy} onClick={doFollow}>
          Follow
        </button>
      ) : (
        <>
          <button
            ref={btnRef}
            className={classes}
            disabled={busy}
            onClick={() => setMenuOpen((s) => !s)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            Following
          </button>

          {menuOpen ? (
            <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg z-50">
              <button
                onClick={doUnfollow}
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900 text-red-600"
              >
                Unfollow
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
