import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import DMChatRoom from '../components/chat/DMChatRoom'
import GroupChatRoom from '../components/chat/GroupChatRoom'
import AIChatRoom from '../components/chat/AIChatRoom'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { formatRelativeTime } from '../utilis/time'

type Tab = 'inbox' | 'groups' | 'ai'

type Selected =
  | { kind: 'dm'; otherUserId: string }
  | { kind: 'group'; groupId: string }
  | { kind: 'ai' }

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

const Chat: React.FC = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('inbox')
  const [selected, setSelected] = useState<Selected | null>(null)
  const [searchParams] = useSearchParams()
  const toParam = searchParams.get('to')
  const shareParam = searchParams.get('share')

  // Groups UI
  const [createOpen, setCreateOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupSearch, setGroupSearch] = useState('')

  useEffect(() => {
    if (toParam) {
      setTab('inbox')
      setSelected({ kind: 'dm', otherUserId: toParam })
    }
  }, [toParam])

  // ------------------------------
  // Inbox conversations
  // ------------------------------
  const { data: inboxItems = [], refetch: refetchInbox } = useQuery({
    queryKey: ['inbox', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return []
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, room_id, sender_id, receiver_id, content, message_type, media_url, read_at, created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(300)

      const byRoom: Record<string, any> = {}
      ;(msgs || []).forEach((m: any) => {
        if (!byRoom[m.room_id]) byRoom[m.room_id] = m
      })
      const rooms = Object.values(byRoom) as any[]
      const otherIds = rooms
        .map((m) => (m.sender_id === user.id ? m.receiver_id : m.sender_id))
        .filter(Boolean)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, verified, last_seen_at')
        .in('id', otherIds)

      const profileMap: Record<string, any> = {}
      ;(profiles || []).forEach((p: any) => (profileMap[p.id] = p))

      // unread counts (best-effort)
      const results = await Promise.all(
        rooms.map(async (m) => {
          const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', m.room_id)
            .eq('receiver_id', user.id)
            .is('read_at', null)
          return {
            room_id: m.room_id,
            last: m,
            other: profileMap[otherId] || { id: otherId },
            unread: count || 0,
          }
        })
      )

      // Sort by latest
      results.sort((a, b) => new Date(b.last.created_at).getTime() - new Date(a.last.created_at).getTime())
      return results
    },
  })

  // Live refresh inbox when new messages arrive
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('inbox:' + user.id)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        () => refetchInbox()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` },
        () => refetchInbox()
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  // ------------------------------
  // Groups: my groups list
  // ------------------------------
  const { data: myGroups = [], refetch: refetchGroups } = useQuery({
    queryKey: ['my-groups', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return []
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id, role, last_read_at')
        .eq('user_id', user.id)

      const groupIds = (memberships || []).map((m: any) => m.group_id)
      if (!groupIds.length) return []

      const { data: groups } = await supabase.from('groups').select('id, name, owner_id, created_at').in('id', groupIds)
      const gmap: Record<string, any> = {}
      ;(groups || []).forEach((g: any) => (gmap[g.id] = g))

      // Get latest message per group (best effort)
      const results = await Promise.all(
        groupIds.map(async (gid: string) => {
          const { data: latest } = await supabase
            .from('group_messages')
            .select('id, content, message_type, created_at')
            .eq('group_id', gid)
            .order('created_at', { ascending: false })
            .limit(1)

          const member = (memberships || []).find((m: any) => m.group_id === gid)
          const lastRead = member?.last_read_at ? new Date(member.last_read_at).getTime() : 0
          const latestAt = latest?.[0]?.created_at ? new Date(latest[0].created_at).getTime() : 0
          const unread = latestAt > lastRead ? 1 : 0

          return { group: gmap[gid] || { id: gid }, unread, role: member?.role || 'member', latest: latest?.[0] || null }
        })
      )
      results.sort((a, b) => {
        const atA = a.latest?.created_at ? new Date(a.latest.created_at).getTime() : 0
        const atB = b.latest?.created_at ? new Date(b.latest.created_at).getTime() : 0
        return atB - atA
      })
      return results
    },
  })

  // Group search to join
  const { data: groupSearchResults = [] } = useQuery({
    queryKey: ['group-search', groupSearch],
    enabled: tab === 'groups' && groupSearch.trim().length > 0,
    queryFn: async () => {
      const q = groupSearch.trim()
      const { data } = await supabase.from('groups').select('id, name, owner_id, created_at').ilike('name', `%${q}%`).limit(20)
      return data || []
    },
  })

  const createGroup = async () => {
    if (!user || !groupName.trim()) return
    const invite_code = Math.random().toString(36).slice(2, 10)
    const { data, error } = await supabase
      .from('groups')
      .insert({ name: groupName.trim(), owner_id: user.id, invite_code })
      .select('*')
      .maybeSingle()
    if (error || !data) return alert('Could not create group.')
    await supabase.from('group_members').insert({ group_id: data.id, user_id: user.id, role: 'admin' })
    setGroupName('')
    setCreateOpen(false)
    refetchGroups()
    setSelected({ kind: 'group', groupId: data.id })
  }

  const joinGroup = async (groupId: string) => {
    if (!user) return
    const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id, role: 'member' })
    if (error) return alert('Could not join group.')
    refetchGroups()
    setSelected({ kind: 'group', groupId })
  }

  // ------------------------------
  // UI Components
  // ------------------------------
  const TabBtn: React.FC<{ value: Tab; label: string }> = ({ value, label }) => (
    <button
      className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold ${
        tab === value ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
      }`}
      onClick={() => {
        setTab(value)
        if (value === 'ai') setSelected({ kind: 'ai' })
      }}
    >
      {label}
    </button>
  )

  
return (
    <div className="flex h-[calc(100vh-56px-64px)] md:h-auto gap-4">
      {/* Left panel */}
      <div
        className={`w-full md:w-[380px] md:shrink-0 space-y-3 ${
          selected ? 'hidden md:block' : 'block'
        }`}
      >
        <div className="flex gap-2">
          <TabBtn value="inbox" label="Inbox" />
          <TabBtn value="groups" label="Groups" />
          <TabBtn value="ai" label="Frenvio AI" />
        </div>

        {/* Inbox list */}
        {tab === 'inbox' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 text-sm font-bold">Inbox</div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {inboxItems.length === 0 && (
                <div className="p-4 text-sm text-slate-600 dark:text-slate-300">No messages yet.</div>
              )}
              {inboxItems.map((it: any) => {
                const o = it.other || {}
                const name = o.display_name || o.username || 'User'
                const uname = o.username ? '@' + o.username : ''
                const last = it.last
                const preview =
                  last?.message_type === 'image'
                    ? '📷 Photo'
                    : last?.message_type === 'audio'
                      ? '🎤 Voice message'
                      : (last?.content || '').slice(0, 60) || 'Say hi 👋'
                const time = last?.created_at ? formatRelativeTime(last.created_at) : ''
                return (
                  <button
                    key={it.roomId}
                    onClick={() => setSelected({ kind: 'dm', otherUserId: it.otherId })}
                    className={`w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      selected?.kind === 'dm' && selected.otherUserId === it.otherId ? 'bg-slate-50 dark:bg-slate-800' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={o.avatar_url || '/default-avatar.svg'}
                        className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                        alt=""
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex items-center gap-1">
                            <div className="font-bold truncate">{name}</div>
                            {o.verified ? <VerifiedBadge /> : null}
                            <div className="text-xs text-slate-500 truncate ml-1">{uname}</div>
                          </div>
                          <div className="text-xs text-slate-500">{time}</div>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <div className="text-xs text-slate-600 dark:text-slate-300 truncate">{preview}</div>
                          {it.unread ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">New</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Groups */}
        {tab === 'groups' && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="text-sm font-bold">Groups</div>
                <button
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="h-4 w-4" /> Create
                </button>
              </div>

              <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm"
                    placeholder="Search groups to join..."
                  />
                </div>
                {groupSearch.trim().length >= 2 && groupSearchResults.length > 0 && (
                  <div className="mt-2 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {groupSearchResults.map((g: any) => (
                      <div key={g.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900">
                        <div className="min-w-0">
                          <div className="font-bold truncate">{g.name}</div>
                          <div className="text-xs text-slate-500">Tap join to enter</div>
                        </div>
                        <button
                          className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
                          onClick={() => joinGroup(g.id)}
                        >
                          Join
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 border-b border-slate-200 dark:border-slate-800 text-sm font-bold">Your groups</div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {myGroups.length === 0 && (
                  <div className="p-4 text-sm text-slate-600 dark:text-slate-300">You’re not in any groups yet.</div>
                )}
                {myGroups.map((it: any) => {
                  const g = it.group
                  const latest = it.latest
                  const preview = latest
                    ? (latest.message_type === 'image' ? '📷 Photo' : latest.message_type === 'audio' ? '🎤 Voice' : (latest.content || '').slice(0, 50))
                    : 'No messages yet'
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelected({ kind: 'group', groupId: g.id })}
                      className={`w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        selected?.kind === 'group' && selected.groupId === g.id ? 'bg-slate-50 dark:bg-slate-800' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold truncate">{g.name}</div>
                        {it.unread ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">New</span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 truncate">{preview}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Frenvio AI placeholder */}
        {tab === 'ai' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 text-sm font-bold">Frenvio AI</div>
            <div className="p-4 text-sm text-slate-600 dark:text-slate-300">Coming soon.</div>
            <button
              className="m-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold"
              onClick={() => setSelected({ kind: 'ai' })}
            >
              Open chat
            </button>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className={`flex-1 min-w-0 ${selected ? 'block' : 'hidden md:block'}`}>
        {selected?.kind === 'dm' ? (
          <DMChatRoom
            otherUserId={selected.otherUserId}
            initialMessage={shareParam ? decodeURIComponent(shareParam) : ''}
            onBack={() => setSelected(null)}
          />
        ) : selected?.kind === 'group' ? (
          <GroupChatRoom groupId={selected.groupId} onBack={() => setSelected(null)} />
        ) : selected?.kind === 'ai' ? (
          <AIChatRoom onBack={() => setSelected(null)} />
        ) : (
          <div className="h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-600 dark:text-slate-300 flex items-center justify-center">
            Select a conversation to start chatting.
          </div>
        )}
      </div>

      {createOpen && (
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setCreateOpen(false)}>
          <div
            className="w-full md:max-w-lg bg-white dark:bg-slate-950 rounded-t-2xl md:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold">Create group</div>
            <div className="p-4 space-y-3">
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-slate-900 dark:text-slate-100"
              />
              <button onClick={createGroup} className="w-full px-4 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700">
                Create
              </button>
              <button onClick={() => setCreateOpen(false)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chat
