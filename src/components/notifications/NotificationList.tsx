import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, Repeat2, Bell, Trash2, BadgeCheck } from 'lucide-react'
import VerifiedBadge from '../common/VerifiedBadge' // Make sure path is correct!
import { formatRelativeTime } from '../../utilis/time'
import { badgeVariantForProfile } from '../../utilis/badge'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface Notification {
  id: string
  type: string
  boldPart: string
  normalPart: string
  hasVerifiedBadgeInName?: boolean
  read: boolean
  created_at?: string
  post_id?: string | null
  actor_id?: string | null
  actor?: any
  avatar_url?: string | null
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

  const openNotif = async (n: Notification) => {
    await supabase.from('notifications').update({ read: true }).eq('id', n.id)
    if (n.link && n.link !== '#') return navigate(n.link)
    if (n.type === 'follow' && n.actor?.username) return navigate(`/${n.actor.username}`)
    if (n.type === 'verified' && user?.id) return navigate(`/u/${user.id}`)
    if (n.post_id) {
      if (n.type === 'comment') return navigate(`/p/${n.post_id}?focus=comments`)
      return navigate(`/p/${n.post_id}`)
    }
  }

  return (
    <div className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      {notifications.map((n) => (
        <div
          key={n.id}
          role="button"
          tabIndex={0}
          onClick={() => openNotif(n)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openNotif(n) }}
          className={`group flex items-start gap-3 px-4 py-3 transition cursor-pointer border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 ${
            n.read ? 'opacity-90' : ''
          }`}
        >
          {/* Left icon */}
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
            {iconFor(n.type)}
            {!n.read ? (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-950" />
            ) : null}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Avatar + name + badge */}
            {n.actor && (
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={n.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${n.actor.username}`}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover border border-slate-600"
                />
                <span className="font-medium text-sm">
                  {n.boldPart}
                  {badgeVariantForProfile(n.actor) && (
                    <VerifiedBadge size={14} variant={badgeVariantForProfile(n.actor)!} className="ml-1 inline-block" />
                  )}
                </span>
              </div>
            )}

            {/* Message */}
            <div className="text-sm text-slate-800 dark:text-slate-200 leading-snug">
              {!n.actor && <span className="font-bold">{n.boldPart}</span>}
              <span>{n.normalPart}</span>
            </div>

            {/* Time */}
            {n.created_at && (
              <div className="mt-1 text-xs text-slate-500">
                {formatRelativeTime(n.created_at)}
              </div>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); remove(n.id) }}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-red-500 opacity-70 hover:opacity-100 transition"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {notifications.length === 0 && (
        <div className="text-center py-10 text-slate-500 text-sm">
          No notifications yet.
        </div>
      )}
    </div>
  )
}

export default NotificationList
