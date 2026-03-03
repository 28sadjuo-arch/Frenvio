import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, Post } from '../../lib/supabase'
import PostCard from '../social/PostCard'
import { getPinnedPostIds } from '../../utilis/pins'

interface ProfilePostsProps {
  userId: string
  mode?: 'posts' | 'reposts' | 'photos'
  variant?: 'card' | 'embedded'
}

const ProfilePosts: React.FC<ProfilePostsProps> = ({ userId, mode = 'posts', variant = 'card' }) => {
  const { data: pinnedIds = [] } = useQuery({
    queryKey: ['pinnedPosts', userId],
    enabled: mode === 'posts',
    queryFn: async () => await getPinnedPostIds(userId),
    staleTime: 30_000,
  })

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
          const map = new Map((data || []).map((p: any) => [p.id, p]))
          // Preserve repost order (newest repost first)
          return ids.map((id: string) => map.get(id)).filter(Boolean) as Post[]
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

  const displayPosts = React.useMemo(() => {
    const rows = posts || []
    if (mode !== 'posts' || !pinnedIds?.length) return rows
    const pinnedSet = new Set(pinnedIds)
    const pinned = rows.filter((p) => pinnedSet.has(p.id))
    const rest = rows.filter((p) => !pinnedSet.has(p.id))
    pinned.sort((a, b) => pinnedIds.indexOf(a.id) - pinnedIds.indexOf(b.id))
    return [...pinned, ...rest]
  }, [posts, pinnedIds, mode])

  return (
    <div
      className={
        variant === 'card'
          ? 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden divide-y divide-slate-200 dark:divide-slate-800'
          : 'bg-white dark:bg-slate-950 overflow-hidden divide-y divide-slate-200 dark:divide-slate-800'
      }
    >
      {displayPosts?.map((post) => (
        <div key={post.id}>
          {mode === 'posts' && pinnedIds?.includes(post.id) ? (
            <div className="px-4 pt-3 text-[11px] text-slate-500 font-semibold">📌 Pinned</div>
          ) : null}
          <PostCard post={post} variant="feed" />
        </div>
      ))}
      {!displayPosts?.length && <div className="p-4 text-sm text-slate-500">No posts yet.</div>}
    </div>
  )
}

export default ProfilePosts
