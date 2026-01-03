import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Send } from 'lucide-react'
import { formatRelativeTime } from '../../utilis/time'

interface ChatRoomProps {
  otherUserId: string
}

const ChatRoom: React.FC<ChatRoomProps> = ({ otherUserId }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')

  const roomId = useMemo(() => {
    if (!user) return null
    return [user.id, otherUserId].sort().join(':')
  }, [user, otherUserId])

  const loadMessages = async () => {
    if (!roomId) return
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
    if (!error) setMessages(data || [])
  }

  useEffect(() => {
    loadMessages()

    if (!roomId) return
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, () => {
        loadMessages()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  const sendMessage = async () => {
    if (!user || !roomId) return
    if (!newMessage.trim()) return

    const text = newMessage.trim()
    setNewMessage('')

    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      sender_id: user.id,
      receiver_id: otherUserId,
      content: text,
    })
    if (error) {
      console.error(error)
      alert('Could not send message.')
      setNewMessage(text)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col h-[70vh]">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-extrabold">
        Chat
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => {
          const mine = m.sender_id === user?.id
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'}`}>
                <div className="whitespace-pre-wrap">{m.content}</div>
                <div className={`mt-1 text-[11px] ${mine ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>
                  {m.created_at ? formatRelativeTime(m.created_at) : ''}
                </div>
              </div>
            </div>
          )
        })}
        {messages.length === 0 && (
          <div className="text-sm text-slate-500">Say hi 👋</div>
        )}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatRoom
