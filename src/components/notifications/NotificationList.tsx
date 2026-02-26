import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, Repeat2, Bell, Trash2, BadgeCheck } from 'lucide-react'
import VerifiedBadge from '../common/VerifiedBadge' // Adjust path if needed
import { formatRelativeTime } from '../../utilis/time'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface Notification {
  id: string
  type: string
  boldPart: string        // e.g. "Your verification badge is here!" or "FRENVIO (@frenvio)"
  normalPart: string      // e.g. "Your account is now verified." or "liked your post"
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
  avatar_url?: string | null
  verified?: boolean | null
  link?: string
}

const iconFor = (type: string) => {
  const common = 'h-5 w-5'
  switch (type) {
    case 'like':    return <Heart className={`${common} text-red-500`} fill="currentColor" />
    case 'comment': return <MessageCircle className={`${common} text-purple-500`} />
    case 'follow':  return <UserPlus className={`${common} text-blue-500`} />
    case 'repost':  return <Repeat2 className={`${common} text-green-500`} />
    case 'verified':return <BadgeCheck className={`${common} text-yellow-500`} fill="currentColor" />
    default:        return <Bell className={common} />
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
    markRead(n.id) // mark as read on open
    if (n.link && n.link !== '#') {
      navigate(n.link)
    } else if (n.type === 'follow' && n.actor?.username) {
      navigate(`/${n.actor.username}`)
    } else if (n.type === 'verified' && user?.id) {
      navigate(`/u/${user.id}`)
    } else if (n.post_id) {
      if (n.type === 'comment') {
        navigate(`/p/${n.post_id}?focus=comments`)
      } else {
        navigate(`/p/${n.post_id}`)
      }
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
          className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition cursor-pointer ${
            n.read
              ? 'border-slate-700 bg-slate-900/40 hover:bg-slate-800/60'
              : 'border-blue-600/40 bg-blue-950/30 hover:bg-blue-950/50 ring-1 ring-blue-500/30'
          }`}
        >
          {/* Icon on left */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800/80">
            {iconFor(n.type)}
          </div>

          {/* Avatar + content */}
          <div className="flex-1 min-w-0">
            {/* Avatar row if actor exists */}
            {n.actor && (
              <div className="flex items-center gap-2 mb-1.5">
                <img
                  src={n.actor.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${n.actor.username}`}
                  alt={n.actor.username || 'User'}
                  className="h-7 w-7 rounded-full object-cover border border-slate-600"
                />
                <span className="text-sm font-medium">
                  {n.actor.display_name || `@${n.actor.username}`}
                  {n.actor.verified && <VerifiedBadge size={14} className="ml-1 inline" />}
                </span>
              </div>
            )}

            {/* Main message: bold + normal */}
            <div className="text-sm leading-relaxed">
              <span className="font-bold text-white">{n.boldPart}</span>
              <span className="text-slate-300"> {n.normalPart}</span>
            </div>

            {/* Timestamp */}
            {n.created_at && (
              <div className="mt-1 text-xs text-slate-500">
                {formatRelativeTime(n.created_at)}
              </div>
            )}
          </div>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              remove(n.id)
            }}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-red-400 opacity-70 hover:opacity-100 transition"
            aria-label="Delete notification"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {notifications.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">
          No notifications yet.
        </div>
      )}
    </div>
  )
}

export default NotificationList
