import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Send } from 'lucide-react'
import { formatRelativeTime } from '../../utilis/time'

interface ChatRoomProps {
  otherUserId: string
  initialMessage?: string
}

const ChatRoom: React.FC<ChatRoomProps> = ({ otherUserId, initialMessage = '' }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    if (initialMessage) setNewMessage(initialMessage)
  }, [initialMessage])

  const roomId = useMemo(() => {
    if (!user) return ''
    return [user.id, otherUserId].sort().join(':')
  }, [user, otherUserId])

  useEffect(() => {
    let ignore = false

    async function load() {
      if (!user || !roomId) return
      const { data } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, content, created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
      if (!ignore) setMessages(data || [])
    }

    load()

    if (!user || !roomId) return () => {}

    const channel = supabase
      .channel('room:' + roomId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const row: any = payload.new
          setMessages((prev) => [...prev, row])
        }
      )
      .subscribe()

    return () => {
      ignore = true
      supabase.removeChannel(channel)
    }
  }, [user, roomId])

  // Fix cleanup (python inserted weird). We'll implement proper below after write.
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="font-extrabold">Chat</div>
        <div className="text-xs text-slate-500">Room: {roomId.slice(0, 8)}…</div>
      </div>

      <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
        {messages.map((m: any) => {
          const mine = m.sender_id === user?.id
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${mine ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'}`}>
                <div className="whitespace-pre-wrap break-words text-sm">{m.content}</div>
                <div className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-slate-500'}`}>{formatRelativeTime(m.created_at)}</div>
              </div>
            </div>
          )
        })}
        {messages.length === 0 && <div className="text-sm text-slate-500">Say hi 👋</div>}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                ;(document.getElementById('send-btn') as HTMLButtonElement)?.click()
              }
            }}
          />
          <button
            id="send-btn"
            className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={!newMessage.trim()}
            onClick={async () => {
              if (!user || !roomId || !newMessage.trim()) return
              const content = newMessage.trim()
              setNewMessage('')
              await supabase.from('messages').insert({
                room_id: roomId,
                sender_id: user.id,
                receiver_id: otherUserId,
                content,
              })
            }}
            aria-label="Send"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatRoom
