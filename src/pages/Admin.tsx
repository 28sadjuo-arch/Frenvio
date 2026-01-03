import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, Profile } from '../lib/supabase'
import { ShieldCheck } from 'lucide-react'

const Admin: React.FC = () => {
  const [search, setSearch] = useState('')

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      let q = supabase.from('profiles').select('*').order('username', { ascending: true }).limit(100)
      if (search.trim()) q = q.ilike('username', `%${search}%`)
      const { data, error } = await q
      if (error) return []
      return (data || []) as Profile[]
    },
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold tracking-tight">Admin</h1>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users…"
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 outline-none"
        />

        {isLoading && <div className="mt-3 text-sm text-slate-500">Loading…</div>}

        <div className="mt-4 space-y-2">
          {(users || []).map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-3">
              <div>
                <div className="font-semibold">{u.username}</div>
                <div className="text-xs text-slate-500">{u.id}</div>
              </div>
              <div className="flex items-center gap-2">
                {!!u.verified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
              </div>
            </div>
          ))}
          {(!users || users.length === 0) && !isLoading && <div className="text-sm text-slate-500">No users.</div>}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Note: real admin controls should be implemented with Supabase roles + Row Level Security.
      </p>
    </div>
  )
}

export default Admin
