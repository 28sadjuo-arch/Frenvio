import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import NotificationList from '../components/notifications/NotificationList'
import { useAuth } from '../contexts/AuthContext'

const Notifications: React.FC = () => {
  const { user } = useAuth()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, created_at, read, post_id, actor:profiles!actor_id(id, username, display_name, verified, avatar_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) return []
      return data || []
    },
    enabled: !!user,
  })

  const shaped = (notifications || []).map((n: any) => {
    const a = n.actor
    const name = a?.display_name || a?.username || 'Someone'
    const uname = a?.username || 'user'
    const base =
      n.type === 'like' ? 'liked your post' :
      n.type === 'comment' ? 'commented on your post' :
      n.type === 'follow' ? 'started following you' :
      n.type === 'repost' ? 'reposted your post' : 'sent you a notification'
    return {
      ...n,
      message: `${name} (@${uname}) ${base}`,
    }
  })

  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight mb-3">Notifications</h1>
      {isLoading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : (
        <NotificationList notifications={(shaped as any) || []} />
      )}
    </div>
  )
}

export default Notifications
