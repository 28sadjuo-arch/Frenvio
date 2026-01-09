import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import NotificationList from '../components/notifications/NotificationList'

const Notifications: React.FC = () => {
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false })
      return data
    }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      <NotificationList notifications={notifications || []} />
    </div>
  )
}

export default Notifications