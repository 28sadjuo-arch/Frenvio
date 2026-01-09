import React from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import PostCard from '../components/social/PostCard'
import CommentsThread from '../components/social/CommentsThread'

const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const location = useLocation()
  React.useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('focus') === 'comments') {
      const el = document.getElementById('comments-thread')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.search])


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
      <div id="comments-thread"><CommentsThread postId={id!} postOwnerId={(post as any)?.user_id} /></div>
    </div>
  )
}

export default PostPage
