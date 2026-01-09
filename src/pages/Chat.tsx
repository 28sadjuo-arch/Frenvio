import React, { useState } from 'react'
import ChatRoom from '../components/chat/ChatRoom'
import { useAuth } from '../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const Chat: React.FC = () => {
  const { user } = useAuth()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, username').neq('id', user?.id)
      return data
    }
  })

  if (!selectedUserId) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Chats</h1>
        <div className="space-y-2">
          {users?.map((u: any) => (
            <button key={u.id} onClick={() => setSelectedUserId(u.id)} className="w-full text-left p-2 bg-gray-100 rounded">
              {u.username}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return <ChatRoom otherUserId={selectedUserId} />
}

export default Chat