import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import PostCard from '../components/social/PostCard'
import CommentsThread from '../components/social/CommentsThread'

const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      if (!id) return null
      const { data } = await supabase.from('posts').select('*').eq('id', id).maybeSingle()
      return data || null
    },
    enabled: !!id,
  })

  if (isLoading) return <div className="mx-auto max-w-3xl px-4 pt-4 text-sm text-slate-500">Loading…</div>
  if (!post) return <div className="mx-auto max-w-3xl px-4 pt-4 text-sm text-slate-500">Post not found.</div>

  return (
    <div className="mx-auto max-w-3xl px-4 pt-4">
      <PostCard post={post as any} />
      <CommentsThread postId={id!} />
    </div>
  )
}

export default PostPage
