import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import TypingIndicator from './TypingIndicator'

interface ChatRoomProps {
  otherUserId: string
}

const ChatRoom: React.FC<ChatRoomProps> = ({ otherUserId }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    const channel = supabase.channel('chat')
      .on('broadcast', { event: 'message' }, ({ payload }) => setMessages((prev) => [...prev, payload]))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    await supabase.channel('chat').send({
      event: 'message',
      type: 'broadcast',
      payload: { text: newMessage, user_id: user!.id, timestamp: new Date().toISOString() }
    })
    setNewMessage('')
  }

  const editMessage = (id: string, text: string) => {
    // Update local, then DB
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, text } : m))
    setEditingId(null)
  }

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="h-96 flex flex-col">
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`p-2 rounded ${msg.user_id === user!.id ? 'bg-blue-100 ml-auto' : 'bg-gray-100'}`}>
            {editingId === msg.id ? (
              <input value={editText} onChange={(e) => setEditText(e.target.value)} onBlur={() => editMessage(msg.id, editText)} autoFocus />
            ) : (
              <>
                <p>{msg.text}</p>
                <button onClick={() => { setEditingId(msg.id); setEditText(msg.text) }}>Edit</button>
                <button onClick={() => deleteMessage(msg.id)}>Delete</button>
              </>
            )}
          </div>
        ))}
        <TypingIndicator />
      </div>
      <div className="p-4 border-t">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="w-full p-2 border rounded"
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
      </div>
    </div>
  )
}

export default ChatRoom