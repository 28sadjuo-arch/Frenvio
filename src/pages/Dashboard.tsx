import React from 'react'
import PostComposer from '../components/social/PostComposer'
import PostCard from '../components/social/PostCard'
import { useAuth } from '../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { supabase, Post } from '../lib/supabase'

const Dashboard: React.FC = () => {
  const { user } = useAuth()

  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false })
      return data as Post[]
    }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Your Feed</h1>
      <PostComposer />
      <div className="space-y-4 mt-4">
        {posts?.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}

export default Dashboard