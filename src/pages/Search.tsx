import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search as SearchIcon } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Post, supabase } from '../lib/supabase'
import SearchResults from '../components/search/SearchResults'
import PostCard from '../components/social/PostCard'

const Search: React.FC = () => {
  const [params] = useSearchParams()
  const urlQ = params.get('q') || ''
  const [query, setQuery] = useState(urlQ)

  useEffect(() => {
    // Sync when arriving from hashtag links
    setQuery(urlQ)
  }, [urlQ])

  const isHashtag = useMemo(() => query.trim().startsWith('#'), [query])
  const tag = useMemo(() => query.trim().replace(/^#+/, ''), [query])

  const { data: people, isFetching: peopleLoading } = useQuery({
    queryKey: ['search-people', query],
    queryFn: async () => {
      if (!query.trim() || isHashtag) return []
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, verified, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20)

      if (error) return []
      return data || []
    },
    enabled: query.trim().length > 0,
  })

  const { data: posts, isFetching: postsLoading } = useQuery({
    queryKey: ['search-posts', tag],
    queryFn: async () => {
      if (!tag) return []
      // Best-effort: search posts that contain the hashtag in content
      const needle = `#${tag}`
      const { data, error } = await supabase
        .from('posts')
        .select('id, user_id, content, image_url, likes, reposts, created_at')
        .ilike('content', `%${needle}%`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) return []
      return (data || []) as Post[]
    },
    enabled: isHashtag && tag.length > 0,
  })

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4">
      <h1 className="text-xl font-extrabold tracking-tight mb-3">Search</h1>

      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2">
        <SearchIcon className="h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search people or #tags…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {(peopleLoading || postsLoading) && <div className="mt-3 text-sm text-slate-500">Searching…</div>}

      <div className="mt-4">
        {isHashtag ? (
          (posts && posts.length) ? (
            <div className="space-y-3">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No posts found for #{tag}.</div>
          )
        ) : (
          <SearchResults results={people || []} />
        )}
      </div>
    </div>
  )
}

export default Search
