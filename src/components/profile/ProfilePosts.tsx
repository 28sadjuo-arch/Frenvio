import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, Post } from '../../lib/supabase'
import PostCard from '../social/PostCard'

interface ProfilePostsProps {
  userId: string
  mode?: 'posts' | 'reposts' | 'photos'
}

const ProfilePosts: React.FC<ProfilePostsProps> = ({ userId, mode = 'posts' }) => {
  const { data: posts } = useQuery({
    queryKey: ['profilePosts', userId, mode],
    queryFn: async () => {
      try {
        if (mode === 'reposts') {
          const { data: rep } = await supabase
            .from('post_reposts')
            .select('post_id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          const ids = (rep || []).map((r: any) => r.post_id).filter(Boolean)
          if (!ids.length) return []

          const { data } = await supabase.from('posts').select('*').in('id', ids)
          return (data || []) as Post[]
        }

        let q = supabase
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (mode === 'photos') q = q.not('image_url', 'is', null)

        const { data } = await q
        return (data || []) as Post[]
      } catch {
        return []
      }
    },
  })

  return (
    <div className="space-y-4">
      {posts?.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {!posts?.length && <div className="text-sm text-slate-500">No posts yet.</div>}
    </div>
  )
}

export default ProfilePosts
