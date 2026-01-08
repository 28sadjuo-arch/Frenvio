import React from 'react'
import { Heart, MessageCircle, UserPlus, Repeat2, Bell, Trash2, BadgeCheck } from 'lucide-react'
import { formatRelativeTime } from '../../utilis/time'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  created_at?: string
  post_id?: string | null
  actor_id?: string | null
  actor?: { username?: string | null } | null
}

const iconFor = (type: string) => {
  const common = 'h-4 w-4'
  switch (type) {
    case 'like': return <Heart className={common} />
    case 'comment': return <MessageCircle className={common} />
    case 'follow': return <UserPlus className={common} />
    case 'repost': return <Repeat2 className={common} />
    case 'verified': return <BadgeCheck className={common} />
    default: return <Bell className={common} />
  }
}

const NotificationList: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const remove = async (id: string) => {
    if (!user) return
    await supabase.from('notifications').delete().eq('id', id)
  }

  const open = async (n: Notification) => {
    if (!user) return
    // Mark read (best effort)
    if (!n.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id)
    }

    const actorUsername = (n as any)?.actor?.username

    if (n.type === 'follow' && actorUsername) {
      navigate(`/${actorUsername}`)
      return
    }

    if ((n.type === 'like' || n.type === 'repost') && n.post_id) {
      navigate(`/p/${n.post_id}`)
      return
    }

    if (n.type === 'comment' && n.post_id) {
      navigate(`/p/${n.post_id}#comments`)
      return
    }

    if (n.type === 'verified') {
      // Land to owner profile
      const { data } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()
      if (data?.username) navigate(`/${data.username}`)
      return
    }
  }

  return (
    <div className="space-y-3">
      {notifications.map((n) => (
        <div
          key={n.id}
          onClick={() => open(n)}
          className={`flex items-start gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 ${
            n.read ? '' : 'ring-1 ring-blue-500/30'
          }`}
        >
          <div className="mt-0.5 text-slate-600 dark:text-slate-300">{iconFor(n.type)}</div>

          <div className="flex-1">
            <div className="text-sm">{n.message}</div>
            {n.created_at && <div className="text-xs text-slate-500 mt-1">{formatRelativeTime(n.created_at)}</div>}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              remove(n.id)
            }}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500"
            aria-label="Delete notification"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {notifications.length === 0 && <div className="text-sm text-slate-500">No notifications yet.</div>}
    </div>
  )
}

export default NotificationList
