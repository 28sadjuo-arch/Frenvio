import React from 'react'
import { Heart, MessageCircle, UserPlus, Repeat2, Bell } from 'lucide-react'
import { formatRelativeTime } from '../../utilis/time'

interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  created_at?: string
}

const iconFor = (type: string) => {
  const common = 'h-4 w-4'
  switch (type) {
    case 'like': return <Heart className={common} />
    case 'comment': return <MessageCircle className={common} />
    case 'follow': return <UserPlus className={common} />
    case 'repost': return <Repeat2 className={common} />
    default: return <Bell className={common} />
  }
}

const NotificationList: React.FC<{ notifications: Notification[] }> = ({ notifications }) => (
  <div className="space-y-2">
    {notifications.map((n) => (
      <div
        key={n.id}
        className={`flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 ${
          n.read ? 'bg-white dark:bg-slate-900' : 'bg-blue-50 dark:bg-blue-950/30'
        }`}
      >
        <div className="mt-0.5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
          {iconFor(n.type)}
        </div>
        <div className="flex-1">
          <div className="text-sm">{n.message}</div>
          {n.created_at && <div className="text-xs text-slate-500 mt-1">{formatRelativeTime(n.created_at)}</div>}
        </div>
      </div>
    ))}

    {notifications.length === 0 && (
      <div className="text-sm text-slate-500">No notifications yet.</div>
    )}
  </div>
)

export default NotificationList
