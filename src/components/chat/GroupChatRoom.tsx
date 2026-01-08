import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MoreVertical, Send, UserPlus, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { uploadChatMedia } from '../../lib/storage'
import { formatRelativeTime } from '../../utilis/time'
import AudioBubble from './AudioBubble'
import TypingDots from './TypingDots'

type ProfileLite = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  verified: boolean | null
}

type GMsg = {
  id: string
  group_id: string
  sender_id: string
  content: string
  message_type?: 'text' | 'audio'
  media_url?: string | null
  created_at: string
  reply_to_id?: string | null
}

const VerifiedBadge = () => (
  <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] leading-none">✓</span>
)

export default function GroupChatRoom({
  groupId,
  role = 'member',
  onBack,
}: {
  groupId: string
  role?: 'admin' | 'member'
  onBack?: () => void
}) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [group, setGroup] = useState<any>(null)
  const [messages, setMessages] = useState<GMsg[]>([])
  const [reactionsByMessage, setReactionsByMessage] = useState<Record<string, string[]>>({})
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({})
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [typingOther, setTypingOther] = useState(false)
  const [replyTo, setReplyTo] = useState<GMsg | null>(null)
  const [actionsFor, setActionsFor] = useState<GMsg | null>(null)
  const [myReactions, setMyReactions] = useState<Record<string, string>>({})

  const QUICK_REACTIONS = ['❤️', '😂', '👍', '🔥', '😮']

  const listRef = useRef<HTMLDivElement | null>(null)
  const longPressTimer = useRef<number | null>(null)

  const startLongPress = (m: GMsg) => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current)
    longPressTimer.current = window.setTimeout(() => setActionsFor(m), 450)
  }
  const cancelLongPress = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current)
    longPressTimer.current = null
  }
  const roomKey = useMemo(() => `group:${groupId}`, [groupId])

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (!listRef.current) return
      listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }

  // Load group + messages
  useEffect(() => {
    if (!user) return
    let mounted = true

    const load = async () => {
      setLoading(true)
      const { data: g } = await supabase.from('groups').select('*').eq('id', groupId).maybeSingle()
      if (!mounted) return
      setGroup(g || null)

      const { data: msgs, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })

      if (!mounted) return
      const rows = (msgs as any) || []
      if (!error) setMessages(rows)

      // Load reactions for visible messages (best-effort)
      const ids = rows.map((m: any) => m.id).filter(Boolean)
      if (ids.length) {
        const { data: rdata } = await supabase
          .from('group_message_reactions')
          .select('group_message_id, emoji')
          .in('group_message_id', ids)
        const map: Record<string, string[]> = {}
        ;(rdata || []).forEach((r: any) => {
          const key = r.group_message_id
          if (!map[key]) map[key] = []
          map[key].push(r.emoji)
        })
        if (mounted) setReactionsByMessage(map)
      }

      // load profiles for senders
      const senderIds = Array.from(new Set(rows.map((m: any) => m.sender_id).filter(Boolean)))
      if (senderIds.length) {
        const { data: ps } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, verified')
          .in('id', senderIds)
        const map: Record<string, any> = {}
        ;(ps || []).forEach((p: any) => (map[p.id] = p))
        if (mounted) setProfiles(map)
      }

      setLoading(false)
      scrollToBottom()
    }

    load()

    const channel = supabase
      .channel(`group:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
        async (payload) => {
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

          // ensure profile exists
          if (row.sender_id && !profiles[row.sender_id]) {
            const { data: p } = await supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url, verified')
              .eq('id', row.sender_id)
              .maybeSingle()
            if (p) setProfiles((prev) => ({ ...prev, [p.id]: p as any }))
          }

          scrollToBottom()
        },
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [groupId, user?.id])

  // typing broadcast
  useEffect(() => {
    if (!user) return
    const channel = supabase.channel('gtyping:' + groupId)
    channel
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        const p = payload?.payload
        if (!p) return
        if (p.userId === user.id) return
        setTypingOther(!!p.isTyping)
      })
      .subscribe()

    let t: any
    if (newMessage.trim()) {
      channel.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id, isTyping: true } })
      t = setTimeout(() => channel.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id, isTyping: false } }), 1200)
    } else {
      channel.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id, isTyping: false } })
    }

    return () => {
      if (t) clearTimeout(t)
      supabase.removeChannel(channel)
    }
  }, [newMessage, user?.id, groupId])

  
  const send = async (payload: Partial<GMsg>) => {
    if (!user) return

    const baseInsert: any = {
      group_id: groupId,
      sender_id: user.id,
      content: payload.content || '',
      message_type: payload.message_type || 'text',
      media_url: payload.media_url || null,
    }

    // We support reply, but some DBs may not have reply_to_id yet.
    const withReply: any = { ...baseInsert, reply_to_id: (payload as any).reply_to_id || null }

    let inserted: any = null
    let error: any = null

    ;({ data: inserted, error } = await supabase.from('group_messages').insert(withReply).select('*').maybeSingle())

    if (error && String(error.message || '').includes("reply_to_id")) {
      // Retry without reply_to_id if column is missing
      ;({ data: inserted, error } = await supabase.from('group_messages').insert(baseInsert).select('*').maybeSingle())
      if (error) {
        alert(`Could not send message: ${error.message}`)
        return
      } else {
        alert('Reply is not enabled yet for groups. Run the Supabase SQL patch to add reply_to_id.')
      }
    } else if (error) {
      alert(`Could not send message: ${error.message}`)
      return
    }

    if (inserted) {
      setMessages((prev) => [...prev, inserted as any])
      scrollToBottom()
    }
    setNewMessage('')
  }

  const onSendText = async () => {
    const content = newMessage.trim()
    if (!content) return
    await send({ content, message_type: 'text', reply_to_id: replyTo?.id ?? null } as any)
    setReplyTo(null)
  }

  const recorderRef = useRef<MediaRecorder | null>(null)
  const recordChunksRef = useRef<BlobPart[]>([])
  const [recording, setRecording] = useState(false)

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
          const url = await uploadChatMedia(file, roomKey)
          await send({ message_type: 'audio', media_url: url, content: '' })
        } catch {
          alert('Voice upload failed. Make sure Storage bucket "chat-media" allows uploads.')
        }
      }
      setRecording(true)
      recorder.start()
    } catch {
      alert('Microphone permission denied.')
    }
  }

  const stopRecording = () => {
    try {
      recorderRef.current?.stop()
    } catch {
      // ignore
    } finally {
      recorderRef.current = null
      setRecording(false)
    }
  }

  const deleteMessage = async (m: GMsg) => {
    if (!user) return
    if (m.sender_id !== user.id) return
    const { error } = await supabase.from('group_messages').delete().eq('id', m.id)
    if (error) alert('Could not delete message.')
  }

  const leaveGroup = async () => {
    if (!user) return
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id)
    onBack?.()
  }

  const addMemberByUsername = async () => {
    if (!user) return
    const uname = memberSearch.trim().replace(/^@+/, '').toLowerCase()
    if (!uname) return
    const { data: p } = await supabase.from('profiles').select('id').eq('username', uname).maybeSingle()
    if (!p?.id) return alert('User not found.')
    const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: p.id, role: 'member' })
    if (error) return alert('Could not add member (maybe already in group).')
    setMemberSearch('')
    alert('Member added.')
  }

  const promoteAdmin = async (uid: string) => {
    if (role !== 'admin') return
    const { error } = await supabase.from('group_members').update({ role: 'admin' }).eq('group_id', groupId).eq('user_id', uid)
    if (error) alert('Could not promote.')
  }

  const [members, setMembers] = useState<Array<{ user_id: string; role: string; p: ProfileLite | null }>>([])

  const loadMembers = async () => {
    const { data: ms } = await supabase.from('group_members').select('user_id, role').eq('group_id', groupId).limit(200)
    const ids = (ms || []).map((m: any) => m.user_id)
    let pmap: Record<string, any> = {}
    if (ids.length) {
      const { data: ps } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, verified')
        .in('id', ids)
      ;(ps || []).forEach((p: any) => (pmap[p.id] = p))
    }
    setMembers((ms || []).map((m: any) => ({ user_id: m.user_id, role: m.role || 'member', p: pmap[m.user_id] || null })))
  }

  useEffect(() => {
    if (!membersOpen) return
    loadMembers()
  }, [membersOpen])

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

          <button
            onClick={() => setMembersOpen(true)}
            className="flex items-center gap-2 min-w-0"
            title="View members"
          >
            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-left">
              <div className="font-extrabold leading-tight truncate">{group?.name || 'Group'}</div>
              <div className="text-xs text-slate-500 truncate">Tap to view members</div>
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
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg overflow-hidden z-50">
              <button
                onClick={() => {
                  setMembersOpen(true)
                  setMenuOpen(false)
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                View members
              </button>
              <button
                onClick={leaveGroup}
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Leave group
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Members modal */}
      {membersOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setMembersOpen(false)}>
          <div
            className="w-full md:max-w-lg bg-white dark:bg-slate-950 rounded-t-2xl md:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="font-extrabold">Members</div>
              <button className="text-sm text-slate-500 hover:underline" onClick={() => setMembersOpen(false)}>
                Close
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex gap-2">
                <input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Add member by username…"
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm"
                />
                <button onClick={addMemberByUsername} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Add
                </button>
              </div>
              <div className="text-xs text-slate-500 mt-2">Any member can add others.</div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {members.map((m) => {
                const p = m.p
                const title = p?.display_name || p?.username || 'User'
                const uname = p?.username ? `@${p.username}` : ''
                return (
                  <div key={m.user_id} className="flex items-center justify-between gap-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900">
                    <button
                      className="flex items-center gap-3 min-w-0 text-left"
                      onClick={() => {
                        if (p?.username) navigate(`/${p.username}`)
                        else navigate(`/profile/${m.user_id}`)
                      }}
                    >
                      <img src={p?.avatar_url || '/default-avatar.svg'} className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 object-cover" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 font-semibold truncate">
                          <span className="truncate">{title}</span>
                          {p?.verified ? <VerifiedBadge /> : null}
                          <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                            {m.role}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 truncate">{uname}</div>
                      </div>
                    </button>

                    {role === 'admin' && m.role !== 'admin' ? (
                      <button className="text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900" onClick={() => promoteAdmin(m.user_id)}>
                        Promote
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Messages */}
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2">
        {loading ? <div className="text-sm text-slate-500">Loading…</div> : null}

        {messages.map((m) => {
          const mine = user?.id === m.sender_id
          const p = profiles[m.sender_id]
          const title = p?.display_name || p?.username || 'User'
          const uname = p?.username ? `@${p.username}` : ''
          const replied = m.reply_to_id ? messages.find((x) => x.id === m.reply_to_id) : null
          const reacts = reactionsByMessage[m.id] || []
          const reactCounts = reacts.reduce((acc: Record<string, number>, e: string) => {
            acc[e] = (acc[e] || 0) + 1
            return acc
          }, {})

          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              {!mine ? (
                <button
                  className="mr-2 self-end"
                  onClick={() => {
                    if (p?.username) navigate(`/${p.username}`)
                    else navigate(`/profile/${m.sender_id}`)
                  }}
                  aria-label="Open profile"
                >
                  <img
                    src={p?.avatar_url || '/default-avatar.svg'}
                    className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
                  />
                </button>
              ) : null}

              <div className="max-w-[86%]">
                {!mine ? (
                  <button
                    className="text-xs text-slate-500 mb-1 inline-flex items-center gap-1 hover:underline"
                    onClick={() => {
                      if (p?.username) navigate(`/${p.username}`)
                      else navigate(`/profile/${m.sender_id}`)
                    }}
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{title}</span>
                    {p?.verified ? <VerifiedBadge /> : null}
                    <span>{uname}</span>
                  </button>
                ) : null}

                <div
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setActionsFor(m)
                  }}
                  onPointerDown={(e) => {
                    if (e.pointerType === 'touch') startLongPress(m)
                  }}
                  onPointerUp={cancelLongPress}
                  onPointerCancel={cancelLongPress}
                  onPointerLeave={cancelLongPress}
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

                  {m.message_type === 'audio' && m.media_url ? <AudioBubble src={m.media_url} className={mine ? 'text-white' : ''} /> : null}
                  {m.message_type === 'text' ? <div className="whitespace-pre-wrap">{m.content}</div> : null}

                  <div className={`mt-1 text-[10px] ${mine ? 'text-white/80' : 'text-slate-500'}`}>{formatRelativeTime(m.created_at)} ago</div>
                </div>

                {reacts.length ? (
                  <div className={`mt-1 flex flex-wrap gap-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                    {Object.entries(reactCounts).map(([emo, n]) => (
                      <span
                        key={emo}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <span>{emo}</span>
                        {n > 1 ? <span className="text-[11px] text-slate-600 dark:text-slate-300">{n}</span> : null}
                      </span>
                    ))}
                  </div>
                ) : null}

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
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('group_message_reactions')
                              .upsert({ group_message_id: m.id, user_id: user?.id, emoji: emo })
                            if (!error) {
                              setReactionsByMessage((prev) => {
                                const next = { ...prev }
                                const arr = (next[m.id] ? [...next[m.id]] : []).filter(Boolean)
                                arr.push(emo)
                                next[m.id] = arr
                                return next
                              })
                              setMyReactions((prev) => ({ ...prev, [m.id]: emo }))
                            }
                          } catch {}
                          setActionsFor(null)
                        }}
                      >
                        {emo}
                      </button>
                    ))}
                    {mine ? (
                      <button
                        className="text-xs px-2 py-1 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => {
                          deleteMessage(m)
                          setActionsFor(null)
                        }}
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

        {typingOther ? <TypingDots /> : null}
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
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message…"
              rows={1}
              className="w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSendText()
                }
              }}
            />
          </div>

          <button
            onClick={onSendText}
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
