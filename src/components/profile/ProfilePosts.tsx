import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, Post } from '../../lib/supabase'
import PostCard from '../social/PostCard'

interface ProfilePostsProps {
  userId: string
}

const ProfilePosts: React.FC<ProfilePostsProps> = ({ userId }) => {
  const { data: posts } = useQuery({
    queryKey: ['posts', userId],
    queryFn: async () => {
      const { data } = await supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      return data as Post[]
    }
  })

  return (
    <div className="space-y-4">
      {posts?.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}

export default ProfilePosts