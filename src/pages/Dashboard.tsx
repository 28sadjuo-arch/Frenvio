import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, Post } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PostComposer from '../components/social/PostComposer'
import PostCard from '../components/social/PostCard'

type FeedTab = 'for_you' | 'following'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState<FeedTab>('for_you')
  // Keep a stable seed so "For you" doesn't reshuffle on every render.
  const [forYouSeed] = useState(() => String(Date.now()))
  const PAGE_SIZE = 20

  const sentinelRef = useRef<HTMLDivElement | null>(null)

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

  const randomizedForYouPosts = useMemo(() => {
    if (tab !== 'for_you') return posts
    // Deterministic pseudo-random sort using a seed so order is stable per session.
    const hash = (s: string) => {
      let h = 2166136261
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i)
        h = Math.imul(h, 16777619)
      }
      return h >>> 0
    }
    return [...posts].sort((a, b) => {
      const ha = hash(`${forYouSeed}-${a.id}`)
      const hb = hash(`${forYouSeed}-${b.id}`)
      return ha - hb
    })
  }, [posts, tab, forYouSeed])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    if (!hasNextPage) return

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '800px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, tab])

  // When the bottom "Home" button is tapped while already on dashboard:
  // scroll to top happens in BottomNav; here we refresh the feed.
  useEffect(() => {
    const onHome = () => {
      qc.invalidateQueries({ queryKey: feedQuery })
    }
    window.addEventListener('dashboard-home', onHome as any)
    return () => window.removeEventListener('dashboard-home', onHome as any)
  }, [qc, feedQuery])

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
        {(randomizedForYouPosts || []).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {/* Infinite scroll sentinel (replaces "Load more" button) */}
        <div ref={sentinelRef} className="h-10" />
        {isFetchingNextPage && (
          <div className="pt-2 flex justify-center text-sm text-slate-500">Loading…</div>
        )}
        {!hasNextPage && (randomizedForYouPosts || []).length > 0 && (
          <div className="pt-2 flex justify-center text-xs text-slate-500">No more posts</div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
