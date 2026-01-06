import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image as ImageIcon, Mic, MoreVertical, Send } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { uploadChatMedia } from '../../lib/storage'
import { formatRelativeTime } from '../../utilis/time'
import TypingIndicator from './TypingIndicator'

type ProfileLite = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  verified: boolean | null
  last_seen_at?: string | null
}

type Msg = {
  id: string
  room_id: string
  sender_id: string
  receiver_id: string
  content: string
  message_type?: 'text' | 'image' | 'audio'
  media_url?: string | null
  created_at: string
  read_at?: string | null
}

function roomIdFor(a: string, b: string) {
  return [a, b].sort().join(':')
}

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp)$/i.test(url) || url.includes('image')
}

export default function DMChatRoom({
  otherUserId,
  initialText = '',
  onBack,
}: {
  otherUserId: string
  initialText?: string
  onBack?: () => void
}) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [other, setOther] = useState<ProfileLite | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState(initialText)
  const [menuOpen, setMenuOpen] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)

  const listRef = useRef<HTMLDivElement | null>(null)
  const channelRef = useRef<any>(null)

  const roomId = useMemo(() => (user ? roomIdFor(user.id, otherUserId) : ''), [user, otherUserId])

  const name = other?.display_name || other?.username || 'User'
  const username = other?.username ? `@${other.username}` : ''

  // Load other profile
  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, verified, last_seen_at')
      .eq('id', otherUserId)
      .maybeSingle()
      .then(({ data }) => setOther((data as any) || null))
  }, [user, otherUserId])

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (!listRef.current) return
      listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }

  // Load messages + realtime
  useEffect(() => {
    if (!user || !roomId) return
    let isMounted = true

    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (!isMounted) return
      if (!error) setMessages((data as any) || [])
      setLoading(false)
      scrollToBottom()
    }

    load()

    const channel = supabase
      .channel(`dm:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const row = payload.new as any
          if (!row?.id) return
          setMessages((prev) => {
            // upsert into list
            const idx = prev.findIndex((m) => m.id === row.id)
            if (idx >= 0) {
              const copy = [...prev]
              copy[idx] = { ...(copy[idx] as any), ...(row as any) }
              return copy
            }
            return [...prev, row]
          })
          scrollToBottom()
        },
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.userId && payload.payload.userId !== user.id) {
          setOtherTyping(true)
          window.clearTimeout((window as any).__frenvioTypingTimer)
          ;(window as any).__frenvioTypingTimer = window.setTimeout(() => setOtherTyping(false), 1200)
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      isMounted = false
      channelRef.current = null
      supabase.removeChannel(channel)
    }
  }, [user, roomId])

  const typingSendRef = useRef<number | null>(null)
  const sendTyping = () => {
    if (!user) return
    // throttle: max 1 event per 700ms
    if (typingSendRef.current) return
    typingSendRef.current = window.setTimeout(() => {
      typingSendRef.current = null
    }, 700) as any
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id } })
  }

  // Mark messages as read when opened
  useEffect(() => {
    if (!user || !roomId) return
    const markRead = async () => {
      // set read_at for messages from other to me
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('receiver_id', user.id)
        .is('read_at', null)
    }
    markRead()
  }, [user, roomId])

  const insertMessage = async (payload: any) => {
    // Some users' DB may not have the new columns yet. Try rich payload, then fallback.
    const { error } = await supabase.from('messages').insert(payload)
    if (!error) return { error: null as any }
    const msg = String((error as any).message || '')
    if (msg.includes('message_type') || msg.includes('media_url') || msg.includes('read_at')) {
      const fallback = {
        room_id: payload.room_id,
        sender_id: payload.sender_id,
        receiver_id: payload.receiver_id,
        content: payload.content ?? '',
      }
      return await supabase.from('messages').insert(fallback)
    }
    return { error }
  }

  const sendText = async () => {
    if (!user || !roomId) return
    const content = text.trim()
    if (!content) return
    setSending(true)
    const { error } = await insertMessage({
      room_id: roomId,
      sender_id: user.id,
      receiver_id: otherUserId,
      content,
      message_type: 'text',
    })
    setSending(false)
    if (!error) setText('')
    else alert('Could not send message. Please run the Supabase SQL file included in the project to add chat columns/policies.')
  }

  const sendMedia = async (file: File, type: 'image' | 'audio') => {
    if (!user || !roomId) return
    setSending(true)
    try {
      const url = await uploadChatMedia(file, roomId)
      const { error } = await insertMessage({
        room_id: roomId,
        sender_id: user.id,
        receiver_id: otherUserId,
        content: '',
        message_type: type,
        media_url: url,
      })
      if (error) alert('Could not send media message. Please run the Supabase SQL file included in the project.')
    } finally {
      setSending(false)
    }
  }

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    await sendMedia(f, 'image')
  }

  const onPickAudio = async (blob: Blob) => {
    const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || 'audio/webm' })
    await sendMedia(file, 'audio')
  }

  const recordRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const [recording, setRecording] = useState(false)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = (ev) => chunksRef.current.push(ev.data)
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        if (blob.size > 0) await onPickAudio(blob)
      }
      recordRef.current = rec
      setRecording(true)
      rec.start()
    } catch {
      // ignore
    }
  }

  const stopRecording = () => {
    try {
      recordRef.current?.stop()
    } catch {
      // ignore
    } finally {
      recordRef.current = null
      setRecording(false)
    }
  }

  const blockUser = async () => {
    if (!user) return
    await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: otherUserId })
    setMenuOpen(false)
    onBack?.()
  }

  const lastSeenLabel = other?.last_seen_at ? formatRelativeTime(other.last_seen_at) : null

  return (
    <div className="flex h-[calc(100dvh-56px-64px)] flex-col bg-white dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 sticky top-0 z-10 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {onBack ? (
            <button
              onClick={onBack}
              className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900"
              aria-label="Back"
            >
              ←
            </button>
          ) : null}

          <button
            onClick={() => {
              if (other?.username) navigate(`/${other.username}`)
              else navigate(`/profile/${otherUserId}`)
            }}
            className="flex items-center gap-2 min-w-0"
          >
            <img
              src={other?.avatar_url || '/default-avatar.svg'}
              className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-800"
              alt=""
            />
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1 font-extrabold leading-tight truncate">
                <span className="truncate">{name}</span>
                {other?.verified ? (
                  <span
                    className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] leading-none"
                    aria-label="Verified"
                  >
                    ✓
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {username}
                {lastSeenLabel ? ` • Last seen ${lastSeenLabel}` : ''}
              </div>
            </div>
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900"
            aria-label="Menu"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg overflow-hidden z-50">
              <button
                onClick={blockUser}
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Block user
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2">
        {loading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : null}

        {/* Keep empty if no messages */}

        {messages.map((m) => {
          const mine = user?.id === m.sender_id
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm border ${
                  mine
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800'
                }`}
              >
                {m.message_type === 'image' && m.media_url ? (
                  <img src={m.media_url} className="rounded-xl max-h-72 object-cover" alt="" />
                ) : null}
                {m.message_type === 'audio' && m.media_url ? (
                  <audio controls src={m.media_url} className="w-64 max-w-full" />
                ) : null}
                {m.message_type === 'text' ? <div className="whitespace-pre-wrap">{m.content}</div> : null}
                <div className={`mt-1 text-[10px] ${mine ? 'text-white/80' : 'text-slate-500'}`}>
                  {formatRelativeTime(m.created_at)}
                  {mine ? (
                    <span className="ml-2">{m.read_at ? 'Seen' : 'Sent'}</span>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
        <TypingIndicator show={otherTyping} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 px-3 py-2">
        <div className="flex items-end gap-2">
          <label className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer">
            <ImageIcon className="h-5 w-5" />
            <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
          </label>

          <button
            onClick={recording ? stopRecording : startRecording}
            className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 ${recording ? 'text-red-500' : ''}`}
            aria-label="Voice"
          >
            <Mic className="h-5 w-5" />
          </button>

          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                sendTyping()
              }}
              onInput={() => sendTyping(`dm:${roomId}`)}
              placeholder="Message…"
              rows={1}
              className="w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendText()
                }
              }}
            />
          </div>

          <button
            onClick={sendText}
            disabled={sending}
            className="p-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            aria-label="Send"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
