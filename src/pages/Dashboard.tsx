import React, { useMemo, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { supabase, Post } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PostComposer from '../components/social/PostComposer'
import PostCard from '../components/social/PostCard'

type FeedTab = 'for_you' | 'following'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState<FeedTab>('for_you')
  const PAGE_SIZE = 20

  const { data: followingIds } = useQuery({
    queryKey: ['followingIds', user?.id],
    queryFn: async () => {
      if (!user) return []
      // Expected table: follows(follower_id, following_id)
      const { data, error } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
      if (error) return []
      return (data || []).map((r: any) => r.following_id) as string[]
    },
    enabled: !!user,
  })

  const feedQuery = useMemo(() => {
    const key = tab === 'for_you' ? ['posts', 'for_you'] : ['posts', 'following', followingIds]
    return key
  }, [tab, followingIds])

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: feedQuery,
    queryFn: async ({ pageParam }) => {
      let q = supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(PAGE_SIZE)

      if (tab === 'following') {
        if (!followingIds || followingIds.length === 0) return []
        q = q.in('user_id', followingIds)
      }

      if (pageParam) {
        q = q.lt('created_at', pageParam as string)
      }

      const { data, error } = await q
      if (error) return []
      return data as Post[]
    },
    initialPageParam: null as null | string,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined
      const last = lastPage[lastPage.length - 1]
      return last?.created_at || undefined
    },
  })

  const posts = (data?.pages || []).flat()

  return (
    <div className="mx-auto w-full max-w-none px-4 pt-4">
      <div className="sticky top-[56px] md:top-[60px] z-40 -mx-4 px-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex">
          <button
            onClick={() => setTab('for_you')}
            className={`flex-1 py-3 text-sm font-semibold ${tab === 'for_you' ? 'text-slate-900 dark:text-white border-b-2 border-blue-600' : 'text-slate-500 dark:text-slate-400'}`}
          >
            For you
          </button>
          <button
            onClick={() => setTab('following')}
            className={`flex-1 py-3 text-sm font-semibold ${tab === 'following' ? 'text-slate-900 dark:text-white border-b-2 border-blue-600' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Following
          </button>
        </div>
      </div>

      <PostComposer />

      <div className="mt-4 space-y-3">
        {isLoading && <div className="text-sm text-slate-500">Loading…</div>}
        {!isLoading && (posts || []).length === 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-sm text-slate-600 dark:text-slate-300">
            {tab === 'following' ? "You're not following anyone yet — find people in Search." : "No posts yet. Be the first to post!"}
          </div>
        )}
        {(posts || []).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {hasNextPage && (
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-5 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold disabled:opacity-60"
            >
              {isFetchingNextPage ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
