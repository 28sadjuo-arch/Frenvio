import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import NotificationList from '../components/notifications/NotificationList'
import { useAuth } from '../contexts/AuthContext'

const Notifications: React.FC = () => {
  const { user } = useAuth()

  // Mark notifications as read when this page is opened.
  React.useEffect(() => {
    if (!user) return
    const markAllRead = async () => {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)
    }
    markAllRead()
  }, [user])

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return []

      // 1) Fetch notifications
      const { data: rows, error } = await supabase
        .from('notifications')
        .select('id, type, message, created_at, read, post_id, actor_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load notifications:', error)
        return []
      }

      const notifs = rows || []
      const actorIds = Array.from(new Set(notifs.map((n: any) => n.actor_id).filter(Boolean)))

      // 2) Batch fetch actors (profiles)
      let actorsById: Record<string, any> = {}
      if (actorIds.length > 0) {
        const { data: actors, error: actorErr } = await supabase
          .from('profiles')
          .select('id, username, display_name, verified, avatar_url')
          .in('id', actorIds)

        if (actorErr) {
          console.warn('Failed to load notification actors:', actorErr)
        } else {
          actorsById = Object.fromEntries((actors || []).map((a: any) => [a.id, a]))
        }
      }

      // 3) Shape for UI
      return notifs.map((n: any) => {
        const actor = n.actor_id ? actorsById[n.actor_id] : null
        const name = actor?.display_name || actor?.username || 'Someone'
        const uname = actor?.username || 'user'

        const base =
          n.type === 'like' ? 'liked your post' :
          n.type === 'comment' ? 'commented on your post' :
          n.type === 'follow' ? 'started following you' :
          n.type === 'repost' ? 'reposted your post' :
          n.type === 'verified' ? 'Your account has been verified' :
          'sent you a notification'

        const computedMessage =
          n.type === 'verified'
            ? 'Your account has been verified ✅'
            : `${name} (@${uname}) ${base}`

        return {
          ...n,
          actor,
          message: (n.message && String(n.message).trim().length > 0) ? n.message : computedMessage,
        }
      })
    },
  })

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4">
      <h1 className="text-xl font-extrabold tracking-tight mb-3">Notifications</h1>

      {isLoading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : (
        <NotificationList notifications={(notifications as any) || []} />
      )}
    </div>
  )
}

export default Notifications
