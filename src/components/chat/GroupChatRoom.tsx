

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowLeft, Send, Trash2 } from 'lucide-react'

type GroupChatRoomProps = {
  groupId: string
  onBack?: () => void
  initialText?: string
  autoSendInitial?: boolean
}

type Message = {
  id: string
  sender_id: string
  content: string
  created_at: string
}

const renderTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)

  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="underline text-blue-600 dark:text-blue-400 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function GroupChatRoom({
  groupId,
  onBack,
  initialText = '',
  autoSendInitial = false,
}: GroupChatRoomProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState(initialText)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // Load messages
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })

      setMessages(data || [])
      scrollDown()
    }

    load()
  }, [groupId])

  // Auto send shared post
  useEffect(() => {
    if (autoSendInitial && initialText.trim()) {
      sendMessage(initialText)
      setText('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scrollDown = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  const sendMessage = async (override?: string) => {
    const content = override ?? text
    if (!content.trim()) return

    const { error, data } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        sender_id: user?.id,
        content,
      })
      .select()
      .single()

    if (!error && data) {
      setMessages((prev) => [...prev, data])
      setText('')
      scrollDown()
    }
  }

  const deleteMessage = async (id: string) => {
    await supabase.from('group_messages').delete().eq('id', id)
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b dark:border-slate-800">
        {onBack && (
          <button onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="font-semibold">Group chat</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m) => {
          const mine = m.sender_id === user?.id
          return (
            <div
              key={m.id}
              className={`max-w-[80%] p-2 rounded-lg text-sm ${
                mine
                  ? 'ml-auto bg-blue-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            >
              <div>{renderTextWithLinks(m.content)}</div>
              {mine && (
                <button
                  onClick={() => deleteMessage(m.id)}
                  className="mt-1 text-xs opacity-70"
                >
                  <Trash2 className="w-3 h-3 inline" />
                </button>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t dark:border-slate-800 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          className="flex-1 px-3 py-2 rounded-lg border dark:border-slate-700 bg-transparent"
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage()
          }}
        />
        <button
          onClick={() => sendMessage()}
          className="p-2 rounded-full bg-blue-500 text-white"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
