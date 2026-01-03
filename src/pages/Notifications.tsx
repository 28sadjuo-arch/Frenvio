import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import NotificationList from '../components/notifications/NotificationList'

const Notifications: React.FC = () => {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false })
      if (error) return []
      return data || []
    },
  })

  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight mb-3">Notifications</h1>
      {isLoading ? <div className="text-sm text-slate-500">Loading…</div> : <NotificationList notifications={(notifications as any) || []} />}
    </div>
  )
}

export default Notifications
