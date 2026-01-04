import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import ChatRoom from '../components/chat/ChatRoom'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'

type Tab = 'inbox' | 'groups' | 'requests'

const Chat: React.FC = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('inbox')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const toParam = searchParams.get('to')
  const shareParam = searchParams.get('share')

  useEffect(() => {
    if (toParam) setSelectedUserId(toParam)
  }, [toParam])

  const { data: users } = useQuery({
    queryKey: ['chat-users'],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, verified')
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) return []
      return data || []
    },
    enabled: !!user,
  })

  const { data: groups, refetch: refetchGroups } = useQuery({
    queryKey: ['groups', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('group_members')
        .select('group:groups(id, name, invite_code, created_at)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) return []
      return (data || []).map((x: any) => x.group).filter(Boolean)
    },
    enabled: !!user,
  })

  const [createOpen, setCreateOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [joinCode, setJoinCode] = useState('')

  const createGroup = async () => {
    if (!user || !groupName.trim()) return
    const invite_code = Math.random().toString(36).slice(2, 8).toUpperCase()
    const { data, error } = await supabase.from('groups').insert({ name: groupName.trim(), owner_id: user.id, invite_code }).select('*').maybeSingle()
    if (!error && data) {
      await supabase.from('group_members').insert({ group_id: data.id, user_id: user.id, role: 'admin' })
      setGroupName('')
      setCreateOpen(false)
      refetchGroups()
    } else {
      alert('Could not create group.')
    }
  }

  const joinGroup = async () => {
    if (!user || !joinCode.trim()) return
    const code = joinCode.trim().toUpperCase()
    const { data: g } = await supabase.from('groups').select('id').eq('invite_code', code).maybeSingle()
    if (!g?.id) return alert('Invalid invite code.')
    const { error } = await supabase.from('group_members').insert({ group_id: g.id, user_id: user.id, role: 'member' })
    if (error) return alert('Could not join (maybe already joined).')
    setJoinCode('')
    refetchGroups()
    setTab('groups')
  }

  const TabBtn = ({ value, label }: { value: Tab; label: string }) => {
    const active = tab === value
    return (
      <button
        onClick={() => setTab(value)}
        className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${active ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'}`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 grid gap-4 md:grid-cols-4">
      <div className="md:col-span-1">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
          <div className="flex gap-2">
            <TabBtn value="inbox" label="Inbox" />
            <TabBtn value="groups" label="Groups" />
            <TabBtn value="requests" label="Requests" />
          </div>

          {tab === 'inbox' && (
            <div className="mt-3 space-y-1">
              {(users || []).map((u: any) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 ${selectedUserId === u.id ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                >
                  <div className="text-sm font-semibold">{u.display_name || u.username}</div>
                  <div className="text-xs text-slate-500">@{u.username}</div>
                </button>
              ))}
              {(!users || users.length === 0) && <div className="text-sm text-slate-500 p-2">No users found.</div>}
            </div>
          )}

          {tab === 'groups' && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCreateOpen(true)}
                  className="flex-1 px-3 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Create group
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-sm font-semibold mb-2">Join with code</div>
                <div className="flex gap-2">
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Invite code"
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-slate-900 dark:text-slate-100"
                  />
                  <button onClick={joinGroup} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
                    Join
                  </button>
                </div>
              </div>

              <div className="text-sm font-semibold">Your groups</div>
              <div className="space-y-1">
                {(groups || []).map((g: any) => (
                  <div key={g.id} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="font-semibold">{g.name}</div>
                    <div className="text-xs text-slate-500">Invite: {g.invite_code}</div>
                  </div>
                ))}
                {(!groups || groups.length === 0) && <div className="text-sm text-slate-500">No groups yet.</div>}
              </div>
            </div>
          )}

          {tab === 'requests' && (
            <div className="mt-3 text-sm text-slate-500 p-2">
              No requests yet.
            </div>
          )}
        </div>

        {createOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setCreateOpen(false)}>
            <div className="w-full md:max-w-sm bg-white dark:bg-slate-950 rounded-t-2xl md:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-extrabold">Create group</div>
              <div className="p-4 space-y-3">
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-slate-900 dark:text-slate-100"
                />
                <button onClick={createGroup} className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">
                  Create
                </button>
                <button onClick={() => setCreateOpen(false)} className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="md:col-span-3">
        {selectedUserId ? (
          <ChatRoom otherUserId={selectedUserId} initialMessage={shareParam ? decodeURIComponent(shareParam) : ''} />
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-600 dark:text-slate-300">
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
