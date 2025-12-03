import React from 'react'

interface Notification {
  id: string
  type: string
  message: string
  read: boolean
}

interface NotificationListProps {
  notifications: Notification[]
}

const NotificationList: React.FC<NotificationListProps> = ({ notifications }) => (
  <div className="space-y-2">
    {notifications.map((notif) => (
      <div key={notif.id} className={`p-3 rounded ${notif.read ? 'bg-gray-100' : 'bg-blue-100'}`}>
        {notif.message}
      </div>
    ))}
  </div>
)

export default NotificationList