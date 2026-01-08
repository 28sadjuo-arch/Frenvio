import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, Repeat2, Bell, Trash2, BadgeCheck } from 'lucide-react'
import { formatRelativeTime } from '../../utilis/time'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  created_at?: string
  post_id?: string | null
  actor_id?: string | null
  actor?: {
    id: string
    username?: string | null
    display_name?: string | null
    verified?: boolean | null
    avatar_url?: string | null
  } | null
}

const iconFor = (type: string) => {
  const common = 'h-4 w-4'
  switch (type) {
    case 'like':
      return <Heart className={common} />
    case 'comment':
      return <MessageCircle className={common} />
    case 'follow':
      return <UserPlus className={common} />
    case 'repost':
      return <Repeat2 className={common} />
    case 'verified':
      return <BadgeCheck className={common} />
    default:
      return <Bell className={common} />
  }
}

const NotificationList: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const remove = async (id: string) => {
    if (!user) return
    await supabase.from('notifications').delete().eq('id', id)
  }

  const markRead = async (id: string) => {
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }

  const openNotif = async (n: Notification) => {
    // Mark read but don't block navigation if it fails.
    markRead(n.id)

    if (n.type === 'follow') {
      const uname = n.actor?.username
      if (uname) return navigate(`/${uname}`)
      if (n.actor_id) return navigate(`/profile/${n.actor_id}`)
      return
    }

    if (n.type === 'verified') {
      // Owner profile
      if (user?.id) return navigate(`/u/${user.id}`)
      return
    }

    if (n.post_id) {
      if (n.type === 'comment') return navigate(`/p/${n.post_id}?focus=comments`)
      return navigate(`/p/${n.post_id}`)
    }
  }

  return (
    <div className="space-y-3">
      {notifications.map((n) => (
        <div
          key={n.id}
          role="button"
          tabIndex={0}
          onClick={() => openNotif(n)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') openNotif(n)
          }}
          className={`flex items-start gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/60 transition ${
            !n.read ? 'ring-1 ring-blue-500/20' : ''
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
