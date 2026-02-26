import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

type Props = {
  targetUserId: string
  size?: 'sm' | 'md'
  compact?: boolean
  /** When true, the button renders nothing once the viewer is already following the target. */
  hideWhenFollowing?: boolean
}

export default function FollowButton({
  targetUserId,
  size = 'sm',
  compact = false,
  hideWhenFollowing = false,
}: Props) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [following, setFollowing] = useState<boolean | null>(null)
  const [optimisticFollowing, setOptimisticFollowing] = useState<boolean | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  // Use optimistic value if set, else real value
  const isFollowing = optimisticFollowing ?? following

  const btnClass = useMemo(() => {
    const base = 'inline-flex items-center justify-center font-extrabold rounded-full border transition select-none'
    const sizeCls = size === 'md' ? 'h-10 px-4 text-sm' : compact ? 'h-8 px-3 text-xs' : 'h-8 px-4 text-sm'
    const common = `${base} ${sizeCls}`
    if (isFollowing) {
      return `${common} border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900`
    }
    return `${common} border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700`
  }, [isFollowing, size, compact])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuOpen) return
      if (!rootRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  useEffect(() => {
    let active = true

    const loadFollowing = async () => {
      if (!user || !targetUserId || user.id === targetUserId) {
        active && setFollowing(false)
        return
      }

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle()

      if (!active) return

      if (error) {
        console.warn('Follow check failed (possibly RLS)', error)
        // Don't override optimistic state
        setFollowing((prev) => prev ?? false)
        return
      }

      const realFollowing = !!data
      setFollowing(realFollowing)
      setOptimisticFollowing(null) // Clear optimistic after sync
    }

    const onFollowUpdated = (e: Event) => {
      const ce = e as CustomEvent<{ targetUserId: string }>
      if (ce.detail?.targetUserId === targetUserId) {
        loadFollowing()
      }
    }

    window.addEventListener('follow-updated', onFollowUpdated)
    loadFollowing()

    return () => {
      active = false
      window.removeEventListener('follow-updated', onFollowUpdated)
    }
  }, [user?.id, targetUserId])

  const emitUpdate = () => {
    window.dispatchEvent(new CustomEvent('follow-updated', { detail: { targetUserId } }))
  }

  const doFollow = async () => {
    if (!user || !targetUserId || user.id === targetUserId || busy) return

    // Optimistic update
    setOptimisticFollowing(true)
    setBusy(true)

    try {
      const { error } = await supabase
        .from('follows')
        .upsert({ follower_id: user.id, following_id: targetUserId }, { onConflict: 'follower_id,following_id' })

      if (error) throw error

      emitUpdate()
    } catch (e) {
      console.error('Follow failed:', e)
      setOptimisticFollowing(null) // Revert
      // Optionally show toast: "Failed to follow"
    } finally {
      setBusy(false)
    }
  }

  const doUnfollow = async () => {
    if (!user || !targetUserId || user.id === targetUserId || busy) return

    // Optimistic
    setOptimisticFollowing(false)
    setBusy(true)
    setMenuOpen(false)

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)

      if (error) throw error

      emitUpdate()
    } catch (e) {
      console.error('Unfollow failed:', e)
      setOptimisticFollowing(null) // Revert
    } finally {
      setBusy(false)
    }
  }

  if (!user || !targetUserId || user.id === targetUserId) return null
  if (isFollowing && hideWhenFollowing) return null

  if (following === null && optimisticFollowing === null) {
    return (
      <button className={btnClass} disabled>
        …
      </button>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      {!isFollowing ? (
        <button className={btnClass} onClick={doFollow} disabled={busy}>
          {busy ? 'Following...' : 'Follow'}
        </button>
      ) : (
        <>
          <button
            className={btnClass}
            onClick={() => setMenuOpen((v) => !v)}
            disabled={busy}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {busy ? 'Updating...' : 'Following'}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg z-50">
              <button
                onClick={doUnfollow}
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900 text-red-600"
                disabled={busy}
              >
                Unfollow
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
