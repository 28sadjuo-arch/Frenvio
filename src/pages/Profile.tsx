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
      return data as ProfileType
    },
    enabled: !!id,
  })

  if (isLoading) return <div className="text-sm text-slate-500">Loading…</div>
  if (!profile) return <div className="text-sm text-slate-500">Profile not found.</div>

  return (
    <div className="space-y-4">
      <ProfileHeader profile={profile} onUpdated={() => refetch()} />
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Posts</div>
        <ProfilePosts userId={profile.id} mode={tab} />
      </div>
    </div>
  )
}

export default Profile
