import React, { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { uploadChatMedia } from '../../lib/storage'
import { formatRelativeTime } from '../../utilis/time'
import { Image as ImageIcon, Mic, MoreVertical, Send, Users } from 'lucide-react'
import TypingIndicator from './TypingIndicator'

type GMsg = {
  id: string
  group_id: string
  sender_id: string
  content: string
  message_type?: 'text' | 'image' | 'audio'
  media_url?: string | null
  created_at: string
  _sender?: any
  _reactions?: string[]
}

const QUICK_REACTIONS = ['❤️', '😂', '👍', '🔥', '😮', '😢']

interface GroupChatRoomProps {
  groupId: string
  onBack?: () => void
}

const GroupChatRoom: React.FC<GroupChatRoomProps> = ({ groupId, onBack }) => {
  const { user } = useAuth()
  const [group, setGroup] = useState<any>(null)
  const [membersCount, setMembersCount] = useState<number>(0)
  const [messages, setMessages] = useState<GMsg[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recordChunksRef = useRef<BlobPart[]>([])
  const listRef = useRef<HTMLDivElement | null>(null)
  const [reactionTarget, setReactionTarget] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [promoteOpen, setPromoteOpen] = useState(false)
  const [memberQuery, setMemberQuery] = useState('')
  const [memberResults, setMemberResults] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  const leaveGroup = async () => {
    if (!user) return
    const ok = confirm('Leave this group?')
    if (!ok) return
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id)
    onBack?.()
  }

  const searchMembers = async (q: string) => {
    if (!q.trim()) {
      setMemberResults([])
      return
    }
    setLoadingMembers(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, verified')
      .ilike('username', `%${q}%`)
      .limit(10)
    setMemberResults(data || [])
    setLoadingMembers(false)
  }

  const addMember = async (profileId: string) => {
    if (!user) return
    const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: profileId, role: 'member' })
    if (error) alert('Could not add member.')
    else {
      alert('Member added.')
      setAddOpen(false)
      setMemberQuery('')
      setMemberResults([])
    }
  }

  const promoteMember = async (profileId: string) => {
    if (!user) return
    const { error } = await supabase.from('group_members').update({ role: 'admin' }).eq('group_id', groupId).eq('user_id', profileId)
    if (error) alert('Could not promote member.')
    else {
      alert('Promoted to admin.')
      setPromoteOpen(false)
      setMemberQuery('')
      setMemberResults([])
    }
  }


  const roomKey = useMemo(() => `group:${groupId}`, [groupId])

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data: g } = await supabase.from('groups').select('id, name, owner_id').eq('id', groupId).maybeSingle()
      setGroup(g || null)
      const { count } = await supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', groupId)
      setMembersCount(count || 0)
    })()
  }, [user, groupId])

  useEffect(() => {
    let ignore = false
    async function load() {
      if (!user) return
      const { data } = await supabase
        .from('group_messages')
        .select('id, group_id, sender_id, content, message_type, media_url, created_at')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
      if (!ignore) {
        const rows = (data as any[]) || []
        setMessages(rows)
        scrollToBottom()
      }

      // update last_read_at for me
      await supabase.from('group_members').update({ last_read_at: new Date().toISOString() }).eq('group_id', groupId).eq('user_id', user.id)
    }
    load()

    const channel = supabase
      .channel('group:' + groupId, { config: { presence: { key: user?.id || 'anon' } } })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
        (payload) => {
          const row: any = payload.new
          setMessages((prev) => [...prev, row])
          scrollToBottom()
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, isTyping } = payload.payload as any
        if (userId && user && userId !== user.id) setTypingUser(isTyping ? userId : null)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() })
        }
      })

    return () => {
      ignore = true
      supabase.removeChannel(channel)
    }
  }, [user, groupId])

  useEffect(() => {
    if (!user) return
    const tick = async () => {
      await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)
    }
    tick()
    const t = setInterval(tick, 30_000)
    return () => clearInterval(t)
  }, [user])

  // typing broadcast
  useEffect(() => {
    if (!user) return
    const channel = supabase.channel('gtyping:' + groupId)
    channel.subscribe()
    let t: any
    if (newMessage.trim()) {
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
  }, [newMessage, user, groupId])

  const send = async (payload: Partial<GMsg>) => {
    if (!user) return
    const { error } = await supabase.from('group_messages').insert({
      group_id: groupId,
      sender_id: user.id,
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
    await send({ content, message_type: 'text' })
  }

  const onPickImage = async (file: File) => {
    try {
      const url = await uploadChatMedia(file, roomKey)
      await send({ message_type: 'image', media_url: url, content: '' })
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
          const url = await uploadChatMedia(file, roomKey)
          await send({ message_type: 'audio', media_url: url, content: '' })
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

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return
    await supabase.from('group_message_reactions').upsert({ message_id: messageId, user_id: user.id, emoji })
    setReactionTarget(null)
  }

  useEffect(() => {
    if (!groupId) return
    const fetchReactions = async () => {
      const ids = messages.map((m) => m.id).slice(-50)
      if (!ids.length) return
      const { data } = await supabase.from('group_message_reactions').select('message_id, emoji').in('message_id', ids)
      const map: Record<string, string[]> = {}
      ;(data || []).forEach((r: any) => {
        map[r.message_id] = map[r.message_id] || []
        map[r.message_id].push(r.emoji)
      })
      setMessages((prev) => prev.map((m) => ({ ...(m as any), _reactions: map[m.id] || (m as any)._reactions || [] })))
    }
    fetchReactions()
  }, [messages.length, groupId])

  const title = group?.name || 'Group'
  const isAdmin = group?.owner_id === user?.id

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col h-[70vh] md:h-[78vh]">
      <div className="shrink-0 px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="md:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Back">←</button>
          )}
          <div className="font-extrabold">{title}</div>
          {isAdmin && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">Admin</span>}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Users className="h-4 w-4" /> {membersCount}
          </span>
          <div className="relative">
            <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMenuOpen((s) => !s)}>
              <MoreVertical className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg overflow-hidden z-10">
                <button
                  className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
                  onClick={() => {
                    setMenuOpen(false)
                    leaveGroup()
                  }}
                >
                  Leave group
                </button>
                {isAdmin && (
                  <>
                    <button
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
                      onClick={() => {
                        setMenuOpen(false)
                        setAddOpen(true)
                      }}
                    >
                      Add member
                    </button>
                    <button
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
                      onClick={() => {
                        setMenuOpen(false)
                        setPromoteOpen(true)
                      }}
                    >
                      Promote admin
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div ref={listRef} className="flex-1 min-h-0 p-4 space-y-3 overflow-y-auto">
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

      <div className="shrink-0 p-3 border-t border-slate-200 dark:border-slate-800">
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

      {addOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setAddOpen(false)}>
          <div className="w-full md:max-w-lg bg-white dark:bg-slate-950 rounded-t-2xl md:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold">Add member</div>
            <div className="p-4 space-y-3">
              <input
                value={memberQuery}
                onChange={(e) => {
                  setMemberQuery(e.target.value)
                  searchMembers(e.target.value)
                }}
                placeholder="Search username..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              />
              {loadingMembers && <div className="text-sm text-slate-500">Searching…</div>}
              <div className="space-y-2">
                {memberResults.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.avatar_url || '/default-avatar.svg'} className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-800" alt="" />
                      <div className="min-w-0">
                        <div className="font-bold truncate">{p.display_name || p.username} {p.verified ? <span className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-600 text-white text-[10px]">✓</span> : null}</div>
                        <div className="text-xs text-slate-500 truncate">@{p.username}</div>
                      </div>
                    </div>
                    <button className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold" onClick={() => addMember(p.id)}>
                      Add
                    </button>
                  </div>
                ))}
                {!loadingMembers && memberQuery.trim().length > 0 && memberResults.length === 0 && (
                  <div className="text-sm text-slate-500">No users found.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {promoteOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setPromoteOpen(false)}>
          <div className="w-full md:max-w-lg bg-white dark:bg-slate-950 rounded-t-2xl md:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold">Promote admin</div>
            <div className="p-4 space-y-3">
              <input
                value={memberQuery}
                onChange={(e) => {
                  setMemberQuery(e.target.value)
                  searchMembers(e.target.value)
                }}
                placeholder="Search username..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              />
              {loadingMembers && <div className="text-sm text-slate-500">Searching…</div>}
              <div className="space-y-2">
                {memberResults.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.avatar_url || '/default-avatar.svg'} className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-800" alt="" />
                      <div className="min-w-0">
                        <div className="font-bold truncate">{p.display_name || p.username}</div>
                        <div className="text-xs text-slate-500 truncate">@{p.username}</div>
                      </div>
                    </div>
                    <button className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold" onClick={() => promoteMember(p.id)}>
                      Promote
                    </button>
                  </div>
                ))}
                {!loadingMembers && memberQuery.trim().length > 0 && memberResults.length === 0 && (
                  <div className="text-sm text-slate-500">No users found.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default GroupChatRoom
