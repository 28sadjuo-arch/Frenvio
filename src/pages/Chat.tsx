import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import ChatRoom from '../components/chat/ChatRoom'

type Tab = 'inbox' | 'groups' | 'requests'

const Chat: React.FC = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('inbox')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const { data: users } = useQuery({
    queryKey: ['chat-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, username, display_name, avatar_url, verified').neq('id', user?.id)
      if (error) return []
      return data || []
    },
    enabled: !!user && tab === 'inbox',
  })

  return (
    <div className="grid md:grid-cols-5 gap-4">
      <div className="md:col-span-2">
        <h1 className="text-xl font-extrabold tracking-tight mb-3">Messages</h1>

        <div className="flex rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          {(['inbox','groups','requests'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); if (t !== 'inbox') setSelectedUserId(null) }}
              className={`flex-1 py-2 text-sm font-semibold ${tab === t ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
            >
              {t === 'inbox' ? 'Inbox' : t === 'groups' ? 'Groups' : 'Requests'}
            </button>
          ))}
        </div>

        {tab !== 'inbox' ? (
          <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-sm text-slate-600 dark:text-slate-300">
            {tab === 'groups' ? 'Group chats are coming soon.' : 'Message requests are coming soon.'}
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {(users || []).map((u: any) => (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`w-full flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:bg-slate-50 dark:hover:bg-slate-900/80 transition ${selectedUserId === u.id ? 'ring-2 ring-blue-500/40' : ''}`}
              >
                <img
                  src={u.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(u.username || 'u')}`}
                  className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
                  alt="avatar"
                />
                <div className="text-left min-w-0">
                  <div className="font-bold truncate">{u.display_name || u.username}</div>
                  <div className="text-sm text-slate-500 truncate">@{u.username}</div>
                </div>
              </button>
            ))}
            {(!users || users.length === 0) && (
              <div className="text-sm text-slate-500">No users found.</div>
            )}
          </div>
        )}
      </div>

      <div className="md:col-span-3">
        {selectedUserId ? (
          <ChatRoom otherUserId={selectedUserId} />
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-600 dark:text-slate-300">
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
