import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase, Profile as ProfileType } from '../lib/supabase'
import ProfileHeader from '../components/profile/ProfileHeader'
import ProfilePosts from '../components/profile/ProfilePosts'

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = React.useState<'posts' | 'reposts' | 'photos'>('posts')

  const { data: profile, refetch, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      if (!id) return null
      const isUuid = /^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(id)
      const q = supabase.from('profiles').select('*')
      const { data, error } = isUuid ? await q.eq('id', id).maybeSingle() : await q.eq('username', id).maybeSingle()
      if (error) return null
      return data as ProfileType | null
    },
    enabled: !!id,
  })

  if (isLoading) return <div className="text-sm text-slate-500">Loading…</div>
  if (!profile) return <div className="text-sm text-slate-500">Profile not found.</div>

  const TabBtn = ({ value, label }: { value: typeof tab; label: string }) => {
    const active = tab === value
    return (
      <button
        onClick={() => setTab(value)}
        className={`flex-1 py-3 text-sm font-semibold border-b-2 transition ${active ? 'border-blue-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <ProfileHeader profile={profile} onUpdated={() => refetch()} />

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex">
          <TabBtn value="posts" label="Posts" />
          <TabBtn value="reposts" label="Reposts" />
          <TabBtn value="photos" label="Photos" />
        </div>
        <div className="p-4">
          <ProfilePosts userId={profile.id} mode={tab} />
        </div>
      </div>
    </div>
  )
}

export default Profile
