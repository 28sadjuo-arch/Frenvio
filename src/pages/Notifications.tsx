import React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import NotificationList from '../components/notifications/NotificationList'
import { useAuth } from '../contexts/AuthContext'

const Notifications: React.FC = () => {
  const { user } = useAuth()
  const qc = useQueryClient()

  // Mark all as read when page opens (your original logic)
  React.useEffect(() => {
    if (!user) return
    const markAllRead = async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)
      if (!error) {
        qc.invalidateQueries({ queryKey: ['notifications', user.id] })
      }
    }
    markAllRead()
  }, [user, qc])

  const { data: notifications = [], isLoading } = useQuery({
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

      // 2) Batch fetch actors
      const actorIds = Array.from(new Set(notifs.map((n: any) => n.actor_id).filter(Boolean)))
      let actorsById: Record<string, any> = {}

      if (actorIds.length > 0) {
        const { data: actors, error: actorErr } = await supabase
          .from('profiles')
          .select('id, username, display_name, verified, avatar_url')
          .in('id', actorIds)

        if (actorErr) {
          console.warn('Failed to load actors:', actorErr)
        } else {
          actorsById = Object.fromEntries((actors || []).map((a: any) => [a.id, a]))
        }
      }

      // 3) Shape data with better message formatting
      return notifs.map((n: any) => {
        const actor = n.actor_id ? actorsById[n.actor_id] : null
        const name = actor?.display_name || actor?.username || 'Someone'
        const uname = actor?.username || 'unknown'

        let boldPart = ''
        let normalPart = ''

        if (n.type === 'verified') {
          boldPart = 'Your verification badge is here!'
          normalPart = 'Your account is now verified.'
        } else if (actor) {
          boldPart = actor.verified
            ? `${name} <VerifiedBadge />`
            : name
          normalPart =
            n.type === 'like' ? 'liked your post' :
            n.type === 'follow' ? 'started following you' :
            n.type === 'repost' ? 'reposted your post' :
            n.type === 'comment' ? 'commented on your post' :
            'sent you a notification'
        } else {
          boldPart = 'Notification'
          normalPart = n.message || ''
        }

        return {
          ...n,
          actor,
          boldPart,
          normalPart,
          avatar_url: actor?.avatar_url,
          verified: actor?.verified,
          link: n.post_id ? `/p/${n.post_id}` : actor ? `/${uname}` : '#',
        }
      })
    },
  })

  // Mark all read button (manual trigger)
  const handleMarkAllRead = async () => {
    if (!user) return
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    if (!error) {
      qc.invalidateQueries({ queryKey: ['notifications', user.id] })
    }
  }

  const hasUnread = notifications.some((n: any) => !n.read)

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-6 min-h-screen">
      {/* Header with Mark All Read */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Notifications
        </h1>

        {hasUnread && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center text-slate-400 py-12">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-slate-500 py-16">
          No notifications yet. When someone likes, follows, or comments, you'll see it here.
        </div>
      ) : (
        <NotificationList notifications={notifications} />
      )}
    </div>
  )
}

export default Notifications
