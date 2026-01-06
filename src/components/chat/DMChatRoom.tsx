import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { uploadChatMedia } from '../../lib/storage'
import { formatRelativeTime } from '../../utilis/time'
import { Image as ImageIcon, Mic, MoreVertical, Send } from 'lucide-react'
import TypingIndicator from './TypingIndicator'

type Msg = {
  id: string
  room_id: string
  sender_id: string
  receiver_id: string
  content: string
  message_type?: 'text' | 'image' | 'audio'
  media_url?: string | null
  read_at?: string | null
  created_at: string
}

interface DMChatRoomProps {
  otherUserId: string
  initialMessage?: string
}

function roomIdFor(a: string, b: string) {
  return [a, b].sort().join(':')
}

const QUICK_REACTIONS = ['❤️', '😂', '👍', '🔥', '😮', '😢']

const DMChatRoom: React.FC<DMChatRoomProps> = ({ otherUserId, initialMessage = '' }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Msg[]>([])
  const [newMessage, setNewMessage] = useState(initialMessage)
  const [other, setOther] = useState<any>(null)
  const [isOnline, setIsOnline] = useState(false)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [blockConfirm, setBlockConfirm] = useState(false)
  const [recording, setRecording] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recordChunksRef = useRef<BlobPart[]>([])
  const listRef = useRef<HTMLDivElement | null>(null)

  const roomId = useMemo(() => (user ? roomIdFor(user.id, otherUserId) : ''), [user, otherUserId])

  useEffect(() => {
    if (!user) return
    // Load other profile
    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, verified, last_seen_at')
      .eq('id', otherUserId)
      .maybeSingle()
      .then(({ data }) => setOther(data || null))
  }, [user, otherUserId])

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }

  useEffect(() => {
    let ignore = false
    async function load() {
      if (!user || !roomId) return
      const { data } = await supabase
        .from('messages')
        .select('id, room_id, sender_id, receiver_id, content, message_type, media_url, read_at, created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
      if (!ignore) {
        setMessages((data as any) || [])
        scrollToBottom()
      }

      // Mark messages as read (only messages sent to me)
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('receiver_id', user.id)
        .is('read_at', null)
    }
    load()

    if (!user || !roomId) return
    const channel = supabase
      .channel('dm:' + roomId, { config: { presence: { key: user.id } } })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const row: any = payload.new
          setMessages((prev) => [...prev, row])
          scrollToBottom()
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const row: any = payload.new
          setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...(m as any), ...(row as any) } : m)))
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, isTyping } = payload.payload as any
        if (userId && userId !== user.id) setTypingUser(isTyping ? userId : null)
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as any
        const online = !!state?.[otherUserId]?.length
        setIsOnline(online)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() })
        }
      })

    return () => {
      ignore = true
      supabase.removeChannel(channel)
    }
  }, [user, roomId, otherUserId])

  // Update my last seen periodically
  useEffect(() => {
    if (!user) return
    const tick = async () => {
      await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)
    }
    tick()
    const t = setInterval(tick, 30_000)
    return () => clearInterval(t)
  }, [user])

  // typing emit (debounced)
  useEffect(() => {
    if (!user || !roomId) return
    const channel = supabase.channel('typing:' + roomId)
    // channel is cheap; use broadcast without presence
    channel.subscribe()
    let t: any
    if (newMessage.trim().length > 0) {
      channel.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id, isTyping: true } })
      t = setTimeout(() => {
        channel.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id, isTyping: false } })
      }, 1200)
    } else {
      channel.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id, isTyping: false } })
    }
    return () => {
      if (t) clearTimeout(t)
      supabase.removeChannel(channel)
    }
  }, [newMessage, user, roomId])

  const sendMessage = async (payload: Partial<Msg>) => {
    if (!user || !roomId) return
    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      sender_id: user.id,
      receiver_id: otherUserId,
      content: payload.content || '',
      message_type: payload.message_type || 'text',
      media_url: payload.media_url || null,
    })
    if (error) alert('Could not send message.')
    setNewMessage('')
  }

  const onSendText = async () => {
    const content = newMessage.trim()
    if (!content) return
    await sendMessage({ content, message_type: 'text' })
  }

  const onPickImage = async (file: File) => {
    if (!user || !roomId) return
    try {
      const url = await uploadChatMedia(file, roomId)
      await sendMessage({ message_type: 'image', media_url: url, content: '' })
    } catch {
      alert('Image upload failed. Make sure Storage bucket "chat-media" exists and is public.')
    }
  }

  const startRecording = async () => {
    if (recording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      recordChunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordChunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(recordChunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        try {
          const url = await uploadChatMedia(file, roomId)
          await sendMessage({ message_type: 'audio', media_url: url, content: '' })
        } catch {
          alert('Voice upload failed. Make sure Storage bucket "chat-media" exists and is public.')
        }
      }
      recorder.start()
      setRecording(true)
    } catch {
      alert('Microphone permission denied.')
    }
  }

  const stopRecording = () => {
    if (!recorderRef.current) return
    recorderRef.current.stop()
    recorderRef.current = null
    setRecording(false)
  }

  const blockUser = async () => {
    if (!user) return
    await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: otherUserId })
    setBlockConfirm(false)
    setMenuOpen(false)
    navigate('/chat')
  }

  const Header = () => {
    const name = other?.display_name || other?.username || 'User'
    const username = other?.username ? '@' + other.username : ''
    const lastSeen = other?.last_seen_at ? formatRelativeTime(other.last_seen_at) : ''
    return (
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <button
          onClick={() => other?.username && navigate('/' + other.username)}
          className="text-left"
          title="View profile"
        >
          <div className="flex items-center gap-2">
            <div className="font-extrabold leading-tight">{name}</div>
            {other?.verified && (
              <span
                className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] leading-none"
                aria-label="Verified"
              >
                ✓
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>{username}</span>
            <span>•</span>
            <span>{isOnline ? 'Online' : lastSeen ? `Last seen ${lastSeen}` : 'Offline'}</span>
            {isOnline && <span className="inline-block h-2 w-2 rounded-full bg-green-500" />}
          </div>
        </button>

        <div className="relative">
          <button
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setMenuOpen((s) => !s)}
            aria-label="More"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg overflow-hidden z-10">
              <button
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
                onClick={() => setBlockConfirm(true)}
              >
                Block user
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const [reactionTarget, setReactionTarget] = useState<string | null>(null)

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return
    await supabase.from('message_reactions').upsert({ message_id: messageId, user_id: user.id, emoji })
    setReactionTarget(null)
  }

  const { data: reactions } = useMemo(() => {
    return { data: null }
  }, [])

  useEffect(() => {
    // light: fetch reactions once per change
    if (!roomId) return
    const fetchReactions = async () => {
      const { data } = await supabase
        .from('message_reactions')
        .select('id, message_id, user_id, emoji')
        .in(
          'message_id',
          messages.map((m) => m.id).slice(-50)
        )
      // attach
      if (!data) return
      const map: Record<string, string[]> = {}
      data.forEach((r: any) => {
        map[r.message_id] = map[r.message_id] || []
        map[r.message_id].push(r.emoji)
      })
      setMessages((prev) => prev.map((m) => ({ ...(m as any), _reactions: map[m.id] || [] })))
    }
    fetchReactions()
  }, [messages.length, roomId])

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col h-[70vh] md:h-[78vh]">
      <Header />

      <div ref={listRef} className="p-4 space-y-3 overflow-y-auto flex-1">
        {messages.map((m: any) => {
          const mine = m.sender_id === user?.id
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[86%]">
                <button
                  className={`w-full text-left rounded-2xl px-4 py-2 ${
                    mine
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  }`}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setReactionTarget(m.id)
                  }}
                  onPointerDown={() => {
                    const id = m.id
                    const t = setTimeout(() => setReactionTarget(id), 450)
                    const clear = () => clearTimeout(t)
                    window.addEventListener('pointerup', clear, { once: true })
                    window.addEventListener('pointercancel', clear, { once: true })
                  }}
                >
                  {m.message_type === 'image' && m.media_url ? (
                    <img src={m.media_url} alt="sent" className="rounded-xl max-h-64 object-cover" />
                  ) : m.message_type === 'audio' && m.media_url ? (
                    <audio controls src={m.media_url} className="w-full" />
                  ) : (
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  )}
                </button>

                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{formatRelativeTime(m.created_at)}</span>
                  {mine && (
                    <span className="ml-3">{m.read_at ? 'Seen' : 'Sent'}</span>
                  )}
                </div>

                {m._reactions?.length ? (
                  <div className="mt-1 flex gap-1">
                    {m._reactions.slice(0, 6).map((e: string, idx: number) => (
                      <span key={idx} className="text-sm">
                        {e}
                      </span>
                    ))}
                  </div>
                ) : null}

                {reactionTarget === m.id && (
                  <div className={`mt-2 flex gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow px-3 py-2 flex gap-2">
                      {QUICK_REACTIONS.map((e) => (
                        <button key={e} className="text-lg" onClick={() => addReaction(m.id, e)}>
                          {e}
                        </button>
                      ))}
                      <button className="text-xs text-slate-500" onClick={() => setReactionTarget(null)}>
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {typingUser && <TypingIndicator />}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-end gap-2">
          <label className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" title="Send image">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onPickImage(f)
                e.currentTarget.value = ''
              }}
            />
            <ImageIcon className="h-5 w-5" />
          </label>

          <button
            className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 ${recording ? 'text-red-500' : ''}`}
            onClick={() => (recording ? stopRecording() : startRecording())}
            title={recording ? 'Stop recording' : 'Voice message'}
          >
            <Mic className="h-5 w-5" />
          </button>

          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message…"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSendText()
              }
            }}
          />

          <button
            onClick={onSendText}
            className="px-4 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {blockConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setBlockConfirm(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="font-bold mb-2">Block this user?</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              They won’t be able to message you or see your content easily.
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800" onClick={() => setBlockConfirm(false)}>
                Cancel
              </button>
              <button className="px-4 py-2 rounded-xl bg-red-600 text-white" onClick={blockUser}>
                Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DMChatRoom
