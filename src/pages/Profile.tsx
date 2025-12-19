import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase, Profile } from '../lib/supabase'
import ProfileHeader from '../components/profile/ProfileHeader'
import ProfilePosts from '../components/profile/ProfilePosts'

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const { data: profile } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
      return data as Profile
    }
  })

  if (!profile) return <div>Loading...</div>

  return (
    <div>
      <ProfileHeader profile={profile} />
      <ProfilePosts userId={id!} />
    </div>
  )
}

export default Profile