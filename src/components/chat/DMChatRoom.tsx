import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MoreVertical, Send } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { uploadChatMedia } from '../../lib/storage'
import { formatRelativeTime } from '../../utilis/time'
import TypingDots from './TypingDots'
import AudioBubble from './AudioBubble'

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
  message_type?: 'text' | 'audio'
  media_url?: string | null
  created_at: string
  read_at?: string | null
  reply_to_id?: string | null
}

function roomIdFor(a: string, b: string) {
  return [a, b].sort().join(':')
}

const VerifiedBadge = () => (
  <span
    className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] leading-none"
    aria-label="Verified"
  >
    ✓
  </span>
)

const QUICK_REACTIONS = ['❤️', '😂', '👍', '🔥', '😮']

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

  // otherUserId may be a UUID (profiles.id) OR a username coming from /chat?to=username
  const [resolvedOtherId, setResolvedOtherId] = useState<string | null>(null)

  const [other, setOther] = useState<ProfileLite | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState(initialText)
  const [menuOpen, setMenuOpen] = useState(false)

  const [otherTyping, setOtherTyping] = useState(false)
  const [replyTo, setReplyTo] = useState<Msg | null>(null)
  const [actionsFor, setActionsFor] = useState<Msg | null>(null)

  const listRef = useRef<HTMLDivElement | null>(null)
  const longPressTimer = useRef<number | null>(null)

  const startLongPress = (m: Msg) => {
    // Mobile-friendly: open message actions on long-press
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current)
    longPressTimer.current = window.setTimeout(() => {
      setActionsFor(m)
    }, 450)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current)
    longPressTimer.current = null
  }

  const roomId = useMemo(() => {
    if (!user) return ''
    const b = resolvedOtherId || otherUserId
    return b ? roomIdFor(user.id, b) : ''
  }, [user, otherUserId, resolvedOtherId])

  const name = other?.display_name || other?.username || 'User'
  const username = other?.username ? `@${other.username}` : ''
  const lastSeenLabel = other?.last_seen_at ? `${formatRelativeTime(other.last_seen_at)} ago` : null

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (!listRef.current) return
      listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }

  // Resolve & load other profile. Supports otherUserId as UUID or username.
  useEffect(() => {
    if (!user) return

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(otherUserId)

    const q = supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, verified, last_seen_at')

    ;(isUuid ? q.eq('id', otherUserId) : q.eq('username', otherUserId.replace(/^@/, '').toLowerCase()))
      .maybeSingle()
      .then(({ data }) => {
        const p = (data as any) || null
        setOther(p)
        setResolvedOtherId(p?.id || (isUuid ? otherUserId : null))
      })
  }, [user, otherUserId])

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
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [user, roomId])

  // Mark messages as read when opened
  useEffect(() => {
    if (!user || !roomId) return
    const markRead = async () => {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('receiver_id', user.id)
        .is('read_at', null)
    }
    markRead()
  }, [user, roomId])

  // Presence updates: last seen
  useEffect(() => {
    if (!user) return
    const t = setInterval(() => {
      supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)
    }, 20000)
    return () => clearInterval(t)
  }, [user])

  // Typing broadcast (best-effort)
  useEffect(() => {
    if (!user || !roomId) return
    const channel = supabase.channel('dmtyping:' + roomId)
    channel
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        const p = payload?.payload
        if (!p) return
        if (p.userId === user.id) return
        setOtherTyping(!!p.isTyping)
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, roomId])

  const broadcastTyping = async (isTyping: boolean) => {
    if (!user || !roomId) return
    const channel = supabase.channel('dmtyping:' + roomId)
    // channel may not be subscribed yet; this is best-effort
    try {
      await channel.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id, isTyping } })
    } catch {
      // ignore
    }
  }

  const sendText = async () => {
    if (!user || !roomId) return
    const rid = resolvedOtherId
    if (!rid) {
      alert('Could not send message: user not found.')
      return
    }
    const content = text.trim()
    if (!content) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      sender_id: user.id,
      receiver_id: rid,
      content,
      message_type: 'text',
      reply_to_id: replyTo?.id ?? null,
    })
    setSending(false)
    if (error) {
      alert('Could not send message. Please run SUPABASE_CHAT_FINAL.sql in Supabase SQL Editor.')
      return
    }
    setText('')
    setReplyTo(null)
  }

  const onPickAudio = async (blob: Blob) => {
    if (!user || !roomId) return
    const rid = resolvedOtherId
    if (!rid) {
      alert('Could not send message: user not found.')
      return
    }
    const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || 'audio/webm' })
    setSending(true)
    try {
      const url = await uploadChatMedia(file, roomId)
      const { error } = await supabase.from('messages').insert({
        room_id: roomId,
        sender_id: user.id,
        receiver_id: rid,
        content: '',
        message_type: 'audio',
        media_url: url,
        reply_to_id: replyTo?.id ?? null,
      })
      if (error) alert('Could not send voice note. Please run SUPABASE_CHAT_FINAL.sql.')
      setReplyTo(null)
    } catch {
      alert('Voice upload failed. You can keep voice working by ensuring bucket "chat-media" exists and upload policy is enabled.')
    } finally {
      setSending(false)
    }
  }

  // Voice recording
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
      alert('Microphone permission denied.')
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
    const rid = resolvedOtherId
    if (!rid) return
    await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: rid })
    setMenuOpen(false)
    onBack?.()
  }

  const deleteMessage = async (m: Msg) => {
    if (!user) return
    if (m.sender_id !== user.id) return
    const { error } = await supabase.from('messages').delete().eq('id', m.id)
    if (error) alert('Could not delete message.')
    setActionsFor(null)
  }

  const addReaction = async (m: Msg, emoji: string) => {
    if (!user) return
    await supabase.from('message_reactions').upsert({ message_id: m.id, user_id: user.id, emoji })
    setActionsFor(null)
  }

  const headerClick = () => {
    if (other?.username) navigate(`/${other.username}`)
    else navigate(`/profile/${otherUserId}`)
  }

  return (
    <div className="flex flex-col bg-white dark:bg-slate-950 h-[100dvh] md:h-[calc(100vh-56px-64px)]">
      {/* Header */}
      <div className="shrink-0 sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between gap-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur">
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

          <button onClick={headerClick} className="flex items-center gap-2 min-w-0">
            <img
              src={other?.avatar_url || '/default-avatar.svg'}
              className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-800"
              alt=""
            />
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1 font-extrabold leading-tight truncate">
                <span className="truncate">{name}</span>
                {other?.verified ? <VerifiedBadge /> : null}
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
        {loading ? <div className="text-sm text-slate-500">Loading…</div> : null}

        {messages.map((m) => {
          const mine = user?.id === m.sender_id
          const replied = m.reply_to_id ? messages.find((x) => x.id === m.reply_to_id) : null
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[86%]">
                <div
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setActionsFor(m)
                  }}
                  onPointerDown={(e) => {
                    // Long-press on touch screens
                    if (e.pointerType === 'touch') startLongPress(m)
                  }}
                  onPointerUp={cancelLongPress}
                  onPointerCancel={cancelLongPress}
                  onPointerLeave={cancelLongPress}
                  onClick={() => setActionsFor(null)}
                  className={`rounded-2xl px-3 py-2 text-sm border ${
                    mine
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {replied ? (
                    <div className={`mb-2 rounded-xl px-2 py-1 text-[11px] ${mine ? 'bg-white/15' : 'bg-black/5 dark:bg-white/10'}`}>
                      <div className="opacity-80">Replying to:</div>
                      <div className="truncate">{replied.message_type === 'text' ? replied.content : 'Voice note'}</div>
                    </div>
                  ) : null}

                  {m.message_type === 'audio' && m.media_url ? (
                    <AudioBubble src={m.media_url} className={mine ? 'text-white' : ''} />
                  ) : null}
                  {m.message_type === 'text' ? <div className="whitespace-pre-wrap">{m.content}</div> : null}

                  <div className={`mt-1 text-[10px] ${mine ? 'text-white/80' : 'text-slate-500'}`}>
                    {formatRelativeTime(m.created_at)} ago
                    {mine ? <span className="ml-2">{m.read_at ? 'Seen' : 'Sent'}</span> : null}
                  </div>
                </div>

                {actionsFor?.id === m.id ? (
                  <div className={`mt-1 flex items-center gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                    <button
                      className="text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                      onClick={() => {
                        setReplyTo(m)
                        setActionsFor(null)
                      }}
                    >
                      Reply
                    </button>
                    {QUICK_REACTIONS.map((emo) => (
                      <button
                        key={emo}
                        className="text-sm px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                        onClick={() => addReaction(m, emo)}
                      >
                        {emo}
                      </button>
                    ))}
                    {mine ? (
                      <button
                        className="text-xs px-2 py-1 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => deleteMessage(m)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}

        {otherTyping ? <TypingDots /> : null}
      </div>

      {/* Reply bar */}
      {replyTo ? (
        <div className="shrink-0 px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 text-xs text-slate-700 dark:text-slate-200">
              Replying to: <span className="font-semibold">{replyTo.message_type === 'text' ? replyTo.content : 'Voice note'}</span>
            </div>
            <button className="text-xs text-slate-500 hover:underline" onClick={() => setReplyTo(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {/* Composer */}
      <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 px-3 py-2 bg-white dark:bg-slate-950">
        <div className="flex items-end gap-2">
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
                broadcastTyping(e.target.value.trim().length > 0)
              }}
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
